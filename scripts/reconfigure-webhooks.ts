#!/usr/bin/env tsx
/**
 * Script para reconfigurar todos os webhooks do Telegram e validar configurações
 * 
 * Uso: npx tsx scripts/reconfigure-webhooks.ts [--validate-only] [--reconfigure]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Carregar variáveis de ambiente do .env.local se existir
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
  // Arquivo .env.local não existe ou não pode ser lido, usar variáveis de ambiente do sistema
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

interface CompanyConfig {
  id: string
  name: string
  botToken: string | null
  customWebhookUrl: string | null
  n8nSecret: string | null
}

interface WebhookResult {
  companyId: string
  companyName: string
  success: boolean
  webhookUrl: string | null
  error?: string
  webhookInfo?: any
}

/**
 * Configurar webhook do Telegram
 */
async function configureTelegramWebhook(botToken: string, webhookUrl: string): Promise<{ success: boolean; error?: string; data?: any }> {
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
 * Verificar status do webhook
 */
async function getTelegramWebhookInfo(botToken: string): Promise<{ success: boolean; error?: string; data?: any }> {
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
 * Buscar todas as empresas e suas configurações
 */
async function getAllCompanies(): Promise<CompanyConfig[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Credenciais do Supabase não configuradas')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, settings')
    .limit(1000)

  if (error) {
    throw new Error(`Erro ao buscar empresas: ${error.message}`)
  }

  return (companies || []).map((company) => {
    const settings = (company.settings as Record<string, unknown>) || {}
    return {
      id: company.id,
      name: company.name,
      botToken: (settings.telegram_bot_token as string) || null,
      customWebhookUrl: (settings.telegram_webhook_url as string) || null,
      n8nSecret: (settings.n8n_webhook_secret as string) || null,
    }
  })
}

/**
 * Buscar automações do n8n
 */
async function getN8nAutomations(companyId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Buscar todas as automações ativas (a coluna channel pode não existir)
  const { data: automations, error } = await supabase
    .from('automations')
    .select('id, name, n8n_webhook_url, is_active')
    .eq('company_id', companyId)
    .eq('is_active', true)

  if (error) {
    console.error(`Erro ao buscar automações para empresa ${companyId}:`, error)
    return []
  }

  return automations || []
}

/**
 * Validar todas as configurações
 */
async function validateAllConfigurations() {
  log('\n🔍 Validando todas as configurações de webhooks...\n', 'cyan')

  const companies = await getAllCompanies()
  const expectedWebhookUrl = `${APP_URL}/api/webhooks/telegram`

  const telegramResults: WebhookResult[] = []
  const n8nResults: Array<{
    companyId: string
    companyName: string
    automationId: string
    automationName: string
    webhookUrl: string | null
    isActive: boolean
    secretConfigured: boolean
  }> = []

  for (const company of companies) {
    log(`\n📋 Empresa: ${company.name}`, 'blue')
    log(`   ID: ${company.id}`, 'blue')

    // Validar Telegram
    if (company.botToken) {
      log(`   Bot Token: ${company.botToken.substring(0, 10)}...`, 'blue')
      
      const webhookInfo = await getTelegramWebhookInfo(company.botToken)
      
      // IMPORTANTE: Sempre usar a URL esperada padrão, não a customWebhookUrl
      // A customWebhookUrl pode estar incorreta (pode ter sido salva errada antes)
      const expectedUrl = expectedWebhookUrl
      
      if (webhookInfo.success && webhookInfo.data) {
        const webhookData = webhookInfo.data
        const isConfigured = !!webhookData.url
        // Comparar apenas a URL do webhook (pode ter query params ou não)
        const webhookUrl = webhookData.url || ''
        const isCorrect = webhookUrl === expectedUrl || webhookUrl.startsWith(expectedUrl)

        telegramResults.push({
          companyId: company.id,
          companyName: company.name,
          success: isCorrect,
          webhookUrl: webhookData.url || null,
          error: isConfigured && !isCorrect ? `Webhook aponta para URL incorreta: ${webhookData.url}` : undefined,
          webhookInfo: webhookData,
        })

        if (isCorrect) {
          log(`   ✅ Webhook configurado corretamente: ${webhookData.url}`, 'green')
        } else if (isConfigured) {
          log(`   ❌ Webhook configurado incorretamente: ${webhookData.url}`, 'red')
          log(`   💡 Esperado: ${expectedUrl}`, 'yellow')
        } else {
          log(`   ⚠️  Webhook não configurado`, 'yellow')
        }

        if (webhookData.pending_update_count > 0) {
          log(`   ⚠️  ${webhookData.pending_update_count} atualizações pendentes`, 'yellow')
        }

        if (webhookData.last_error_message) {
          log(`   ❌ Último erro: ${webhookData.last_error_message}`, 'red')
        }
      } else {
        telegramResults.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          webhookUrl: null,
          error: webhookInfo.error || 'Erro ao verificar webhook',
        })
        log(`   ❌ Erro ao verificar webhook: ${webhookInfo.error}`, 'red')
      }
    } else {
      log(`   ⚠️  Bot token não configurado`, 'yellow')
      telegramResults.push({
        companyId: company.id,
        companyName: company.name,
        success: false,
        webhookUrl: null,
        error: 'Bot token não configurado',
      })
    }

    // Validar n8n (buscar todas as automações, não apenas Telegram)
    const automations = await getN8nAutomations(company.id)
    for (const automation of automations) {
      n8nResults.push({
        companyId: company.id,
        companyName: company.name,
        automationId: automation.id,
        automationName: automation.name,
        webhookUrl: automation.n8n_webhook_url || null,
        isActive: automation.is_active || false,
        secretConfigured: !!company.n8nSecret,
      })

      if (automation.is_active) {
        log(`   🔗 Automação: ${automation.name}`, 'magenta')
        log(`      Webhook: ${automation.n8n_webhook_url || 'Não configurado'}`, 'magenta')
        log(`      Secret: ${company.n8nSecret ? '✅ Configurado' : '❌ Não configurado'}`, 'magenta')
      }
    }
  }

  // Resumo
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RESUMO DA VALIDAÇÃO\n', 'cyan')

  const telegramOk = telegramResults.filter((r) => r.success).length
  const telegramErrors = telegramResults.filter((r) => !r.success).length
  const n8nActive = n8nResults.filter((r) => r.isActive).length
  const n8nWithSecret = n8nResults.filter((r) => r.isActive && r.secretConfigured).length

  log(`Telegram:`, 'blue')
  log(`  ✅ Configurados corretamente: ${telegramOk}`, 'green')
  log(`  ❌ Com problemas: ${telegramErrors}`, 'red')

  log(`\nn8n:`, 'magenta')
  log(`  🔗 Automações ativas: ${n8nActive}`, 'magenta')
  log(`  🔐 Com secret configurado: ${n8nWithSecret}`, n8nWithSecret === n8nActive ? 'green' : 'yellow')

  return {
    telegram: telegramResults,
    n8n: n8nResults,
  }
}

/**
 * Reconfigurar todos os webhooks
 */
async function reconfigureAllWebhooks() {
  log('\n🔧 Reconfigurando todos os webhooks do Telegram...\n', 'cyan')

  const companies = await getAllCompanies()
  const expectedWebhookUrl = `${APP_URL}/api/webhooks/telegram`

  const results: WebhookResult[] = []

  for (const company of companies) {
    if (!company.botToken) {
      log(`\n⚠️  ${company.name}: Bot token não configurado, pulando...`, 'yellow')
      continue
    }

    log(`\n🔧 Reconfigurando webhook para: ${company.name}`, 'blue')
    log(`   Bot Token: ${company.botToken.substring(0, 10)}...`, 'blue')

    const finalWebhookUrl = company.customWebhookUrl || expectedWebhookUrl
    log(`   Webhook URL: ${finalWebhookUrl}`, 'blue')

    const result = await configureTelegramWebhook(company.botToken, finalWebhookUrl)

    if (result.success) {
      log(`   ✅ Webhook reconfigurado com sucesso!`, 'green')
      results.push({
        companyId: company.id,
        companyName: company.name,
        success: true,
        webhookUrl: finalWebhookUrl,
      })
    } else {
      log(`   ❌ Erro: ${result.error}`, 'red')
      results.push({
        companyId: company.id,
        companyName: company.name,
        success: false,
        webhookUrl: finalWebhookUrl,
        error: result.error,
      })
    }
  }

  // Resumo
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RESUMO DA RECONFIGURAÇÃO\n', 'cyan')

  const successCount = results.filter((r) => r.success).length
  const errorCount = results.filter((r) => !r.success).length

  log(`✅ Sucessos: ${successCount}`, 'green')
  log(`❌ Erros: ${errorCount}`, 'red')

  return results
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const validateOnly = args.includes('--validate-only')
  const reconfigure = args.includes('--reconfigure') || !validateOnly

  log('\n🚀 Script de Reconfiguração de Webhooks\n', 'cyan')
  log(`App URL: ${APP_URL}`, 'blue')
  log(`Webhook esperado: ${APP_URL}/api/webhooks/telegram\n`, 'blue')

  try {
    if (validateOnly) {
      await validateAllConfigurations()
    } else if (reconfigure) {
      await reconfigureAllWebhooks()
      
      // Após reconfigurar, validar novamente
      log('\n\n🔍 Validando após reconfiguração...\n', 'cyan')
      await validateAllConfigurations()
    }

    log('\n✅ Processo concluído!', 'green')
    process.exit(0)
  } catch (error) {
    log(`\n❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Executar
main().catch((error) => {
  log(`\n❌ Erro fatal: ${error}`, 'red')
  console.error(error)
  process.exit(1)
})

