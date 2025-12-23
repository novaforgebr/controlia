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
    // 1. Buscar empresa (company_id NÃO é obrigatório)
    // ============================================
    let company = null
    let settings: Record<string, unknown> = {}
    
    // Se company_id foi enviado, buscar essa empresa específica
    if (company_id) {
      const { data } = await supabase
        .from('companies')
        .select('id, settings')
        .eq('id', company_id)
        .single()
      company = data
      
      if (!company) {
        return NextResponse.json(
          { error: `Empresa com ID ${company_id} não encontrada` },
          { status: 404 }
        )
      }
      settings = (company.settings as Record<string, unknown>) || {}
    }
    // Se company_id não foi enviado, continuar sem empresa (company_id será NULL)

    // ============================================
    // 2. Buscar ou criar contato (company_id é opcional)
    // ============================================
    let contact = null
    let contact_id_final = contact_id
    
    if (contact_id) {
      // Buscar contato (com ou sem company_id)
      const query = supabase
        .from('contacts')
        .select('id, company_id')
        .eq('id', contact_id)
      
      if (company_id) {
        query.eq('company_id', company_id)
      } else {
        query.is('company_id', null)
      }
      
      const { data } = await query.single()
      contact = data
      if (contact) {
        contact_id_final = contact.id
      }
    }

    // Se não encontrou contato, criar um novo baseado nos dados do Telegram
    if (!contact && fromData.id) {
      const telegramUserId = fromData.id.toString()
      const telegramUsername = fromData.username || null
      const firstName = fromData.first_name || ''
      const lastName = fromData.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim() || fromData.username || 'Usuário Telegram'

      // Verificar se já existe contato com este telegram_id
      const query = supabase
        .from('contacts')
        .select('id, company_id, custom_fields')
      
      if (company_id) {
        query.eq('company_id', company_id)
      } else {
        query.is('company_id', null)
      }
      
      const { data: allContacts } = await query
      
      const existingContact = allContacts?.find((c) => {
        const customFields = (c.custom_fields as Record<string, unknown>) || {}
        return customFields.telegram_id === telegramUserId
      })

      if (existingContact) {
        contact = existingContact
        contact_id_final = existingContact.id
      } else {
        // Criar novo contato (company_id é opcional)
        const contactData: Record<string, unknown> = {
          name: fullName,
          custom_fields: {
            telegram_id: telegramUserId,
            telegram_username: telegramUsername,
          },
          status: 'lead',
          source: 'telegram',
        }
        
        // Adicionar company_id apenas se existir
        if (company_id) {
          contactData.company_id = company_id
        }
        
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
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
        contact_id_final = newContact.id
      }
    }

    // Se não encontrou contato e não conseguiu criar, retornar erro
    if (!contact) {
      if (!fromData.id) {
        return NextResponse.json(
          { error: 'contact_id não foi fornecido e não foi possível criar um novo contato. É necessário enviar contact_id ou dados do Telegram (message.from) no payload.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao criar contato. Verifique os logs do servidor.' },
        { status: 500 }
      )
    }

    // ============================================
    // 3. Buscar ou criar conversa (company_id é opcional)
    // ============================================
    let conversation = null
    let conversation_id_final = conversation_id
    let finalChannel = channel || 'telegram'
    
    if (conversation_id) {
      // Buscar conversa (com ou sem company_id)
      const query = supabase
        .from('conversations')
        .select('id, channel_thread_id, contact_id, channel')
        .eq('id', conversation_id)
      
      if (company_id) {
        query.eq('company_id', company_id)
      } else {
        query.is('company_id', null)
      }
      
      const { data } = await query.single()
      conversation = data
      if (conversation) {
        conversation_id_final = conversation.id
        finalChannel = conversation.channel || finalChannel
      }
    }

    // Se não encontrou conversa, criar uma nova
    if (!conversation && contact_id_final) {
      // Tentar obter channel_id de várias fontes
      const finalChannelId = channel_id || chatData.id?.toString() || fromData.id?.toString()

      if (!finalChannelId) {
        return NextResponse.json(
          { error: 'Não foi possível identificar o channel_id (chat.id do Telegram). Verifique se channel_id ou message.chat.id está presente.' },
          { status: 400 }
        )
      }

      // Criar nova conversa (company_id é opcional)
      const conversationData: Record<string, unknown> = {
        contact_id: contact_id_final,
        channel: finalChannel,
        channel_thread_id: finalChannelId,
        status: 'open',
        priority: 'normal',
        ai_assistant_enabled: true,
      }
      
      // Adicionar company_id apenas se existir
      if (company_id) {
        conversationData.company_id = company_id
      }
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
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
      conversation_id_final = newConversation.id
      finalChannel = newConversation.channel || finalChannel
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Não foi possível criar ou encontrar a conversa. Verifique se contact_id ou dados do Telegram (message.from) estão presentes.' },
        { status: 400 }
      )
    }

    // Enviar resposta ao canal apropriado
    let channelMessageId: string | null = null

    if (finalChannel === 'telegram') {
      // Tentar obter bot token das settings ou de variável de ambiente
      const telegramBotToken = (settings.telegram_bot_token as string) || process.env.TELEGRAM_BOT_TOKEN

      if (!telegramBotToken) {
        return NextResponse.json(
          { error: 'Bot Token do Telegram não configurado. Configure em Configurações > Integrações > Telegram ou na variável de ambiente TELEGRAM_BOT_TOKEN' },
          { status: 400 }
        )
      }

      // Obter chat_id de várias fontes possíveis
      const telegramChatId = channel_id || conversation?.channel_thread_id || chatData.id?.toString() || fromData.id?.toString()

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

    // Criar mensagem da IA no Controlia (sempre, pois agora temos conversation_id)
    const messageFormData = new FormData()
    messageFormData.append('conversation_id', conversation_id_final)
    messageFormData.append('contact_id', conversation.contact_id || contact_id_final || '')
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
