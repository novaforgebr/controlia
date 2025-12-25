'use server'

/**
 * Server Actions para gerenciamento de integração com Telegram
 */

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Configurar webhook do Telegram automaticamente
 * @param botToken Token do bot do Telegram
 * @param webhookUrl URL onde o Telegram enviará as mensagens
 * @returns Resultado da configuração
 */
export async function configureTelegramWebhook(
  botToken: string,
  webhookUrl: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Validar token
    if (!botToken || !botToken.trim()) {
      return { success: false, error: 'Token do bot é obrigatório' }
    }

    // Validar URL
    if (!webhookUrl || !webhookUrl.trim()) {
      return { success: false, error: 'URL do webhook é obrigatória' }
    }

    // Validar formato da URL
    try {
      new URL(webhookUrl)
    } catch {
      return { success: false, error: 'URL do webhook inválida' }
    }

    // Chamar API do Telegram para configurar webhook
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
      console.error('Erro ao configurar webhook do Telegram:', data)
      return {
        success: false,
        error: data.description || 'Erro ao configurar webhook do Telegram',
        data,
      }
    }

    console.log('✅ Webhook do Telegram configurado com sucesso:', webhookUrl)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao configurar webhook do Telegram:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao configurar webhook',
    }
  }
}

/**
 * Verificar status do webhook do Telegram
 * @param botToken Token do bot do Telegram
 * @returns Informações sobre o webhook configurado
 */
export async function getTelegramWebhookInfo(
  botToken: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (!botToken || !botToken.trim()) {
      return { success: false, error: 'Token do bot é obrigatório' }
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    
    const response = await fetch(telegramApiUrl, {
      method: 'GET',
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || 'Erro ao buscar informações do webhook',
        data,
      }
    }

    return { success: true, data: data.result }
  } catch (error) {
    console.error('Erro ao buscar informações do webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Testar conexão com o bot do Telegram
 * @param botToken Token do bot do Telegram
 * @returns Resultado do teste
 */
export async function testTelegramConnection(
  botToken: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (!botToken || !botToken.trim()) {
      return { success: false, error: 'Token do bot é obrigatório' }
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getMe`
    
    const response = await fetch(telegramApiUrl, {
      method: 'GET',
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || 'Token inválido ou bot não encontrado',
        data,
      }
    }

    return { success: true, data: data.result }
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Reconfigurar todos os webhooks do Telegram para todas as empresas
 * @returns Resultado da reconfiguração
 */
export async function reconfigureAllTelegramWebhooks(): Promise<{
  success: boolean
  results: Array<{
    companyId: string
    companyName: string
    success: boolean
    error?: string
    webhookUrl?: string
  }>
}> {
  try {
    const serviceClient = createServiceRoleClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'
    const webhookUrl = `${appUrl}/api/webhooks/telegram`

    // Buscar todas as empresas com bot token configurado
    const { data: companies, error } = await serviceClient
      .from('companies')
      .select('id, name, settings')
      .limit(1000)

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return {
        success: false,
        results: [],
      }
    }

    if (!companies || companies.length === 0) {
      return {
        success: true,
        results: [],
      }
    }

    const results: Array<{
      companyId: string
      companyName: string
      success: boolean
      error?: string
      webhookUrl?: string
    }> = []

    // Reconfigurar webhook para cada empresa
    for (const company of companies) {
      const settings = (company.settings as Record<string, unknown>) || {}
      const botToken = (settings.telegram_bot_token as string) || ''
      const customWebhookUrl = (settings.telegram_webhook_url as string) || ''

      if (!botToken) {
        results.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          error: 'Bot token não configurado',
        })
        continue
      }

      // Usar URL customizada se disponível, senão usar a padrão
      const finalWebhookUrl = customWebhookUrl || webhookUrl

      console.log(`🔧 Reconfigurando webhook para empresa: ${company.name}`)
      console.log(`   Bot Token: ${botToken.substring(0, 10)}...`)
      console.log(`   Webhook URL: ${finalWebhookUrl}`)

      const webhookResult = await configureTelegramWebhook(botToken, finalWebhookUrl)

      if (webhookResult.success) {
        results.push({
          companyId: company.id,
          companyName: company.name,
          success: true,
          webhookUrl: finalWebhookUrl,
        })
        console.log(`✅ Webhook reconfigurado com sucesso para: ${company.name}`)
      } else {
        results.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          error: webhookResult.error || 'Erro desconhecido',
          webhookUrl: finalWebhookUrl,
        })
        console.error(`❌ Erro ao reconfigurar webhook para ${company.name}:`, webhookResult.error)
      }
    }

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length

    console.log(`\n📊 Resumo da reconfiguração:`)
    console.log(`   ✅ Sucessos: ${successCount}`)
    console.log(`   ❌ Erros: ${errorCount}`)

    return {
      success: errorCount === 0,
      results,
    }
  } catch (error) {
    console.error('Erro ao reconfigurar webhooks:', error)
    return {
      success: false,
      results: [],
    }
  }
}

/**
 * Verificar e validar todas as configurações de webhooks
 * @returns Relatório completo de configurações
 */
export async function validateAllWebhookConfigurations(): Promise<{
  success: boolean
  report: {
    telegram: Array<{
      companyId: string
      companyName: string
      botTokenConfigured: boolean
      webhookConfigured: boolean
      webhookUrl: string | null
      webhookStatus: 'ok' | 'error' | 'not_configured'
      error?: string
    }>
    n8n: Array<{
      companyId: string
      companyName: string
      automationId: string
      automationName: string
      webhookUrl: string | null
      isActive: boolean
      secretConfigured: boolean
    }>
  }
}> {
  try {
    const serviceClient = createServiceRoleClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'
    const expectedWebhookUrl = `${appUrl}/api/webhooks/telegram`

    // Buscar todas as empresas
    const { data: companies, error: companiesError } = await serviceClient
      .from('companies')
      .select('id, name, settings')
      .limit(1000)

    if (companiesError) {
      console.error('Erro ao buscar empresas:', companiesError)
      return {
        success: false,
        report: {
          telegram: [],
          n8n: [],
        },
      }
    }

    const telegramReport: Array<{
      companyId: string
      companyName: string
      botTokenConfigured: boolean
      webhookConfigured: boolean
      webhookUrl: string | null
      webhookStatus: 'ok' | 'error' | 'not_configured'
      error?: string
    }> = []

    const n8nReport: Array<{
      companyId: string
      companyName: string
      automationId: string
      automationName: string
      webhookUrl: string | null
      isActive: boolean
      secretConfigured: boolean
    }> = []

    // Verificar configurações do Telegram
    for (const company of companies || []) {
      const settings = (company.settings as Record<string, unknown>) || {}
      const botToken = (settings.telegram_bot_token as string) || ''
      const customWebhookUrl = (settings.telegram_webhook_url as string) || ''
      const n8nSecret = (settings.n8n_webhook_secret as string) || ''

      const telegramEntry = {
        companyId: company.id,
        companyName: company.name,
        botTokenConfigured: !!botToken,
        webhookConfigured: false,
        webhookUrl: null as string | null,
        webhookStatus: 'not_configured' as const,
        error: undefined as string | undefined,
      }

      if (botToken) {
        // Verificar status do webhook
        const webhookInfo = await getTelegramWebhookInfo(botToken)
        
        if (webhookInfo.success && webhookInfo.data) {
          const webhookData = webhookInfo.data
          telegramEntry.webhookConfigured = !!webhookData.url
          telegramEntry.webhookUrl = webhookData.url || null

          // Verificar se está apontando para o lugar correto
          const expectedUrl = customWebhookUrl || expectedWebhookUrl
          if (webhookData.url === expectedUrl) {
            telegramEntry.webhookStatus = 'ok'
          } else if (webhookData.url) {
            telegramEntry.webhookStatus = 'error'
            telegramEntry.error = `Webhook aponta para URL incorreta: ${webhookData.url} (esperado: ${expectedUrl})`
          } else {
            telegramEntry.webhookStatus = 'not_configured'
          }
        } else {
          telegramEntry.webhookStatus = 'error'
          telegramEntry.error = webhookInfo.error || 'Erro ao verificar webhook'
        }
      }

      telegramReport.push(telegramEntry)

      // Buscar automações do n8n para esta empresa
      const { data: automations } = await serviceClient
        .from('automations')
        .select('id, name, n8n_webhook_url, is_active, channel')
        .eq('company_id', company.id)
        .eq('channel', 'telegram')

      for (const automation of automations || []) {
        n8nReport.push({
          companyId: company.id,
          companyName: company.name,
          automationId: automation.id,
          automationName: automation.name,
          webhookUrl: automation.n8n_webhook_url || null,
          isActive: automation.is_active || false,
          secretConfigured: !!n8nSecret,
        })
      }
    }

    return {
      success: true,
      report: {
        telegram: telegramReport,
        n8n: n8nReport,
      },
    }
  } catch (error) {
    console.error('Erro ao validar configurações:', error)
    return {
      success: false,
      report: {
        telegram: [],
        n8n: [],
      },
    }
  }
}
