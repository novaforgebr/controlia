'use server'

/**
 * Server Actions para o módulo de Integrações de Canais
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''
const N8N_SECRET = process.env.N8N_SECRET || ''

// Helper para validar configuração do n8n
function validateN8nConfig() {
  if (!N8N_WEBHOOK_URL) {
    return { error: 'N8N_WEBHOOK_URL não configurado. Configure a variável de ambiente.' }
  }
  if (!N8N_SECRET) {
    return { error: 'N8N_SECRET não configurado. Configure a variável de ambiente.' }
  }
  return null
}

// Helper para fazer requisições ao n8n com retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 segundos de timeout
      })
      
      if (response.ok) {
        return response
      }
      
      // Se não for erro de servidor, não tenta novamente
      if (response.status < 500) {
        return response
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido')
    }
    
    // Aguardar antes de tentar novamente (exceto na última tentativa)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }
  
  throw lastError || new Error('Falha após múltiplas tentativas')
}

/**
 * Conectar canal (WhatsApp/Telegram)
 */
export async function connectChannel(channel: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    // Verificar se já existe integração ativa para este canal
    const { data: existing } = await supabase
      .from('channel_integrations')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('channel', channel)
      .in('status', ['connected', 'connecting'])
      .single()

    if (existing) {
      if (existing.status === 'connected') {
        return { error: 'Canal já está conectado' }
      }
      if (existing.status === 'connecting') {
        return { error: 'Canal já está em processo de conexão' }
      }
    }

    // Validar configuração do n8n
    const configError = validateN8nConfig()
    if (configError) {
      return configError
    }

    // Chamar webhook do n8n para iniciar conexão com retry
    let n8nResponse: Response
    try {
      n8nResponse = await fetchWithRetry(
        `${N8N_WEBHOOK_URL}/connect-channel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-Secret': N8N_SECRET,
          },
          body: JSON.stringify({
            company_id: company.id,
            channel: channel,
          }),
        }
      )
    } catch (error) {
      console.error('Erro ao chamar n8n (após retries):', error)
      return { 
        error: 'Não foi possível conectar ao serviço de automação. Verifique se o n8n está configurado e acessível.' 
      }
    }

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('Erro ao chamar n8n:', errorText)
      
      // Mensagens de erro mais específicas
      if (n8nResponse.status === 401) {
        return { error: 'Erro de autenticação com o n8n. Verifique o N8N_SECRET.' }
      }
      if (n8nResponse.status === 404) {
        return { error: 'Workflow não encontrado no n8n. Verifique se o workflow de conexão está ativo.' }
      }
      if (n8nResponse.status >= 500) {
        return { error: 'Erro no servidor de automação. Tente novamente em alguns instantes.' }
      }
      
      return { error: 'Erro ao conectar canal. Tente novamente.' }
    }

    const n8nData = await n8nResponse.json()

    // Criar registro de integração
    const { data: integration, error } = await supabase
      .from('channel_integrations')
      .insert({
        company_id: company.id,
        channel: channel,
        channel_name: n8nData.channel_name || null,
        status: 'connecting',
        n8n_instance_id: n8nData.instance_id || null,
        n8n_webhook_url: n8nData.webhook_url || null,
        qr_code_base64: n8nData.qr_code || null,
        connection_data: n8nData.connection_data || {},
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar integração:', error)
      return { error: 'Erro ao criar integração' }
    }

    revalidatePath('/integrations')
    return {
      success: true,
      integrationId: integration.id,
      qrCode: n8nData.qr_code || null,
    }
  } catch (error) {
    console.error('Erro ao conectar canal:', error)
    return { error: 'Erro ao conectar canal' }
  }
}

/**
 * Desconectar canal
 */
export async function disconnectChannel(integrationId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    // Buscar integração
    const { data: integration } = await supabase
      .from('channel_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('company_id', company.id)
      .single()

    if (!integration) {
      return { error: 'Integração não encontrada' }
    }

    // Chamar webhook do n8n para desconectar
    if (integration.n8n_instance_id) {
      const configError = validateN8nConfig()
      if (!configError) {
        try {
          await fetchWithRetry(
            `${N8N_WEBHOOK_URL}/disconnect-channel`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-N8N-Secret': N8N_SECRET,
              },
              body: JSON.stringify({
                instance_id: integration.n8n_instance_id,
                company_id: company.id,
              }),
            },
            2, // Menos retries para desconexão
            500
          )
        } catch (error) {
          console.error('Erro ao desconectar no n8n:', error)
          // Continuar mesmo se falhar no n8n (não é crítico)
        }
      }
    }

    // Atualizar status
    const { error: updateError } = await supabase
      .from('channel_integrations')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
        qr_code_base64: null,
      })
      .eq('id', integrationId)
      .eq('company_id', company.id)

    if (updateError) {
      console.error('Erro ao atualizar integração:', updateError)
      return { error: 'Erro ao desconectar canal' }
    }

    revalidatePath('/integrations')
    return { success: true }
  } catch (error) {
    console.error('Erro ao desconectar canal:', error)
    return { error: 'Erro ao desconectar canal' }
  }
}

/**
 * Verificar status da conexão
 */
export async function checkConnectionStatus(integrationId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    // Buscar integração
    const { data: integration } = await supabase
      .from('channel_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('company_id', company.id)
      .single()

    if (!integration) {
      return { error: 'Integração não encontrada' }
    }

    // Se já está conectado, retornar status
    if (integration.status === 'connected') {
      return { success: true, status: 'connected' }
    }

    // Chamar n8n para verificar status
    if (integration.n8n_instance_id) {
      const configError = validateN8nConfig()
      if (!configError) {
        try {
          const n8nResponse = await fetchWithRetry(
            `${N8N_WEBHOOK_URL}/check-status`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-N8N-Secret': N8N_SECRET,
              },
              body: JSON.stringify({
                instance_id: integration.n8n_instance_id,
                company_id: company.id,
              }),
            },
            2, // Menos retries para verificação de status
            1000
          )

          if (n8nResponse.ok) {
            const n8nData = await n8nResponse.json()
            
            // Atualizar status no banco
            if (n8nData.status && n8nData.status !== integration.status) {
              await supabase
                .from('channel_integrations')
                .update({
                  status: n8nData.status,
                  connected_at: n8nData.status === 'connected' ? new Date().toISOString() : integration.connected_at,
                  qr_code_base64: n8nData.status === 'connected' ? null : integration.qr_code_base64,
                })
                .eq('id', integrationId)
            }

            return {
              success: true,
              status: n8nData.status || integration.status,
              error: n8nData.error || null,
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status no n8n:', error)
          // Continuar e retornar status atual do banco
        }
      }
    }

    return {
      success: true,
      status: integration.status,
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return { error: 'Erro ao verificar status' }
  }
}

