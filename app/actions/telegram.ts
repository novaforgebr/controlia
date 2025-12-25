'use server'

/**
 * Server Actions para gerenciamento de integração com Telegram
 */

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

