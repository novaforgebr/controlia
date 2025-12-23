import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

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
    console.log('📥 Webhook Telegram recebido:', JSON.stringify(body, null, 2))

    // Estrutura do webhook do Telegram
    const message = body.message || body.edited_message
    if (!message) {
      // Pode ser outro tipo de update (callback_query, etc)
      console.log('⚠️ Update não processado (sem message)')
      console.log('⚠️ Body recebido:', JSON.stringify(body, null, 2))
      return NextResponse.json({ success: true, message: 'Update não processado' })
    }

    // Verificar se é mensagem de bot (ignorar)
    if (message.from?.is_bot === true) {
      console.log('⚠️ Mensagem ignorada (é de um bot):', message.from.id)
      return NextResponse.json({ success: true, message: 'Mensagem de bot ignorada' })
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

    console.log('📨 Processando mensagem do Telegram:', {
      message_id: message_id,
      from_id: from?.id,
      from_name: `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || from?.username,
      from_is_bot: from?.is_bot,
      text: text?.substring(0, 50),
      date: date,
      chat_id: chat?.id
    })

    if (!from || !chat) {
      console.error('❌ Erro: from ou chat são obrigatórios')
      return NextResponse.json(
        { error: 'from e chat são obrigatórios' },
        { status: 400 }
      )
    }

    // IMPORTANTE: Usar service role client para bypass RLS (webhooks não têm usuário autenticado)
    const serviceClient = createServiceRoleClient()
    const supabase = serviceClient // Usar service role para todas as operações (bypass RLS) // Usar service client para todas as operações

    // Buscar empresa pela configuração do bot token (se necessário)
    // Por enquanto, vamos buscar contato pelo username ou ID do Telegram
    const telegramUserId = from.id.toString()
    const telegramUsername = from.username || null

    // Buscar todas as empresas e verificar configurações
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
          { error: 'Erro ao criar contato', details: contactError.message },
          { status: 500 }
        )
      }

      contact = newContact
      console.log('✅ Contato criado:', contact.id)
    }

    if (!contact) {
      console.error('❌ Contato não encontrado e não foi possível criar')
      return NextResponse.json(
        { error: 'Contato não encontrado e não foi possível criar' },
        { status: 404 }
      )
    }

    console.log('✅ Contato encontrado/criado:', contact.id, 'Company:', contact.company_id)

    // Buscar ou criar conversa
    // IMPORTANTE: Buscar por channel_thread_id para garantir que reutilizamos a mesma conversa
    const channelThreadId = chat.id.toString()
    
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', contact.company_id)
      .eq('contact_id', contact.id)
      .eq('channel', 'telegram')
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
          channel: 'telegram',
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

      if (!newConversation) {
        console.error('Erro: Conversa não foi criada')
        return NextResponse.json(
          { error: 'Erro ao criar conversa' },
          { status: 500 }
        )
      }

      conversation = newConversation
    }

    // Verificar se conversation existe antes de continuar
    if (!conversation) {
      console.error('❌ Erro: Conversa não encontrada e não foi possível criar')
      return NextResponse.json(
        { error: 'Erro ao obter ou criar conversa' },
        { status: 500 }
      )
    }

    // Log após garantir que conversation não é null
    if (conversation.id) {
      console.log('✅ Conversa encontrada/criada:', conversation.id)
    }

    // Determinar tipo de conteúdo
    let content = text || ''
    let contentType = 'text'
    let mediaUrl = null

    console.log('📝 Conteúdo da mensagem:', { text, photo: !!photo, document: !!document, audio: !!audio, video: !!video, voice: !!voice })

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

    // Garantir que sempre há conteúdo
    if (!content || content.trim() === '') {
      content = '[Mensagem sem texto]'
    }

    console.log('📦 Conteúdo final:', { content, contentType, mediaUrl })

    if (!conversation) {
      console.error('❌ Conversa não encontrada após tentativas de busca/criação')
      return NextResponse.json(
        { error: 'Erro ao obter ou criar conversa' },
        { status: 500 }
      )
    }

    if (!contact || !contact.id) {
      console.error('❌ Contato não encontrado ou inválido')
      return NextResponse.json(
        { error: 'Erro ao obter ou criar contato' },
        { status: 500 }
      )
    }

    // Criar mensagem (usando service client para bypass RLS)
    const messageData = {
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
    }

    console.log('📋 Dados para inserção de mensagem:')
    console.log('   company_id:', messageData.company_id)
    console.log('   conversation_id:', messageData.conversation_id)
    console.log('   contact_id:', messageData.contact_id)
    console.log('   content:', messageData.content.substring(0, 100))
    console.log('   direction:', messageData.direction)
    console.log('   sender_type:', messageData.sender_type)

    console.log('💾 Tentando inserir mensagem:', JSON.stringify(messageData, null, 2))

    // IMPORTANTE: Usar serviceClient para bypass RLS (webhooks não têm usuário autenticado)
    let { data: newMessage, error: msgError } = await serviceClient
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (msgError) {
      console.error('❌ Erro ao criar mensagem:', msgError)
      console.error('❌ Código do erro:', msgError.code)
      console.error('❌ Mensagem do erro:', msgError.message)
      console.error('❌ Detalhes completos:', JSON.stringify(msgError, null, 2))
      console.error('❌ Dados que tentaram ser inseridos:', JSON.stringify(messageData, null, 2))
      
      // Tentar novamente sem created_at (pode ser problema de timezone)
      console.log('🔄 Tentando novamente sem created_at customizado...')
      const { created_at, ...messageDataRetry } = messageData
      
      const retryResult = await serviceClient
        .from('messages')
        .insert(messageDataRetry)
        .select()
        .single()
      
      if (retryResult.error) {
        console.error('❌ Erro na segunda tentativa:', retryResult.error)
        // Retornar 500 para Telegram reenviar (a mensagem é importante)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro ao criar mensagem no banco', 
            details: retryResult.error.message,
            code: retryResult.error.code 
          },
          { status: 500 } // Retornar 500 para Telegram reenviar
        )
      }
      
      console.log('✅ Mensagem criada na segunda tentativa:', retryResult.data?.id)
      // Continuar com retryMessage
      newMessage = retryResult.data
      msgError = null
    }

    if (!newMessage) {
      console.error('❌ Mensagem não foi criada (newMessage é null após todas as tentativas)')
      // Retornar 500 para Telegram reenviar
      return NextResponse.json(
        { success: false, error: 'Mensagem não foi criada' },
        { status: 500 }
      )
    }

    console.log('✅ Mensagem criada com sucesso:', newMessage.id, 'Content:', content.substring(0, 50))
    console.log('✅ Mensagem inbound salva no banco - ID:', newMessage.id, 'Direction:', newMessage.direction, 'Sender:', newMessage.sender_type)

    // Buscar automações ativas para processar mensagens
    console.log('🔍 Buscando automações para company_id:', contact.company_id)
    console.log('🔍 Critérios de busca:')
    console.log('   - company_id:', contact.company_id)
    console.log('   - trigger_event: "new_message"')
    console.log('   - is_active: true')
    console.log('   - is_paused: false')
    
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*')
      .eq('company_id', contact.company_id)
      .eq('trigger_event', 'new_message')
      .eq('is_active', true)
      .eq('is_paused', false)

    if (automationsError) {
      console.error('❌ Erro ao buscar automações:', automationsError)
      console.error('❌ Código do erro:', automationsError.code)
      console.error('❌ Mensagem do erro:', automationsError.message)
      console.error('❌ Detalhes completos:', JSON.stringify(automationsError, null, 2))
    } else {
      console.log('✅ Busca de automações executada sem erros')
    }

    console.log('🔍 Automações encontradas:', automations?.length || 0)
    
    // Log detalhado se não encontrar automações
    if (!automations || automations.length === 0) {
      console.warn('⚠️ NENHUMA automação encontrada!')
      console.warn('⚠️ Isso significa que a mensagem NÃO será enviada para o n8n')
      console.warn('⚠️ Verifique no banco de dados se existe uma automação com:')
      console.warn('   - company_id:', contact.company_id)
      console.warn('   - trigger_event: "new_message"')
      console.warn('   - is_active: true')
      console.warn('   - is_paused: false')
      console.warn('   - n8n_webhook_url: não nulo')
      
      // Tentar buscar TODAS as automações da empresa para debug
      const { data: allAutomations } = await supabase
        .from('automations')
        .select('*')
        .eq('company_id', contact.company_id)
      
      if (allAutomations && allAutomations.length > 0) {
        console.warn('📋 Automações encontradas na empresa (mas não atendem aos critérios):')
        allAutomations.forEach(a => {
          console.warn(`   - ${a.name}: trigger_event="${a.trigger_event}", is_active=${a.is_active}, is_paused=${a.is_paused}, url=${a.n8n_webhook_url ? '✅' : '❌'}`)
        })
      } else {
        console.warn('📋 Nenhuma automação encontrada para esta empresa')
      }
    }
    if (automations && automations.length > 0) {
      console.log('📋 Detalhes das automações:', JSON.stringify(automations.map(a => ({
        id: a.id,
        name: a.name,
        n8n_webhook_url: a.n8n_webhook_url ? `✅ ${a.n8n_webhook_url.substring(0, 50)}...` : '❌ Não configurado',
        is_active: a.is_active,
        is_paused: a.is_paused
      })), null, 2))
    } else {
      console.warn('⚠️ Nenhuma automação ativa encontrada para company_id:', contact.company_id)
      console.warn('💡 Verifique se existe uma automação com:')
      console.warn('   - company_id:', contact.company_id)
      console.warn('   - trigger_event: "new_message"')
      console.warn('   - is_active: true')
      console.warn('   - is_paused: false')
    }

    // Se houver automações configuradas, enviar para n8n
    if (automations && automations.length > 0) {
      // Priorizar automação "Atendimento com IA" ou a que tem secret na URL
      let automation = automations.find(a => 
        a.name?.toLowerCase().includes('ia') || 
        a.name?.toLowerCase().includes('atendimento') ||
        (a.n8n_webhook_url && a.n8n_webhook_url.includes('secret='))
      ) || automations[0] // Fallback para primeira se não encontrar
      
      console.log('🎯 Automação selecionada:', {
        id: automation.id,
        name: automation.name,
        url: automation.n8n_webhook_url?.substring(0, 80) + '...',
        has_url: !!automation.n8n_webhook_url
      })
      
      if (automation.n8n_webhook_url) {
        console.log('📤 PREPARANDO envio para n8n')
        console.log('📤 URL completa:', automation.n8n_webhook_url)
        try {
          // Preparar headers
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          // Verificar se há secret configurado nas settings da empresa
          // O secret pode estar na URL (query param) ou pode ser enviado como header
          // Primeiro, tentar obter das settings da empresa
          const { data: companySettings } = await supabase
            .from('companies')
            .select('settings')
            .eq('id', contact.company_id)
            .single()

          const settings = (companySettings?.settings as Record<string, unknown>) || {}
          const n8nWebhookSecret = settings.n8n_webhook_secret as string | undefined

          // Preparar URL do webhook
          let webhookUrl = automation.n8n_webhook_url
          console.log('🔗 URL do webhook (original):', webhookUrl)
          
          // O n8n pode esperar o secret de três formas:
          // 1. Como query parameter na URL (?secret=xxx) - quando Authentication é "None"
          // 2. Como header HTTP (X-Webhook-Secret) - quando Authentication é "Header Auth"
          // 3. Sem autenticação (None) - não recomendado
          
          // Verificar se o secret já está na URL
          let hasSecretInUrl = false
          try {
            const urlObj = new URL(webhookUrl)
            hasSecretInUrl = urlObj.searchParams.has('secret')
            console.log('🔍 Verificação da URL:')
            console.log('   - Secret na URL?', hasSecretInUrl)
            if (hasSecretInUrl) {
              const secretFromUrl = urlObj.searchParams.get('secret')
              console.log('   - Secret extraído da URL:', secretFromUrl ? secretFromUrl.substring(0, 5) + '...' : 'null')
            }
          } catch (urlError) {
            console.warn('⚠️ Erro ao processar URL do webhook:', urlError)
            hasSecretInUrl = webhookUrl.includes('secret=')
            console.log('   - Fallback: verificando se URL contém "secret=":', hasSecretInUrl)
          }
          
          if (hasSecretInUrl) {
            // Secret na URL = usar query parameter (Authentication: None no n8n)
            console.log('🔐 Secret encontrado na URL - usando query parameter (Authentication: None)')
            console.log('🔐 NÃO adicionando headers de autenticação - o secret já está na URL')
            // Não adicionar headers, apenas usar o query parameter que já está na URL
          } else if (n8nWebhookSecret) {
            // Secret não na URL = usar Header Auth
            console.log('🔐 Secret não na URL - usando Header Auth')
            console.log('🔐 Secret das settings:', n8nWebhookSecret.substring(0, 5) + '...')
            // O n8n está configurado para aceitar "X-Webhook-Secret" como nome do header
            headers['X-Webhook-Secret'] = n8nWebhookSecret
            console.log('🔐 Secret enviado como header HTTP: X-Webhook-Secret')
            console.log('🔐 Valor do secret completo:', n8nWebhookSecret)
            console.log('🔐 Tamanho do secret:', n8nWebhookSecret.length, 'caracteres')
          } else {
            // Nenhum secret configurado
            console.warn('⚠️ Nenhum secret configurado nas settings da empresa')
            console.warn('⚠️ Verificando se o secret está na URL do webhook...')
            try {
              const urlObj = new URL(webhookUrl)
              if (urlObj.searchParams.has('secret')) {
                console.log('✅ Secret encontrado na URL do webhook - será usado automaticamente')
              } else {
                console.error('❌ Nenhum secret encontrado! O n8n pode rejeitar a requisição.')
                console.error('💡 Configure n8n_webhook_secret nas settings da empresa ou adicione ?secret=xxx na URL do webhook')
              }
            } catch (urlError) {
              console.warn('⚠️ Não foi possível processar URL do webhook:', urlError)
            }
          }

          // Preparar payload para o n8n
          const n8nPayload = {
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
              conversation_id: conversation?.id,
              message_id: newMessage?.id,
              channel: 'telegram',
              callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'}/api/webhooks/n8n/channel-response`,
            },
          }

          console.log('📤 ENVIANDO para n8n:')
          console.log('   URL:', webhookUrl)
          console.log('   Headers:', JSON.stringify(headers, null, 2))
          console.log('   Payload (resumo):', {
            update_id: n8nPayload.update_id,
            message_text: n8nPayload.message?.text,
            controlia_company_id: n8nPayload.controlia?.company_id,
            controlia_contact_id: n8nPayload.controlia?.contact_id,
            controlia_conversation_id: n8nPayload.controlia?.conversation_id,
            controlia_callback_url: n8nPayload.controlia?.callback_url
          })

          // Enviar para o n8n no formato que seu workflow espera
          console.log('🚀 Fazendo requisição HTTP POST para n8n...')
          const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(n8nPayload),
          })
          console.log('✅ Requisição HTTP concluída')

          console.log('📡 Resposta do n8n:')
          console.log('   Status:', n8nResponse.status, n8nResponse.statusText)
          console.log('   Headers:', JSON.stringify(Object.fromEntries(n8nResponse.headers.entries()), null, 2))

          if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('❌ Erro ao enviar para n8n:')
            console.error('   Status HTTP:', n8nResponse.status)
            console.error('   Resposta:', errorText)
            console.error('   URL tentada:', webhookUrl)
            console.error('   Headers enviados:', JSON.stringify(headers, null, 2))
            
            // Registrar log de erro
            try {
              await supabase.from('automation_logs').insert({
                company_id: contact.company_id,
                automation_id: automation.id,
                trigger_event: 'new_message',
                trigger_data: {
                  message_id: newMessage?.id,
                  conversation_id: conversation?.id,
                  channel: 'telegram',
                  webhook_url: webhookUrl,
                },
                status: 'error',
                error_message: `HTTP ${n8nResponse.status}: ${errorText.substring(0, 500)}`,
                started_at: new Date().toISOString(),
              })
            } catch (logError) {
              console.error('❌ Erro ao registrar log de automação:', logError)
            }
          } else {
            let responseData: unknown = null
            try {
              responseData = await n8nResponse.json()
            } catch {
              try {
                const text = await n8nResponse.text()
                responseData = { raw: text }
              } catch {
                responseData = { raw: 'Não foi possível ler a resposta' }
              }
            }
            console.log('✅ Mensagem enviada para n8n com sucesso')
            console.log('📥 Resposta do n8n:', responseData ? JSON.stringify(responseData, null, 2) : 'Sem resposta JSON')
            
            // Registrar log de execução
            try {
              await supabase.from('automation_logs').insert({
                company_id: contact.company_id,
                automation_id: automation.id,
                trigger_event: 'new_message',
                trigger_data: {
                  message_id: newMessage?.id,
                  conversation_id: conversation?.id,
                  channel: 'telegram',
                },
                status: 'success',
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              })
            } catch (logError) {
              console.error('❌ Erro ao registrar log de automação:', logError)
            }
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

    if (!newMessage) {
      console.error('❌ CRÍTICO: newMessage é null após todas as tentativas de criação')
      console.error('❌ Isso significa que a mensagem NÃO foi salva no banco!')
      return NextResponse.json(
        { error: 'Erro ao criar mensagem no banco de dados' },
        { status: 500 }
      )
    }

    if (!conversation || !conversation.id) {
      console.error('❌ CRÍTICO: conversation é null ou inválida')
      return NextResponse.json(
        { error: 'Erro ao obter ou criar conversa' },
        { status: 500 }
      )
    }

    console.log('✅ Webhook Telegram processado com sucesso')
    console.log('✅ Resumo final da mensagem inbound criada:')
    console.log('   - Mensagem ID:', newMessage.id)
    console.log('   - Conversa ID:', conversation.id)
    console.log('   - Contato ID:', contact.id)
    console.log('   - Direction:', newMessage.direction)
    console.log('   - Sender Type:', newMessage.sender_type)
    console.log('   - Content:', newMessage.content?.substring(0, 50))
    console.log('   - Company ID:', newMessage.company_id)
    
    return NextResponse.json({
      success: true,
      message_id: newMessage.id,
      conversation_id: conversation.id,
      direction: newMessage.direction,
      sender_type: newMessage.sender_type,
    })
  } catch (error) {
    console.error('❌ Erro no webhook do Telegram:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error instanceof Error ? error.message : String(error) },
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

