import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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
    const serviceClient = createServiceRoleClient()

    // ============================================
    // 1. Buscar empresa (company_id NÃO é obrigatório, mas definimos um fallback)
    // ============================================
    let company = null
    let settings: Record<string, unknown> = {}
    
    // Se company_id foi enviado, buscar essa empresa específica
    if (company_id) {
      const { data } = await serviceClient
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
    } else {
      // Sem company_id: usar a primeira empresa disponível como fallback
      const { data: firstCompany } = await serviceClient
        .from('companies')
        .select('id, settings')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (firstCompany) {
        company = firstCompany
        company_id = firstCompany.id
        settings = (firstCompany.settings as Record<string, unknown>) || {}
      } else {
        return NextResponse.json(
          { error: 'Nenhuma empresa encontrada. Crie uma empresa ou forneça company_id.' },
          { status: 400 }
        )
      }
    }

    // ============================================
    // 2. Buscar ou criar contato (company_id agora é obrigatório após fallback)
    // ============================================
    let contact = null
    let contact_id_final = contact_id
    
    if (contact_id) {
      // Buscar contato (com ou sem company_id)
      const query = serviceClient
        .from('contacts')
        .select('id, company_id')
        .eq('id', contact_id)
      
      query.eq('company_id', company_id)
      
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
      const { data: allContacts } = await serviceClient
        .from('contacts')
        .select('id, company_id, custom_fields')
        .eq('company_id', company_id)
      
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
        contactData.company_id = company_id
        
        const { data: newContact, error: contactError } = await serviceClient
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
    // 3. Buscar ou criar conversa (company_id definido)
    // ============================================
    let conversation = null
    let conversation_id_final = conversation_id
    let finalChannel = channel || 'telegram'
    
    if (conversation_id) {
      // Buscar conversa (com ou sem company_id)
      const query = serviceClient
        .from('conversations')
        .select('id, channel_thread_id, contact_id, channel')
        .eq('id', conversation_id)
      
      query.eq('company_id', company_id)
      
      const { data } = await query.single()
      conversation = data
      if (conversation) {
        conversation_id_final = conversation.id
        finalChannel = conversation.channel || finalChannel
      }
    }

    // Se não encontrou conversa, tentar buscar por channel_thread_id antes de criar
    if (!conversation && contact_id_final) {
      // Tentar obter channel_id de várias fontes
      const finalChannelId = channel_id || chatData.id?.toString() || fromData.id?.toString()

      if (!finalChannelId) {
        return NextResponse.json(
          { error: 'Não foi possível identificar o channel_id (chat.id do Telegram). Verifique se channel_id ou message.chat.id está presente.' },
          { status: 400 }
        )
      }

      // IMPORTANTE: Tentar buscar conversa existente por channel_thread_id antes de criar
      const { data: existingConversation } = await serviceClient
        .from('conversations')
        .select('id, channel_thread_id, contact_id, channel')
        .eq('company_id', company_id)
        .eq('contact_id', contact_id_final)
        .eq('channel', finalChannel)
        .eq('channel_thread_id', finalChannelId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingConversation) {
        conversation = existingConversation
        conversation_id_final = existingConversation.id
        finalChannel = existingConversation.channel || finalChannel
      } else {
        // Criar nova conversa apenas se não existir uma aberta com o mesmo channel_thread_id
        const conversationData: Record<string, unknown> = {
          contact_id: contact_id_final,
          channel: finalChannel,
          channel_thread_id: finalChannelId,
          status: 'open',
          priority: 'normal',
          ai_assistant_enabled: true,
        }
        conversationData.company_id = company_id
        
        const { data: newConversation, error: convError } = await serviceClient
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
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Não foi possível criar ou encontrar a conversa. Verifique se contact_id ou dados do Telegram (message.from) estão presentes.' },
        { status: 400 }
      )
    }

    // ✅ IMPORTANTE: Criar mensagem no banco ANTES de enviar ao canal
    // Isso garante que a mensagem aparece na interface mesmo se o envio ao Telegram falhar
    console.log('💾 PASSO 1: Salvando resposta da IA no Controlia ANTES de enviar ao Telegram...')
    console.log('   - company_id:', company_id)
    console.log('   - conversation_id:', conversation_id_final)
    console.log('   - content:', output.substring(0, 50) + '...')
    
    const { data: messageResult, error: messageError } = await serviceClient
      .from('messages')
      .insert({
        company_id,
        conversation_id: conversation_id_final,
        contact_id: conversation.contact_id || contact_id_final || '',
        content: output,
        sender_type: 'ai', // ✅ SEMPRE 'ai' para respostas da IA
        ai_agent_id: null,
        direction: 'outbound', // ✅ SEMPRE 'outbound' para respostas da IA
        status: 'pending', // Será atualizado para 'sent' após enviar ao Telegram
        channel_message_id: null, // Será atualizado após enviar ao Telegram
      })
      .select()
      .single()

    if (messageError) {
      console.error('❌ Erro ao criar mensagem no Controlia:', messageError)
      // Continuar mesmo com erro - tentar enviar ao Telegram
    } else if (messageResult) {
      console.log('✅ Mensagem da IA salva no Controlia:', messageResult.id)
      console.log('✅ A mensagem JÁ ESTÁ disponível na interface do Controlia')
      
      // ✅ VALIDAÇÃO CRÍTICA: Garantir que resposta IA seja SEMPRE 'outbound' e 'ai'
      if (messageResult.direction !== 'outbound') {
        console.error('❌ ERRO CRÍTICO: Resposta IA salva como inbound!')
        await serviceClient
          .from('messages')
          .update({ direction: 'outbound' })
          .eq('id', messageResult.id)
        messageResult.direction = 'outbound'
      }
      
      if (messageResult.sender_type !== 'ai') {
        console.error('❌ ERRO CRÍTICO: Resposta IA salva com sender_type incorreto!')
        await serviceClient
          .from('messages')
          .update({ sender_type: 'ai' })
          .eq('id', messageResult.id)
        messageResult.sender_type = 'ai'
      }
    }

    // ✅ PASSO 2: Enviar resposta ao canal apropriado
    let channelMessageId: string | null = null

    if (finalChannel === 'telegram') {
      // Tentar obter bot token de várias fontes (em ordem de prioridade)
      let telegramBotToken: string | undefined = undefined
      
      // 1. Primeiro: variável de ambiente (mais alta prioridade)
      telegramBotToken = process.env.TELEGRAM_BOT_TOKEN as string | undefined
      
      // 2. Segundo: settings da empresa atual (se tiver company_id)
      if (!telegramBotToken && settings.telegram_bot_token) {
        telegramBotToken = settings.telegram_bot_token as string
      }
      
      // 3. Terceiro: buscar em qualquer empresa que tenha o token configurado
      // Usar service role para bypass RLS (webhooks não têm usuário autenticado)
      if (!telegramBotToken) {
        try {
          console.log('Buscando bot token em todas as empresas (usando service role)...')
          
          // Usar service role client para bypass RLS
          const serviceClient = createServiceRoleClient()
          const { data: companies, error: companiesError } = await serviceClient
            .from('companies')
            .select('id, name, settings')
            .limit(100)
          
          if (companiesError) {
            console.error('Erro ao buscar empresas para bot token:', companiesError)
          } else if (companies && companies.length > 0) {
            console.log(`Verificando ${companies.length} empresas...`)
            for (const comp of companies) {
              try {
                const compSettings = (comp.settings as Record<string, unknown>) || {}
                const token = compSettings.telegram_bot_token
                
                if (token && typeof token === 'string' && token.trim() !== '') {
                  telegramBotToken = token.trim()
                  console.log(`✅ Bot token encontrado na empresa: ${comp.name || comp.id}`)
                  break
                }
              } catch (compError) {
                console.error(`Erro ao processar empresa ${comp.id}:`, compError)
                continue
              }
            }
            if (!telegramBotToken) {
              console.log('❌ Bot token não encontrado em nenhuma empresa')
            }
          } else {
            console.log('Nenhuma empresa encontrada no banco')
          }
        } catch (searchError) {
          console.error('Erro ao buscar bot token em empresas:', searchError)
          // Se service role não estiver configurada, tentar com cliente normal
          if (searchError instanceof Error && searchError.message.includes('SERVICE_ROLE')) {
            console.log('Service role não configurada, tentando com cliente normal...')
            const { data: companies } = await serviceClient
              .from('companies')
              .select('id, name, settings')
              .limit(100)
            
            if (companies && companies.length > 0) {
              for (const comp of companies) {
                const compSettings = (comp.settings as Record<string, unknown>) || {}
                const token = compSettings.telegram_bot_token
                if (token && typeof token === 'string' && token.trim() !== '') {
                  telegramBotToken = token.trim()
                  break
                }
              }
            }
          }
        }
      }

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
      
      // ✅ PASSO 3: Atualizar mensagem com channel_message_id e status após enviar ao Telegram
      if (messageResult) {
        console.log('💾 PASSO 3: Atualizando mensagem com channel_message_id e status...')
        await serviceClient
          .from('messages')
          .update({ 
            channel_message_id: channelMessageId,
            status: 'sent'
          })
          .eq('id', messageResult.id)
        console.log('✅ Mensagem atualizada:', {
          id: messageResult.id,
          channel_message_id: channelMessageId,
          status: 'sent'
        })
      }

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

    // ✅ NOTA: Mensagem já foi criada ANTES de enviar ao canal (linha 269)
    // Esta seção foi movida para antes do envio ao Telegram para garantir ordem correta

    return NextResponse.json({
      success: true,
      message_id: messageResult?.id || null,
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
