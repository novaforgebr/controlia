'use server'

/**
 * Server Actions para o módulo de Mensagens
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { createMessageSchema } from '@/lib/validations/message'
import { logHumanAction, logAIAction } from '@/lib/utils/audit'
import type { MessageInsert, Message } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

/**
 * Criar nova mensagem
 */
export async function createMessage(formData: FormData) {
  try {
    // company_id é opcional - pode vir do formData ou ser obtido da empresa atual
    const company_id_from_form = formData.get('company_id') as string | null
    let company_id: string | null = null
    
    if (company_id_from_form) {
      company_id = company_id_from_form
    } else {
      // Tentar obter da empresa atual (se houver usuário autenticado)
      const company = await getCurrentCompany()
      if (company) {
        company_id = company.id
      }
      // Se não houver empresa, company_id será NULL (permitido agora)
    }

    const user = await getUser()
    // user não é obrigatório para mensagens do n8n

    const rawData = {
      conversation_id: formData.get('conversation_id') as string,
      contact_id: formData.get('contact_id') as string,
      content: formData.get('content') as string,
      content_type: formData.get('content_type') as string || 'text',
      media_url: formData.get('media_url') as string || '',
      sender_type: formData.get('sender_type') as string || 'human',
      sender_id: formData.get('sender_id') as string || (user?.id || ''),
      ai_agent_id: formData.get('ai_agent_id') as string || '',
      channel_message_id: formData.get('channel_message_id') as string || '',
      channel_timestamp: formData.get('channel_timestamp') as string || '',
      direction: formData.get('direction') as string || 'outbound',
      status: formData.get('status') as string || 'sent',
      ai_context: formData.get('ai_context') ? JSON.parse(formData.get('ai_context') as string) : null,
      ai_prompt_version_id: formData.get('ai_prompt_version_id') as string || '',
    }

    const validatedData = createMessageSchema.parse({
      ...rawData,
      sender_id: rawData.sender_type === 'human' ? (rawData.sender_id || null) : null,
      ai_agent_id: rawData.sender_type === 'ai' ? rawData.ai_agent_id : null,
      channel_message_id: rawData.channel_message_id || null,
      channel_timestamp: rawData.channel_timestamp || null,
      ai_context: rawData.ai_context || null,
      ai_prompt_version_id: rawData.ai_prompt_version_id || null,
    })

    const supabase = await createClient()

    // Inserir mensagem (company_id pode ser NULL)
    const messageData: Record<string, unknown> = {
      ...validatedData,
    }
    
    // Adicionar company_id apenas se existir
    if (company_id) {
      messageData.company_id = company_id
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar mensagem:', error)
      return { error: 'Erro ao criar mensagem' }
    }

    // Se for mensagem humana outbound, enviar para o canal externo (Telegram/WhatsApp)
    try {
      if (
        company_id &&
        validatedData.direction === 'outbound' &&
        validatedData.sender_type === 'human'
      ) {
        // Buscar conversa para obter canal e identificador do canal
        const { data: conversation } = await supabase
          .from('conversations')
          .select('channel, channel_thread_id, company_id')
          .eq('id', validatedData.conversation_id)
          .single()

        if (conversation) {
          const channel = conversation.channel
          const channelThreadId = conversation.channel_thread_id as string | null

          // Buscar settings da empresa para obter credenciais do canal
          const { data: company } = await supabase
            .from('companies')
            .select('settings')
            .eq('id', company_id)
            .single()

          const settings = (company?.settings as Record<string, unknown>) || {}

          // Enviar para o canal apropriado
          if (channel === 'telegram') {
            const telegramBotToken = settings.telegram_bot_token as string | undefined
            const chatId = channelThreadId

            if (telegramBotToken && chatId) {
              const telegramResponse = await fetch(
                `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: validatedData.content,
                    parse_mode: 'HTML',
                  }),
                }
              )

              if (telegramResponse.ok) {
                const data = await telegramResponse.json()
                const channelMessageId = data.result?.message_id

                if (channelMessageId) {
                  await supabase
                    .from('messages')
                    .update({ channel_message_id: channelMessageId.toString() })
                    .eq('id', message.id)
                }
              } else {
                const err = await telegramResponse.text()
                console.error('Erro ao enviar mensagem para Telegram (UI):', err)
              }
            } else {
              console.warn(
                'Telegram não configurado ou chat_id ausente para esta conversa; mensagem salva apenas no CRM.'
              )
            }
          } else if (channel === 'whatsapp') {
            const whatsappApiUrl = settings.whatsapp_api_url as string | undefined
            const whatsappApiKey = settings.whatsapp_api_key as string | undefined
            const to = channelThreadId

            if (whatsappApiUrl && whatsappApiKey && to) {
              const whatsappResponse = await fetch(`${whatsappApiUrl}/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${whatsappApiKey}`,
                },
                body: JSON.stringify({
                  to,
                  message: validatedData.content,
                  type: 'text',
                }),
              })

              if (whatsappResponse.ok) {
                const data = await whatsappResponse.json()
                const channelMessageId = data.messageId

                if (channelMessageId) {
                  await supabase
                    .from('messages')
                    .update({ channel_message_id: channelMessageId.toString() })
                    .eq('id', message.id)
                }
              } else {
                const err = await whatsappResponse.text()
                console.error('Erro ao enviar mensagem para WhatsApp (UI):', err)
              }
            } else {
              console.warn(
                'WhatsApp não configurado ou número ausente para esta conversa; mensagem salva apenas no CRM.'
              )
            }
          }
        }
      }
    } catch (sendError) {
      console.error('Erro ao enviar mensagem para canal externo (UI):', sendError)
      // Não interromper fluxo; a mensagem já está salva no CRM
    }

    // Registrar auditoria (apenas se tiver company_id)
    if (company_id) {
      if (validatedData.sender_type === 'ai') {
        await logAIAction(
          company_id,
          'create_message',
          'message',
          message.id,
          { message: message }
        )
      } else if (user) {
        await logHumanAction(
          company_id,
          user.id,
          'create_message',
          'message',
          message.id,
          { created: message }
        )
      }
    }

    revalidatePath(`/conversations/${validatedData.conversation_id}`)
    return { success: true, data: message }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao criar mensagem:', error)
    return { error: 'Erro ao criar mensagem' }
  }
}

/**
 * Listar mensagens de uma conversa
 */
export async function listMessages(conversationId: string, limit = 50) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('messages')
      .select('*, user_profiles(full_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Erro ao listar mensagens:', error)
      return { error: 'Erro ao listar mensagens', data: [] }
    }

    return { data: data as Message[] }
  } catch (error) {
    console.error('Erro ao listar mensagens:', error)
    return { error: 'Erro ao listar mensagens', data: [] }
  }
}

/**
 * Marcar mensagens como lidas
 */
export async function markMessagesAsRead(conversationId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('company_id', company.id)
      .eq('direction', 'inbound')
      .eq('status', 'delivered')

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
      return { error: 'Erro ao marcar mensagens como lidas' }
    }

    revalidatePath(`/conversations/${conversationId}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error)
    return { error: 'Erro ao marcar mensagens como lidas' }
  }
}

