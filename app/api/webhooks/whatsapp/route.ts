import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Webhook para receber mensagens do WhatsApp
 * Este endpoint recebe mensagens de provedores de WhatsApp (ex: Twilio, Evolution API, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Estrutura esperada do webhook do WhatsApp
    const {
      from, // Número do remetente (ex: +5511999999999)
      to, // Número de destino
      message, // Conteúdo da mensagem
      messageId, // ID da mensagem no WhatsApp
      timestamp,
      mediaUrl, // URL de mídia se houver
      type, // text, image, audio, video, document
    } = body

    if (!from || !message) {
      return NextResponse.json(
        { error: 'from e message são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar contato pelo WhatsApp
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, company_id')
      .eq('whatsapp', from)
      .single()

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    // Buscar ou criar conversa
    // IMPORTANTE: Buscar por channel_thread_id (número do WhatsApp) para garantir que reutilizamos a mesma conversa
    const channelThreadId = from // O número do WhatsApp é o channel_thread_id
    
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', contact.company_id)
      .eq('contact_id', contact.id)
      .eq('channel', 'whatsapp')
      .eq('channel_thread_id', channelThreadId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!conversation) {
      // Criar nova conversa apenas se não existir uma aberta com o mesmo channel_thread_id
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          company_id: contact.company_id,
          contact_id: contact.id,
          channel: 'whatsapp',
          channel_thread_id: channelThreadId,
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

    if (!conversation) {
      return NextResponse.json(
        { error: 'Erro ao obter ou criar conversa' },
        { status: 500 }
      )
    }

    // Criar mensagem
    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        company_id: contact.company_id,
        conversation_id: conversation.id,
        contact_id: contact.id,
        content: message,
        direction: 'inbound',
        sender_type: 'human',
        channel: 'whatsapp',
        channel_message_id: messageId,
        media_url: mediaUrl || null,
        message_type: type || 'text',
        created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
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
          // Enviar para o n8n no formato compatível
          const n8nResponse = await fetch(automation.n8n_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Formato compatível com webhook do WhatsApp
              from: from,
              to: to,
              message: message,
              messageId: messageId,
              timestamp: timestamp,
              type: type || 'text',
              mediaUrl: mediaUrl || null,
              // Dados adicionais do Controlia
              controlia: {
                company_id: contact.company_id,
                contact_id: contact.id,
                conversation_id: conversation?.id,
                message_id: newMessage?.id,
                channel: 'whatsapp',
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
                message_id: newMessage?.id,
                conversation_id: conversation?.id,
                channel: 'whatsapp',
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
                message_id: newMessage?.id,
                conversation_id: conversation?.id,
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

    if (!newMessage || !conversation) {
      return NextResponse.json(
        { error: 'Erro ao criar mensagem ou conversa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message_id: newMessage.id,
      conversation_id: conversation.id,
    })
  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET para verificação do webhook (alguns provedores requerem)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const verifyToken = searchParams.get('verify_token')
  const challenge = searchParams.get('challenge')

  // Verificar token (configurar em variável de ambiente)
  if (verifyToken === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
}

