#!/usr/bin/env tsx
/**
 * Script completo para configurar todas as integrações de webhook
 * 
 * Uso: npx tsx scripts/configurar-webhooks-completo.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Carregar variáveis de ambiente
try {
  const envPath = join(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  // Ignorar
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Credenciais do Supabase não configuradas')
  console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Configurar webhook do Telegram
 */
async function configureTelegramWebhook(botToken: string, webhookUrl: string) {
  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || 'Erro ao configurar webhook',
        data,
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Verificar status do webhook do Telegram
 */
async function getTelegramWebhookInfo(botToken: string) {
  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    
    const response = await fetch(telegramApiUrl, {
      method: 'GET',
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || 'Erro ao buscar informações',
        data,
      }
    }

    return { success: true, data: data.result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Configurar todas as integrações
 */
async function main() {
  console.log('🚀 Iniciando configuração completa de webhooks...\n')

  // 1. Buscar todas as empresas
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, settings')
    .limit(100)

  if (companiesError) {
    console.error('❌ Erro ao buscar empresas:', companiesError)
    process.exit(1)
  }

  if (!companies || companies.length === 0) {
    console.error('❌ Nenhuma empresa encontrada')
    process.exit(1)
  }

  console.log(`📋 Encontradas ${companies.length} empresa(s)\n`)

  const webhookUrl = `${APP_URL}/api/webhooks/telegram`
  console.log(`🌐 URL do webhook do Controlia: ${webhookUrl}\n`)

  // 2. Configurar webhook do Telegram para cada empresa
  for (const company of companies) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🏢 Empresa: ${company.name || company.id}`)
    console.log(`${'='.repeat(60)}`)

    const settings = (company.settings as Record<string, unknown>) || {}
    const botToken = (settings.telegram_bot_token as string) || ''
    const n8nSecret = (settings.n8n_webhook_secret as string) || ''

    // 2.1. Verificar Bot Token
    if (!botToken) {
      console.log('⚠️  Bot Token do Telegram não configurado')
      console.log('   Configure em: Configurações > Integrações > Telegram')
      continue
    }

    console.log(`✅ Bot Token configurado: ${botToken.substring(0, 10)}...`)

    // 2.2. Verificar status atual do webhook
    console.log('\n📡 Verificando status atual do webhook...')
    const currentStatus = await getTelegramWebhookInfo(botToken)
    
    if (currentStatus.success && currentStatus.data) {
      const webhookData = currentStatus.data
      console.log(`   URL atual: ${webhookData.url || 'Não configurado'}`)
      console.log(`   Pendências: ${webhookData.pending_update_count || 0}`)
      
      if (webhookData.last_error_date) {
        console.log(`   ⚠️  Último erro: ${new Date(webhookData.last_error_date * 1000).toLocaleString()}`)
        console.log(`   Mensagem: ${webhookData.last_error_message || 'N/A'}`)
      }

      // Verificar se precisa reconfigurar
      if (webhookData.url !== webhookUrl) {
        console.log(`\n🔧 Reconfigurando webhook...`)
        console.log(`   De: ${webhookData.url || 'Não configurado'}`)
        console.log(`   Para: ${webhookUrl}`)
        
        const result = await configureTelegramWebhook(botToken, webhookUrl)
        
        if (result.success) {
          console.log('✅ Webhook reconfigurado com sucesso!')
        } else {
          console.error(`❌ Erro ao reconfigurar: ${result.error}`)
        }
      } else {
        console.log('✅ Webhook já está configurado corretamente!')
      }
    } else {
      console.log('⚠️  Não foi possível verificar status do webhook')
      console.log(`   Tentando configurar...`)
      
      const result = await configureTelegramWebhook(botToken, webhookUrl)
      
      if (result.success) {
        console.log('✅ Webhook configurado com sucesso!')
      } else {
        console.error(`❌ Erro ao configurar: ${result.error}`)
      }
    }

    // 2.3. Verificar n8n Secret
    if (!n8nSecret) {
      console.log('\n⚠️  Secret do n8n não configurado')
      console.log('   Configure em: Configurações > Integrações > n8n')
      console.log('   Valor esperado: N0v4F0rg3@2025')
    } else {
      console.log(`\n✅ Secret do n8n configurado: ${n8nSecret.substring(0, 5)}...`)
    }

    // 2.4. Verificar automações
    console.log('\n🤖 Verificando automações...')
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('id, name, trigger_event, is_active, is_paused, n8n_webhook_url, n8n_workflow_id')
      .eq('company_id', company.id)

    if (automationsError) {
      console.error(`❌ Erro ao buscar automações: ${automationsError.message}`)
      continue
    }

    if (!automations || automations.length === 0) {
      console.log('⚠️  Nenhuma automação encontrada')
      console.log('   Crie automações em: Configurações > n8n')
      continue
    }

    console.log(`   Encontradas ${automations.length} automação(ões):\n`)

    for (const automation of automations) {
      const status = automation.is_active && !automation.is_paused ? '✅ Ativa' : '⏸️  Pausada/Inativa'
      const hasUrl = automation.n8n_webhook_url ? '✅' : '❌'
      const hasSecret = automation.n8n_webhook_url?.includes('secret=') ? '✅' : '⚠️'
      
      console.log(`   ${automation.name}`)
      console.log(`     Status: ${status}`)
      console.log(`     Trigger: ${automation.trigger_event}`)
      console.log(`     Webhook URL: ${hasUrl} ${automation.n8n_webhook_url ? 'Configurada' : 'Não configurada'}`)
      console.log(`     Secret na URL: ${hasSecret}`)
      console.log(`     Workflow ID: ${automation.n8n_workflow_id || 'Não configurado'}`)
      
      // Verificar se é a automação correta para mensagens recebidas
      if (automation.trigger_event === 'new_message') {
        // "Envia Mensagens do App" deve estar pausada (não processa mensagens recebidas)
        if (automation.name.includes('Envia Mensagens do App')) {
          if (automation.is_active && !automation.is_paused) {
            console.log(`     ⚠️  ATENÇÃO: Esta automação deve estar PAUSADA!`)
            console.log(`     💡 Ela não deve processar mensagens recebidas do Telegram`)
          } else {
            console.log(`     ✅ Corretamente pausada (não processa mensagens recebidas)`)
          }
        }
        // "Atendimento com IA" sem "Mensagens Recebidas" pode estar pausada (duplicada)
        else if (automation.name.includes('Atendimento com IA') && !automation.name.includes('Mensagens Recebidas')) {
          if (automation.is_active && !automation.is_paused) {
            console.log(`     ⚠️  ATENÇÃO: Esta automação pode estar duplicada!`)
            console.log(`     💡 Use "Atendimento com IA - Mensagens Recebidas" em vez desta`)
          } else {
            console.log(`     ✅ Corretamente pausada (duplicada)`)
          }
        }
        // "Atendimento com IA - Mensagens Recebidas" deve estar ativa
        else if (automation.name.includes('Mensagens Recebidas') || automation.name.includes('Atendimento com IA')) {
          if (!automation.is_active || automation.is_paused) {
            console.log(`     ⚠️  ATENÇÃO: Esta automação deve estar ATIVA para processar mensagens!`)
          }
          if (!automation.n8n_webhook_url) {
            console.log(`     ⚠️  ATENÇÃO: Configure a URL do webhook do n8n!`)
          }
        }
      }
      console.log('')
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Configuração completa!')
  console.log(`${'='.repeat(60)}\n`)

  console.log('📋 Resumo:')
  console.log(`   - Webhook do Telegram: ${webhookUrl}`)
  console.log(`   - Callback do n8n: ${APP_URL}/api/webhooks/n8n/channel-response`)
  console.log(`   - Secret do n8n: Configure em Configurações > Integrações > n8n`)
  console.log(`\n💡 Próximos passos:`)
  console.log(`   1. Verifique se o webhook do Telegram está apontando para: ${webhookUrl}`)
  console.log(`   2. Configure o secret do n8n nas settings da empresa`)
  console.log(`   3. Ative as automações corretas no banco de dados`)
  console.log(`   4. Ative os workflows no n8n`)
  console.log(`\n📝 Execute o script SQL: supabase/verificar-e-corrigir-automacoes.sql`)
}

main().catch((error) => {
  console.error('❌ Erro:', error)
  process.exit(1)
})

