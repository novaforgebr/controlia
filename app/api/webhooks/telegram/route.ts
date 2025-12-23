import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Webhook para receber mensagens do Telegram
 * Este endpoint recebe mensagens do Telegram Bot API
 * 
 * Formato esperado do Telegram:
 * {
 *   "update_id": 123456789,
 *   "message": {
 *     "message_id": 123,
 *     "from": {
 *       "id": 123456789,
 *       "is_bot": false,
 *       "first_name": "João",
 *       "username": "joao_silva"
 *     },
 *     "chat": {
 *       "id": 123456789,
 *       "first_name": "João",
 *       "username": "joao_silva",
 *       "type": "private"
 *     },
 *     "date": 1234567890,
 *     "text": "Olá!"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Estrutura do webhook do Telegram
    const message = body.message || body.edited_message
    if (!message) {
      // Pode ser outro tipo de update (callback_query, etc)
      return NextResponse.json({ success: true, message: 'Update não processado' })
    }

    const {
      message_id,
      from,
      chat,
      text,
      date,
      photo,
      document,
      audio,
      video,
      voice,
    } = message

    if (!from || !chat) {
      return NextResponse.json(
        { error: 'from e chat são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar empresa pela configuração do bot token (se necessário)
    // Por enquanto, vamos buscar contato pelo username ou ID do Telegram
    const telegramUserId = from.id.toString()
    const telegramUsername = from.username || null

    // Buscar contato pelo ID do Telegram (precisamos adicionar campo telegram_id aos contatos)
    // Por enquanto, vamos buscar por username se disponível
    let contactQuery = supabase
      .from('contacts')
      .select('id, company_id')

    // Tentar buscar por username do Telegram (se armazenado em custom_fields)
    // Ou criar um campo telegram_id na tabela contacts
    // Por enquanto, vamos buscar todas as empresas e verificar configurações
    const { data: companies } = await supabase
      .from('companies')
      .select('id, settings')
      .limit(100) // Limitar para performance

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma empresa encontrada' },
        { status: 404 }
      )
    }

    // Buscar contato que tenha telegram_id ou username no custom_fields
    let contact = null
    for (const company of companies) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, company_id, custom_fields')
        .eq('company_id', company.id)
        .limit(1000)

      if (contacts) {
        contact = contacts.find((c) => {
          const customFields = c.custom_fields as Record<string, unknown> || {}
          return (
            customFields.telegram_id === telegramUserId ||
            customFields.telegram_username === telegramUsername
          )
        })

        if (contact) break
      }
    }

    // Se não encontrou contato, criar um novo (opcional - pode ser configurável)
    if (!contact && companies.length > 0) {
      // Por padrão, usar a primeira empresa
      // Em produção, você pode querer mapear bot token -> company_id
      const company = companies[0]

      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          company_id: company.id,
          name: `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'Usuário Telegram',
          custom_fields: {
            telegram_id: telegramUserId,
            telegram_username: telegramUsername,
          },
          status: 'lead',
          source: 'telegram',
        })
        .select()
        .single()

      if (contactError) {
        console.error('Erro ao criar contato:', contactError)
        return NextResponse.json(
          { error: 'Erro ao criar contato' },
          { status: 500 }
        )
      }

      contact = newContact
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado e não foi possível criar' },
        { status: 404 }
      )
    }

    // Buscar ou criar conversa
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', contact.company_id)
      .eq('contact_id', contact.id)
      .eq('channel', 'telegram')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      // Criar nova conversa
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          company_id: contact.company_id,
          contact_id: contact.id,
          channel: 'telegram',
          channel_thread_id: chat.id.toString(),
          status: 'open',
          priority: 'normal',
          ai_assistant_enabled: true,
        })
        .select()
        .single()

      if (convError) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json(
          { error: 'Erro ao criar conversa' },
          { status: 500 }
        )
      }

      conversation = newConversation
    }

    // Determinar tipo de conteúdo
    let content = text || ''
    let contentType = 'text'
    let mediaUrl = null

    if (photo && photo.length > 0) {
      // Pegar a foto de maior resolução
      const largestPhoto = photo[photo.length - 1]
      mediaUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${largestPhoto.file_id}`
      contentType = 'image'
      content = text || '[Foto]'
    } else if (document) {
      mediaUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${document.file_id}`
      contentType = 'document'
      content = document.file_name || '[Documento]'
    } else if (audio) {
      mediaUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${audio.file_id}`
      contentType = 'audio'
      content = '[Áudio]'
    } else if (video) {
      mediaUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${video.file_id}`
      contentType = 'video'
      content = text || '[Vídeo]'
    } else if (voice) {
      mediaUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${voice.file_id}`
      contentType = 'audio'
      content = '[Mensagem de voz]'
    }

    // Criar mensagem
    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        company_id: contact.company_id,
        conversation_id: conversation.id,
        contact_id: contact.id,
        content: content,
        content_type: contentType,
        direction: 'inbound',
        sender_type: 'human',
        channel_message_id: message_id.toString(),
        media_url: mediaUrl,
        status: 'delivered',
        created_at: new Date(date * 1000).toISOString(), // Telegram usa timestamp Unix
      })
      .select()
      .single()

    if (msgError) {
      console.error('Erro ao criar mensagem:', msgError)
      return NextResponse.json(
        { error: 'Erro ao criar mensagem' },
        { status: 500 }
      )
    }

    // Buscar automações ativas para processar mensagens
    const { data: automations } = await supabase
      .from('automations')
      .select('*')
      .eq('company_id', contact.company_id)
      .eq('trigger_event', 'new_message')
      .eq('is_active', true)
      .eq('is_paused', false)

    // Se houver automações configuradas, enviar para n8n
    if (automations && automations.length > 0) {
      const automation = automations[0] // Usar a primeira automação ativa
      
      if (automation.n8n_webhook_url) {
        try {
          // Enviar para o n8n no formato que seu workflow espera
          const n8nResponse = await fetch(automation.n8n_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Formato compatível com seu Telegram Trigger
              update_id: body.update_id || Date.now(),
              message: {
                message_id: message_id,
                from: from,
                chat: chat,
                date: date,
                text: text || content,
              },
              // Dados adicionais do Controlia
              controlia: {
                company_id: contact.company_id,
                contact_id: contact.id,
                conversation_id: conversation.id,
                message_id: newMessage.id,
                channel: 'telegram',
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/n8n/channel-response`,
              },
            }),
          })

          if (!n8nResponse.ok) {
            console.error('Erro ao enviar para n8n:', await n8nResponse.text())
          } else {
            // Registrar log de execução
            await supabase.from('automation_logs').insert({
              company_id: contact.company_id,
              automation_id: automation.id,
              trigger_event: 'new_message',
              trigger_data: {
                message_id: newMessage.id,
                conversation_id: conversation.id,
                channel: 'telegram',
              },
              status: 'success',
              started_at: new Date().toISOString(),
            })
          }
        } catch (n8nError) {
          console.error('Erro ao enviar para n8n:', n8nError)
          // Registrar erro
          if (automation.id) {
            await supabase.from('automation_logs').insert({
              company_id: contact.company_id,
              automation_id: automation.id,
              trigger_event: 'new_message',
              trigger_data: {
                message_id: newMessage.id,
                conversation_id: conversation.id,
              },
              status: 'error',
              error_message: String(n8nError),
              started_at: new Date().toISOString(),
            })
          }
          // Não falhar a requisição se o n8n falhar
        }
      }
    }

    return NextResponse.json({
      success: true,
      message_id: newMessage.id,
      conversation_id: conversation.id,
    })
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET para verificação do webhook do Telegram
 * O Telegram pode usar GET para verificar o endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Telegram webhook endpoint está ativo' 
  })
}

