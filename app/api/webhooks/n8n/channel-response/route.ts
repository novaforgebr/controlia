import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMessage } from '@/app/actions/messages'

/**
 * Webhook para receber resposta do n8n e enviar aos canais
 * Este endpoint é chamado pelo n8n após processar a mensagem com o Agent
 * Suporta: Telegram, WhatsApp e outros canais configurados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Seu workflow n8n retorna no formato do "Edit Fields" node
    // Ajuste conforme a estrutura exata do seu workflow
    const output = body.output || body.text || body.response || body.ai_response
    
    // Dados do Controlia enviados no callback
    const controliaData = body.controlia || {}
    let { company_id, contact_id, conversation_id, message_id, channel, channel_id } = controliaData

    // Dados da mensagem do Telegram (se vier do Telegram Trigger direto)
    const messageData = body.message || {}
    const fromData = messageData.from || {}
    const chatData = messageData.chat || {}

    if (!output) {
      return NextResponse.json(
        { error: 'Dados incompletos: output é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ============================================
    // 1. Buscar ou criar empresa
    // ============================================
    let company = null
    if (company_id) {
      const { data } = await supabase
        .from('companies')
        .select('id, settings')
        .eq('id', company_id)
        .single()
      company = data
    }

    // Se não encontrou empresa, buscar a primeira empresa disponível
    // (ou você pode configurar uma empresa padrão)
    if (!company) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, settings')
        .limit(1)
        .single()
      
      if (companies) {
        company = companies
        company_id = companies.id
      } else {
        return NextResponse.json(
          { error: 'Nenhuma empresa encontrada no sistema' },
          { status: 404 }
        )
      }
    }

    const settings = (company.settings as Record<string, unknown>) || {}

    // ============================================
    // 2. Buscar ou criar contato
    // ============================================
    let contact = null
    if (contact_id) {
      const { data } = await supabase
        .from('contacts')
        .select('id, company_id')
        .eq('id', contact_id)
        .eq('company_id', company_id)
        .single()
      contact = data
    }

    // Se não encontrou contato, criar um novo baseado nos dados do Telegram
    if (!contact && fromData.id) {
      const telegramUserId = fromData.id.toString()
      const telegramUsername = fromData.username || null
      const firstName = fromData.first_name || ''
      const lastName = fromData.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim() || fromData.username || 'Usuário Telegram'

      // Verificar se já existe contato com este telegram_id
      // Buscar todos os contatos da empresa e filtrar por telegram_id no código
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('id, company_id, custom_fields')
        .eq('company_id', company_id)
      
      const existingContact = allContacts?.find((c) => {
        const customFields = (c.custom_fields as Record<string, unknown>) || {}
        return customFields.telegram_id === telegramUserId
      })

      if (existingContact) {
        contact = existingContact
        contact_id = existingContact.id
      } else {
        // Criar novo contato
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            company_id: company_id,
            name: fullName,
            custom_fields: {
              telegram_id: telegramUserId,
              telegram_username: telegramUsername,
            },
            status: 'lead',
            source: 'telegram',
          })
          .select('id, company_id')
          .single()

        if (contactError) {
          console.error('Erro ao criar contato:', contactError)
          return NextResponse.json(
            { error: 'Erro ao criar contato', details: contactError.message },
            { status: 500 }
          )
        }

        contact = newContact
        contact_id = newContact.id
      }
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Não foi possível identificar ou criar o contato. É necessário company_id e dados do Telegram (message.from)' },
        { status: 400 }
      )
    }

    // ============================================
    // 3. Buscar ou criar conversa
    // ============================================
    let conversation = null
    if (conversation_id) {
      const { data } = await supabase
        .from('conversations')
        .select('id, channel_thread_id, contact_id, channel')
        .eq('id', conversation_id)
        .eq('company_id', company_id)
        .single()
      conversation = data
    }

    // Se não encontrou conversa, criar uma nova
    if (!conversation) {
      const finalChannel = channel || 'telegram'
      // Tentar obter channel_id de várias fontes
      const finalChannelId = channel_id || chatData.id?.toString() || fromData.id?.toString()

      if (!finalChannelId) {
        return NextResponse.json(
          { error: 'Não foi possível identificar o channel_id (chat.id do Telegram). Verifique se channel_id ou message.chat.id está presente.' },
          { status: 400 }
        )
      }

      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          company_id: company_id,
          contact_id: contact_id,
          channel: finalChannel,
          channel_thread_id: finalChannelId,
          status: 'open',
          priority: 'normal',
          ai_assistant_enabled: true,
        })
        .select('id, channel_thread_id, contact_id, channel')
        .single()

      if (convError) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json(
          { error: 'Erro ao criar conversa', details: convError.message },
          { status: 500 }
        )
      }

      conversation = newConversation
      conversation_id = newConversation.id
    }

    const finalChannel = channel || conversation.channel

    // Enviar resposta ao canal apropriado
    let channelMessageId: string | null = null

    if (finalChannel === 'telegram') {
      const telegramBotToken = settings.telegram_bot_token as string

      if (!telegramBotToken) {
        return NextResponse.json(
          { error: 'Bot Token do Telegram não configurado' },
          { status: 400 }
        )
      }

      // Obter chat_id de várias fontes possíveis
      const telegramChatId = channel_id || conversation.channel_thread_id || chatData.id?.toString() || fromData.id?.toString()

      if (!telegramChatId) {
        return NextResponse.json(
          { error: 'Chat ID do Telegram não encontrado. Verifique se channel_id, conversation.channel_thread_id ou message.chat.id está presente.' },
          { status: 400 }
        )
      }

      // Enviar mensagem ao Telegram via API
      const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: output,
          parse_mode: 'HTML', // Opcional: permite formatação HTML
        }),
      })

      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json()
        console.error('Erro ao enviar mensagem ao Telegram:', errorData)
        return NextResponse.json(
          { error: 'Erro ao enviar mensagem ao Telegram', details: errorData },
          { status: 500 }
        )
      }

      const telegramData = await telegramResponse.json()
      channelMessageId = telegramData.result?.message_id?.toString() || null

    } else if (finalChannel === 'whatsapp') {
      const whatsappApiUrl = settings.whatsapp_api_url as string
      const whatsappApiKey = settings.whatsapp_api_key as string

      if (!whatsappApiUrl || !whatsappApiKey) {
        return NextResponse.json(
          { error: 'Configurações do WhatsApp não encontradas' },
          { status: 400 }
        )
      }

      const whatsappNumber = channel_id || conversation.channel_thread_id

      if (!whatsappNumber) {
        return NextResponse.json(
          { error: 'Número do WhatsApp não encontrado' },
          { status: 400 }
        )
      }

      // Enviar mensagem via API do WhatsApp
      // Ajuste conforme a API do seu provedor
      const whatsappResponse = await fetch(`${whatsappApiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${whatsappApiKey}`,
        },
        body: JSON.stringify({
          to: whatsappNumber,
          message: output,
          type: 'text',
        }),
      })

      if (!whatsappResponse.ok) {
        const errorData = await whatsappResponse.text()
        console.error('Erro ao enviar mensagem ao WhatsApp:', errorData)
        return NextResponse.json(
          { error: 'Erro ao enviar mensagem ao WhatsApp', details: errorData },
          { status: 500 }
        )
      }

      const whatsappData = await whatsappResponse.json()
      channelMessageId = whatsappData.messageId || null

    } else {
      return NextResponse.json(
        { error: `Canal ${finalChannel} não suportado para envio de respostas` },
        { status: 400 }
      )
    }

    // Criar mensagem da IA no Controlia
    const messageFormData = new FormData()
    messageFormData.append('conversation_id', conversation_id)
    messageFormData.append('contact_id', conversation.contact_id || contact_id || contact.id)
    messageFormData.append('content', output)
    messageFormData.append('sender_type', 'ai')
    messageFormData.append('ai_agent_id', 'n8n-agent')
    messageFormData.append('direction', 'outbound')
    messageFormData.append('status', 'sent')
    if (channelMessageId) {
      messageFormData.append('channel_message_id', channelMessageId)
    }

    const messageResult = await createMessage(messageFormData)

    if (messageResult.error) {
      console.error('Erro ao criar mensagem no Controlia:', messageResult.error)
      // Não falhar, a mensagem já foi enviada ao canal
    }

    return NextResponse.json({
      success: true,
      message_id: messageResult.data?.id,
      channel_message_id: channelMessageId,
    })
  } catch (error) {
    console.error('Erro no webhook de resposta n8n:', error)
    return NextResponse.json(
      { error: 'Erro ao processar resposta do n8n' },
      { status: 500 }
    )
  }
}
