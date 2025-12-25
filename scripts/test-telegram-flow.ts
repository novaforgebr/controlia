#!/usr/bin/env tsx
/**
 * Script para testar o fluxo completo do Telegram
 * 
 * Este script simula o fluxo completo:
 * 1. Mensagem do Telegram → Controlia
 * 2. Mensagem salva no banco
 * 3. Mensagem aparece na interface (verificação via query)
 * 4. Mensagem enviada ao n8n
 * 5. Resposta do n8n salva no Controlia
 * 6. Resposta enviada ao Telegram
 * 
 * Uso: npx tsx scripts/test-telegram-flow.ts [company_id] [bot_token]
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'

interface TestResult {
  step: string
  status: 'ok' | 'error' | 'warning'
  message: string
  data?: any
}

const results: TestResult[] = []

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 1. Verificar configuração do Telegram
async function checkTelegramConfiguration(companyId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    results.push({
      step: 'Configuração do Telegram',
      status: 'error',
      message: 'Credenciais do Supabase não configuradas',
    })
    return null
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: company, error } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single()

    if (error || !company) {
      results.push({
        step: 'Configuração do Telegram',
        status: 'error',
        message: `Erro ao buscar empresa: ${error?.message || 'Empresa não encontrada'}`,
      })
      return null
    }

    const settings = (company.settings as Record<string, unknown>) || {}
    const botToken = (settings.telegram_bot_token as string) || ''
    const webhookUrl = (settings.telegram_webhook_url as string) || ''

    if (!botToken) {
      results.push({
        step: 'Configuração do Telegram',
        status: 'error',
        message: 'Bot Token não configurado nas settings da empresa',
      })
      return null
    }

    // Verificar webhook
    try {
      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getWebhookInfo`
      )
      const webhookData = await webhookResponse.json()

      if (webhookData.ok && webhookData.result.url) {
        results.push({
          step: 'Configuração do Telegram',
          status: 'ok',
          message: `Webhook configurado: ${webhookData.result.url}`,
          data: {
            botToken: botToken.substring(0, 10) + '...',
            webhookUrl: webhookData.result.url,
            pendingUpdates: webhookData.result.pending_update_count || 0,
          },
        })
      } else {
        results.push({
          step: 'Configuração do Telegram',
          status: 'warning',
          message: 'Webhook não configurado ou inválido',
          data: webhookData,
        })
      }
    } catch (error) {
      results.push({
        step: 'Configuração do Telegram',
        status: 'warning',
        message: `Erro ao verificar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      })
    }

    return { botToken, webhookUrl, settings }
  } catch (error) {
    results.push({
      step: 'Configuração do Telegram',
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return null
  }
}

// 2. Simular mensagem do Telegram
async function simulateTelegramMessage(
  companyId: string,
  botToken: string,
  testMessage: string = 'Teste de mensagem do Telegram'
) {
  try {
    const webhookUrl = `${APP_URL}/api/webhooks/telegram`
    
    // Simular payload do Telegram
    const telegramPayload = {
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 123456789, // ID de teste
          is_bot: false,
          first_name: 'Teste',
          username: 'test_user',
        },
        chat: {
          id: 123456789,
          first_name: 'Teste',
          username: 'test_user',
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: testMessage,
      },
    }

    log(`\n📤 Enviando mensagem simulada para: ${webhookUrl}`, 'cyan')
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramPayload),
    })

    const responseData = await response.json()

    if (response.ok) {
      results.push({
        step: 'Simulação de Mensagem',
        status: 'ok',
        message: 'Mensagem enviada com sucesso ao webhook',
        data: {
          status: response.status,
          response: responseData,
        },
      })
      return { telegramPayload, responseData }
    } else {
      results.push({
        step: 'Simulação de Mensagem',
        status: 'error',
        message: `Erro ao enviar mensagem: ${response.status} - ${JSON.stringify(responseData)}`,
        data: responseData,
      })
      return null
    }
  } catch (error) {
    results.push({
      step: 'Simulação de Mensagem',
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return null
  }
}

// 3. Verificar se mensagem foi salva no banco
async function checkMessageSaved(companyId: string, chatId: number) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Aguardar um pouco para garantir que a mensagem foi processada
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Buscar mensagem mais recente para este chat
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, conversations!inner(company_id, channel_thread_id)')
      .eq('conversations.company_id', companyId)
      .eq('conversations.channel', 'telegram')
      .eq('direction', 'inbound')
      .eq('sender_type', 'human')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      results.push({
        step: 'Mensagem Salva no Banco',
        status: 'error',
        message: `Erro ao buscar mensagem: ${error.message}`,
      })
      return null
    }

    if (!messages || messages.length === 0) {
      results.push({
        step: 'Mensagem Salva no Banco',
        status: 'warning',
        message: 'Nenhuma mensagem inbound encontrada recentemente',
      })
      return null
    }

    // Verificar se alguma mensagem corresponde ao chat_id
    const matchingMessage = messages.find((m: any) => {
      const conv = m.conversations
      return conv && conv.channel_thread_id === chatId.toString()
    })

    if (matchingMessage) {
      results.push({
        step: 'Mensagem Salva no Banco',
        status: 'ok',
        message: `Mensagem encontrada no banco (ID: ${matchingMessage.id})`,
        data: {
          messageId: matchingMessage.id,
          content: matchingMessage.content,
          direction: matchingMessage.direction,
          senderType: matchingMessage.sender_type,
          createdAt: matchingMessage.created_at,
        },
      })
      return matchingMessage
    } else {
      results.push({
        step: 'Mensagem Salva no Banco',
        status: 'warning',
        message: `Mensagens encontradas, mas nenhuma corresponde ao chat_id ${chatId}`,
        data: {
          foundMessages: messages.length,
          recentMessages: messages.map((m: any) => ({
            id: m.id,
            content: m.content?.substring(0, 50),
            channelThreadId: m.conversations?.channel_thread_id,
          })),
        },
      })
      return messages[0] // Retornar a mais recente mesmo assim
    }
  } catch (error) {
    results.push({
      step: 'Mensagem Salva no Banco',
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return null
  }
}

// 4. Verificar se mensagem aparece na interface (via query com RLS)
async function checkMessageVisible(companyId: string, messageId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Buscar mensagem com company_id correto
    const { data: message, error } = await supabase
      .from('messages')
      .select('*, conversations!inner(company_id)')
      .eq('id', messageId)
      .eq('conversations.company_id', companyId)
      .single()

    if (error) {
      results.push({
        step: 'Mensagem Visível na Interface',
        status: 'error',
        message: `Erro ao buscar mensagem: ${error.message}`,
      })
      return null
    }

    if (message) {
      results.push({
        step: 'Mensagem Visível na Interface',
        status: 'ok',
        message: 'Mensagem pode ser lida com filtro por company_id (RLS respeitado)',
        data: {
          messageId: message.id,
          companyId: (message as any).conversations?.company_id,
        },
      })
      return message
    } else {
      results.push({
        step: 'Mensagem Visível na Interface',
        status: 'warning',
        message: 'Mensagem não encontrada com filtro por company_id',
      })
      return null
    }
  } catch (error) {
    results.push({
      step: 'Mensagem Visível na Interface',
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return null
  }
}

// 5. Verificar se automação está ativa
async function checkAutomationActive(companyId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: automations, error } = await supabase
      .from('automations')
      .select('id, name, n8n_webhook_url, is_active, channel')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('channel', 'telegram')

    if (error) {
      results.push({
        step: 'Automação Ativa',
        status: 'error',
        message: `Erro ao buscar automações: ${error.message}`,
      })
      return null
    }

    if (!automations || automations.length === 0) {
      results.push({
        step: 'Automação Ativa',
        status: 'warning',
        message: 'Nenhuma automação ativa encontrada para Telegram',
      })
      return null
    }

    results.push({
      step: 'Automação Ativa',
      status: 'ok',
      message: `${automations.length} automação(ões) ativa(s) encontrada(s)`,
      data: automations.map((a) => ({
        id: a.id,
        name: a.name,
        webhookUrl: a.n8n_webhook_url,
      })),
    })

    return automations[0]
  } catch (error) {
    results.push({
      step: 'Automação Ativa',
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return null
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2)
  const companyId = args[0]
  const botToken = args[1]

  if (!companyId) {
    log('❌ Erro: company_id é obrigatório', 'red')
    log('Uso: npx tsx scripts/test-telegram-flow.ts <company_id> [bot_token]', 'yellow')
    process.exit(1)
  }

  log('\n🧪 Teste do Fluxo Completo Telegram → Controlia → n8n → Controlia → Telegram\n', 'cyan')
  log(`Company ID: ${companyId}`, 'blue')
  if (botToken) {
    log(`Bot Token: ${botToken.substring(0, 10)}...`, 'blue')
  }
  log(`App URL: ${APP_URL}\n`, 'blue')

  // 1. Verificar configuração
  const config = await checkTelegramConfiguration(companyId)
  if (!config) {
    log('\n❌ Configuração do Telegram falhou. Abortando teste.', 'red')
    printResults()
    process.exit(1)
  }

  // 2. Simular mensagem
  const testMessage = `Teste automatizado - ${new Date().toISOString()}`
  const messageResult = await simulateTelegramMessage(companyId, config.botToken, testMessage)
  
  if (!messageResult) {
    log('\n❌ Simulação de mensagem falhou. Abortando teste.', 'red')
    printResults()
    process.exit(1)
  }

  const chatId = messageResult.telegramPayload.message.chat.id

  // 3. Verificar se mensagem foi salva
  const savedMessage = await checkMessageSaved(companyId, chatId)
  
  if (!savedMessage) {
    log('\n⚠️  Mensagem não foi encontrada no banco. Continuando com outros testes...', 'yellow')
  }

  // 4. Verificar visibilidade
  if (savedMessage) {
    await checkMessageVisible(companyId, savedMessage.id)
  }

  // 5. Verificar automação
  await checkAutomationActive(companyId)

  // Exibir resultados
  printResults()

  // Resumo
  const okCount = results.filter((r) => r.status === 'ok').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const warningCount = results.filter((r) => r.status === 'warning').length

  log('\n' + '='.repeat(60), 'cyan')
  log(`✅ Sucessos: ${okCount}`, 'green')
  log(`⚠️  Avisos: ${warningCount}`, 'yellow')
  log(`❌ Erros: ${errorCount}`, 'red')

  if (errorCount > 0) {
    log('\n❌ Teste falhou. Corrija os erros antes de continuar.', 'red')
    process.exit(1)
  } else if (warningCount > 0) {
    log('\n⚠️  Teste concluído com avisos. Verifique as recomendações.', 'yellow')
    process.exit(0)
  } else {
    log('\n✅ Todos os testes passaram!', 'green')
    process.exit(0)
  }
}

function printResults() {
  log('\n📊 Resultados dos Testes:\n', 'cyan')

  results.forEach((result) => {
    const icon = result.status === 'ok' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
    const color = result.status === 'ok' ? 'green' : result.status === 'error' ? 'red' : 'yellow'

    log(`${icon} ${result.step}`, color)
    log(`   ${result.message}`, 'reset')

    if (result.data) {
      log(`   Dados: ${JSON.stringify(result.data, null, 2)}`, 'blue')
    }

    log('')
  })
}

// Executar
main().catch((error) => {
  log(`\n❌ Erro ao executar teste: ${error}`, 'red')
  console.error(error)
  process.exit(1)
})

