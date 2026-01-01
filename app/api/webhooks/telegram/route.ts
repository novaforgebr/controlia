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
    const supabase = serviceClient

    // ✅ NOVA ABORDAGEM: Extrair company_id da URL (query parameter)
    const companyId = request.nextUrl.searchParams.get('company_id')
    
    if (!companyId) {
      console.error('❌ ERRO: company_id não fornecido na URL do webhook')
      return NextResponse.json(
        { 
          error: 'company_id obrigatório',
          message: 'O webhook do Telegram requer o parâmetro company_id na URL. Exemplo: /api/webhooks/telegram?company_id=xxx'
        },
        { status: 400 }
      )
    }

    console.log('🔍 Company ID da URL:', companyId)

    // Buscar empresa diretamente pelo ID
    const { data: targetCompany, error: companyError } = await supabase
      .from('companies')
      .select('id, name, settings, is_active')
      .eq('id', companyId)
      .single()

    if (companyError || !targetCompany) {
      console.error('❌ Erro ao buscar empresa:', companyError)
      return NextResponse.json(
        { 
          error: 'Empresa não encontrada',
          message: `Empresa com ID ${companyId} não foi encontrada no banco de dados.`
        },
        { status: 404 }
      )
    }

    // Validar que empresa está ativa
    if (!targetCompany.is_active) {
      console.error('❌ Empresa inativa:', targetCompany.name || targetCompany.id)
      return NextResponse.json(
        { 
          error: 'Empresa inativa',
          message: 'A empresa está inativa e não pode receber mensagens.'
        },
        { status: 403 }
      )
    }

    // Validar que empresa tem token configurado
    const settings = (targetCompany.settings as Record<string, unknown>) || {}
    const companyBotToken = settings.telegram_bot_token as string | undefined

    if (!companyBotToken || !companyBotToken.trim()) {
      console.error('❌ Empresa sem token configurado:', targetCompany.name || targetCompany.id)
      return NextResponse.json(
        { 
          error: 'Token não configurado',
          message: `A empresa ${targetCompany.name || targetCompany.id} não possui bot token configurado nas settings. Configure o token em Configurações > Integrações > Telegram.`
        },
        { status: 400 }
      )
    }

    console.log(`✅ Empresa identificada: ${targetCompany.name || targetCompany.id}`)
    console.log(`   - Company ID: ${targetCompany.id}`)
    console.log(`   - Token configurado: ${companyBotToken.substring(0, 10)}...`)
    console.log(`   - URL do webhook recebida: ${request.nextUrl.toString()}`)

    // ✅ VALIDAÇÃO ADICIONAL: Verificar se há outras empresas com o mesmo bot token
    // Isso ajuda a identificar conflitos de configuração
    const { data: companiesWithSameToken } = await supabase
      .from('companies')
      .select('id, name, settings')
      .neq('id', targetCompany.id)
      .limit(100)

    if (companiesWithSameToken) {
      const conflictingCompanies = companiesWithSameToken.filter((c) => {
        const cSettings = (c.settings as Record<string, unknown>) || {}
        const cToken = (cSettings.telegram_bot_token as string) || ''
        return cToken && cToken.trim() === companyBotToken.trim()
      })

      if (conflictingCompanies.length > 0) {
        console.error('⚠️ AVISO: Outras empresas encontradas com o mesmo bot token:')
        conflictingCompanies.forEach((c) => {
          console.error(`   - ${c.name || c.id} (ID: ${c.id})`)
        })
        console.error('   Isso pode causar conflitos! Cada empresa deve ter seu próprio bot token único.')
      }
    }

    // Dados do usuário Telegram
    const telegramUserId = from.id.toString()
    const telegramUsername = from.username || null

    console.log('🔍 Buscando contato pelo Telegram:', {
      telegram_id: telegramUserId,
      telegram_username: telegramUsername,
      company_id: targetCompany.id
    })

    // ✅ CORREÇÃO: Buscar contato PRIMEIRO por telegram_id (único e obrigatório)
    // Só usar telegram_username como fallback se telegram_id não existir
    let contact: { id: string; company_id: string; name?: string; custom_fields: unknown; ai_enabled: boolean } | null | undefined = null
    
    // Primeira tentativa: buscar por telegram_id (mais confiável)
    const { data: contactsById } = await supabase
      .from('contacts')
      .select('id, company_id, name, custom_fields, ai_enabled')
      .eq('company_id', targetCompany.id)
      .limit(1000)

    if (contactsById) {
      contact = contactsById.find((c) => {
        const customFields = c.custom_fields as Record<string, unknown> || {}
        // ✅ PRIORIDADE 1: Buscar por telegram_id (único e obrigatório)
        return customFields.telegram_id === telegramUserId
      })
    }

    // ✅ Se não encontrou por telegram_id E temos username, tentar por username
    // Mas apenas se telegram_id não existir em nenhum contato
    if (!contact && telegramUsername) {
      console.log('⚠️ Contato não encontrado por telegram_id, tentando por username...')
      if (contactsById) {
        contact = contactsById.find((c) => {
          const customFields = c.custom_fields as Record<string, unknown> || {}
          // ✅ PRIORIDADE 2: Buscar por username apenas se telegram_id não existir
          return (
            !customFields.telegram_id && // Não tem telegram_id
            customFields.telegram_username === telegramUsername
          )
        })
      }
    }

    if (contact) {
      console.log('✅ Contato encontrado:', {
        contact_id: contact.id,
        name: contact.name,
        telegram_id: (contact.custom_fields as Record<string, unknown>)?.telegram_id,
        telegram_username: (contact.custom_fields as Record<string, unknown>)?.telegram_username
      })
    }

    // Se não encontrou contato, criar um novo
    if (!contact) {
      console.log('📝 Contato não encontrado, criando novo contato...')
      const company = targetCompany

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
          ai_enabled: true, // Habilitar IA por padrão para novos contatos
        })
        .select('id, company_id, name, custom_fields, ai_enabled')
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
    // ✅ IMPORTANTE: channel_thread_id é o chat.id do Telegram (único por usuário)
    // Cada usuário do Telegram tem um chat.id único, então devemos buscar por:
    // 1. company_id (empresa)
    // 2. contact_id (contato específico)
    // 3. channel_thread_id (chat.id do Telegram - único por usuário)
    const channelThreadId = chat.id.toString()
    
    console.log('🔍 Buscando conversa:', {
      company_id: contact.company_id,
      contact_id: contact.id,
      channel: 'telegram',
      channel_thread_id: channelThreadId
    })
    
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id, ai_assistant_enabled, contact_id, channel_thread_id')
      .eq('company_id', contact.company_id)
      .eq('contact_id', contact.id) // ✅ CRÍTICO: Garantir que a conversa pertence ao contato correto
      .eq('channel', 'telegram')
      .eq('channel_thread_id', channelThreadId) // ✅ CRÍTICO: Garantir que é o chat correto do Telegram
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (conversation) {
      console.log('✅ Conversa encontrada:', {
        conversation_id: conversation.id,
        contact_id: conversation.contact_id,
        channel_thread_id: conversation.channel_thread_id
      })
      
      // ✅ VALIDAÇÃO CRÍTICA: Verificar se a conversa realmente pertence ao contato correto
      if (conversation.contact_id !== contact.id) {
        console.error('❌ ERRO CRÍTICO: Conversa encontrada pertence a outro contato!', {
          conversa_contact_id: conversation.contact_id,
          contato_atual_id: contact.id,
          channel_thread_id: channelThreadId
        })
        // Não usar esta conversa, criar uma nova
        conversation = null
      }
    }

    if (!conversation) {
      // ✅ VALIDAÇÃO ANTES DE CRIAR: Verificar se já existe conversa com este channel_thread_id
      // mas com outro contact_id (isso indicaria um problema de dados)
      const { data: existingConversationWithDifferentContact } = await supabase
        .from('conversations')
        .select('id, contact_id, channel_thread_id')
        .eq('company_id', contact.company_id)
        .eq('channel', 'telegram')
        .eq('channel_thread_id', channelThreadId)
        .neq('contact_id', contact.id)
        .maybeSingle()
      
      if (existingConversationWithDifferentContact) {
        console.error('❌ ERRO CRÍTICO: Já existe conversa com este channel_thread_id mas com outro contato!', {
          conversa_existente_id: existingConversationWithDifferentContact.id,
          conversa_contact_id: existingConversationWithDifferentContact.contact_id,
          contato_atual_id: contact.id,
          channel_thread_id: channelThreadId
        })
        // Fechar a conversa antiga e criar uma nova com o contato correto
        await supabase
          .from('conversations')
          .update({ status: 'closed' })
          .eq('id', existingConversationWithDifferentContact.id)
        console.log('✅ Conversa antiga fechada, criando nova com contato correto')
      }
      
      console.log('📝 Criando nova conversa:', {
        company_id: contact.company_id,
        contact_id: contact.id,
        contact_name: contact.name || 'Sem nome',
        channel: 'telegram',
        channel_thread_id: channelThreadId,
        telegram_user_id: telegramUserId
      })
      
      // Criar nova conversa apenas se não existir uma aberta com o mesmo channel_thread_id
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          company_id: contact.company_id,
          contact_id: contact.id, // ✅ CRÍTICO: Garantir que usa o contact_id correto
          channel: 'telegram',
          channel_thread_id: channelThreadId,
          status: 'open',
          priority: 'normal',
          ai_assistant_enabled: true,
        })
        .select('id, company_id, contact_id, ai_assistant_enabled, channel_thread_id')
        .single()

      if (convError) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json(
          { error: 'Erro ao criar conversa', details: convError.message },
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

      // ✅ VALIDAÇÃO PÓS-CRIAÇÃO: Verificar se a conversa foi criada com o contato correto
      if (newConversation.contact_id !== contact.id) {
        console.error('❌ ERRO CRÍTICO: Conversa criada com contact_id incorreto!', {
          conversa_criada_contact_id: newConversation.contact_id,
          contato_esperado_id: contact.id
        })
        return NextResponse.json(
          { error: 'Erro ao criar conversa: contact_id incorreto' },
          { status: 500 }
        )
      }

      conversation = newConversation
      console.log('✅ Conversa criada com sucesso:', {
        conversation_id: conversation.id,
        contact_id: conversation.contact_id,
        channel_thread_id: conversation.channel_thread_id
      })
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
      mediaUrl = `https://api.telegram.org/file/bot${companyBotToken}/${largestPhoto.file_id}`
      contentType = 'image'
      content = text || '[Foto]'
    } else if (document) {
      mediaUrl = `https://api.telegram.org/file/bot${companyBotToken}/${document.file_id}`
      contentType = 'document'
      content = document.file_name || '[Documento]'
    } else if (audio) {
      mediaUrl = `https://api.telegram.org/file/bot${companyBotToken}/${audio.file_id}`
      contentType = 'audio'
      content = '[Áudio]'
    } else if (video) {
      mediaUrl = `https://api.telegram.org/file/bot${companyBotToken}/${video.file_id}`
      contentType = 'video'
      content = text || '[Vídeo]'
    } else if (voice) {
      mediaUrl = `https://api.telegram.org/file/bot${companyBotToken}/${voice.file_id}`
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

    // ✅ VALIDAÇÃO FINAL: Verificar se contact e conversation estão corretos antes de criar mensagem
    console.log('📨 Criando mensagem:', {
      company_id: contact.company_id,
      contact_id: contact.id,
      contact_name: contact.name || 'Sem nome',
      conversation_id: conversation.id,
      conversation_contact_id: conversation.contact_id,
      channel_thread_id: channelThreadId,
      telegram_user_id: telegramUserId
    })
    
    // ✅ VALIDAÇÃO CRÍTICA: Garantir que conversation.contact_id === contact.id
    if (conversation.contact_id !== contact.id) {
      console.error('❌ ERRO CRÍTICO: Tentativa de criar mensagem com contato/conversa incorretos!', {
        conversation_contact_id: conversation.contact_id,
        contact_atual_id: contact.id,
        conversation_id: conversation.id
      })
      return NextResponse.json(
        { error: 'Erro: conversa não pertence ao contato correto' },
        { status: 500 }
      )
    }

    // ✅ IDEMPOTÊNCIA: Verificar se mensagem já foi processada ANTES de criar
    // Isso evita duplicação quando o Telegram reenvia o mesmo webhook
    const channelMessageId = message_id.toString()
    console.log('🔍 Verificando se mensagem já foi processada (idempotência)...')
    console.log('   - channel_message_id:', channelMessageId)
    console.log('   - conversation_id:', conversation.id)
    
    const { data: existingMessage, error: checkError } = await serviceClient
      .from('messages')
      .select('id, created_at, direction, sender_type, content')
      .eq('company_id', contact.company_id)
      .eq('conversation_id', conversation.id)
      .eq('channel_message_id', channelMessageId)
      .maybeSingle()
    
    if (checkError) {
      console.warn('⚠️ Erro ao verificar mensagem existente (continuando):', checkError.message)
      // Continuar normalmente se houver erro na verificação
    } else if (existingMessage) {
      console.log('✅ Mensagem já foi processada anteriormente (idempotência)')
      console.log('   - Mensagem ID:', existingMessage.id)
      console.log('   - Criada em:', existingMessage.created_at)
      console.log('   - Content:', existingMessage.content?.substring(0, 50))
      console.log('   - Direction:', existingMessage.direction)
      console.log('   - Sender Type:', existingMessage.sender_type)
      console.log('')
      console.log('🚫 ==========================================')
      console.log('🚫 DUPLICAÇÃO PREVENIDA - Mensagem já existe')
      console.log('🚫 ==========================================')
      console.log('✅ Retornando sucesso SEM criar duplicata')
      console.log('✅ Retornando sucesso SEM enviar para n8n novamente')
      console.log('🚫 ==========================================')
      console.log('')
      
      // Retornar sucesso imediatamente - mensagem já foi processada
      // Isso evita que o Telegram continue reenviando o webhook
      return NextResponse.json({
        success: true,
        message_id: existingMessage.id,
        conversation_id: conversation.id,
        direction: existingMessage.direction,
        sender_type: existingMessage.sender_type,
        already_processed: true, // ✅ Indicar que já foi processada
        duplicate_prevented: true, // ✅ Indicar que duplicação foi prevenida
        saved_to_controlia: true,
      })
    } else {
      console.log('✅ Mensagem não encontrada - pode ser processada normalmente')
    }
    
    // Criar mensagem (usando service client para bypass RLS)
    // IMPORTANTE: Garantir que company_id seja o mesmo da conversa para consistência
    // Usar contact.company_id como fallback (conversation já tem o mesmo company_id)
    const messageData = {
      company_id: contact.company_id, // Usar company_id do contato (conversation tem o mesmo)
      conversation_id: conversation.id,
      contact_id: contact.id, // ✅ CRÍTICO: Garantir que usa o contact_id correto
      content: content,
      content_type: contentType,
      direction: 'inbound',
      sender_type: 'human',
      channel_message_id: message_id.toString(),
      media_url: mediaUrl,
      status: 'delivered',
      created_at: new Date(date * 1000).toISOString(), // Telegram usa timestamp Unix
    }
    
    // Log para debug
    console.log('📋 Company IDs para mensagem:')
    console.log('   - contact.company_id:', contact.company_id)
    console.log('   - messageData.company_id (final):', messageData.company_id)

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
      
      // ✅ Verificar se o erro é de duplicação (pode acontecer em race conditions)
      // Código de erro do PostgreSQL para unique constraint violation
      if (msgError.code === '23505' || msgError.message?.includes('duplicate') || msgError.message?.includes('unique')) {
        console.log('⚠️ Erro de duplicação detectado - verificando se mensagem já existe...')
        
        // Tentar buscar a mensagem que já existe
        const { data: duplicateMessage } = await serviceClient
          .from('messages')
          .select('id, created_at, direction, sender_type')
          .eq('company_id', contact.company_id)
          .eq('conversation_id', conversation.id)
          .eq('channel_message_id', channelMessageId)
          .maybeSingle()
        
        if (duplicateMessage) {
          console.log('✅ Mensagem duplicada encontrada - retornando sucesso')
          console.log('   - Mensagem ID:', duplicateMessage.id)
          console.log('   - Criada em:', duplicateMessage.created_at)
          return NextResponse.json({
            success: true,
            message_id: duplicateMessage.id,
            conversation_id: conversation.id,
            direction: duplicateMessage.direction,
            sender_type: duplicateMessage.sender_type,
            already_processed: true,
            duplicate_prevented: true,
            saved_to_controlia: true,
          })
        }
      }
      
      // Tentar novamente sem created_at (pode ser problema de timezone)
      console.log('🔄 Tentando novamente sem created_at customizado...')
      const { created_at, ...messageDataRetry } = messageData
      
      const retryResult = await serviceClient
        .from('messages')
        .insert(messageDataRetry)
        .select()
        .single()
      
      if (retryResult.error) {
        // ✅ Verificar novamente se é duplicação na segunda tentativa
        if (retryResult.error.code === '23505' || retryResult.error.message?.includes('duplicate') || retryResult.error.message?.includes('unique')) {
          console.log('⚠️ Erro de duplicação na segunda tentativa - verificando...')
          const { data: duplicateMessage2 } = await serviceClient
            .from('messages')
            .select('id, created_at, direction, sender_type')
            .eq('company_id', contact.company_id)
            .eq('conversation_id', conversation.id)
            .eq('channel_message_id', channelMessageId)
            .maybeSingle()
          
          if (duplicateMessage2) {
            console.log('✅ Mensagem duplicada encontrada na segunda tentativa - retornando sucesso')
            return NextResponse.json({
              success: true,
              message_id: duplicateMessage2.id,
              conversation_id: conversation.id,
              direction: duplicateMessage2.direction,
              sender_type: duplicateMessage2.sender_type,
              already_processed: true,
              duplicate_prevented: true,
              saved_to_controlia: true,
            })
          }
        }
        
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
    console.log('✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia ANTES de enviar para n8n')
    console.log('✅ Mensagem está disponível na interface do Controlia agora')
    console.log('✅ VALIDAÇÃO: Mensagem salva com company_id:', newMessage.company_id)
    console.log('✅ VALIDAÇÃO: Mensagem salva com conversation_id:', newMessage.conversation_id)
    console.log('✅ VALIDAÇÃO: Mensagem salva com contact_id:', newMessage.contact_id)
    
    // ✅ IMPORTANTE: Buscar conversa e contato novamente para garantir que temos os valores mais atualizados
    // Isso é crítico porque o usuário pode ter desativado a IA após a conversa/contato ter sido criado/buscado
    console.log('🔄 Buscando conversa e contato novamente para verificar status atual da IA...')
    
    // Buscar conversa atualizada
    const { data: updatedConversation, error: convUpdateError } = await supabase
      .from('conversations')
      .select('id, ai_assistant_enabled')
      .eq('id', conversation.id)
      .single()
    
    if (convUpdateError) {
      console.error('⚠️ Erro ao buscar conversa atualizada:', convUpdateError)
      // Continuar com a conversa anterior se houver erro
    } else if (updatedConversation) {
      console.log('✅ Conversa atualizada obtida')
      console.log('   - ai_assistant_enabled:', updatedConversation.ai_assistant_enabled)
      // Atualizar objeto conversation com valores mais recentes
      conversation = { ...conversation, ...updatedConversation }
    }
    
    // Buscar contato atualizado
    const { data: updatedContact, error: contactUpdateError } = await supabase
      .from('contacts')
      .select('id, ai_enabled')
      .eq('id', contact.id)
      .single()
    
    if (contactUpdateError) {
      console.error('⚠️ Erro ao buscar contato atualizado:', contactUpdateError)
      // Continuar com o contato anterior se houver erro
    } else if (updatedContact) {
      console.log('✅ Contato atualizado obtido')
      console.log('   - ai_enabled:', updatedContact.ai_enabled)
      // Atualizar objeto contact com valores mais recentes
      contact = { ...contact, ...updatedContact }
    }
    
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se a mensagem realmente foi salva e pode ser lida
    try {
      const { data: verifyMessage, error: verifyError } = await serviceClient
        .from('messages')
        .select('id, direction, sender_type, company_id, conversation_id')
        .eq('id', newMessage.id)
        .single()
      
      if (verifyError) {
        console.error('❌ ERRO CRÍTICO: Mensagem não pode ser lida após salvar!')
        console.error('   - Erro:', verifyError.message)
        console.error('   - Código:', verifyError.code)
      } else if (verifyMessage) {
        console.log('✅ VALIDAÇÃO: Mensagem confirmada no banco - pode ser lida')
        console.log('   - ID:', verifyMessage.id)
        console.log('   - Direction:', verifyMessage.direction)
        console.log('   - Sender Type:', verifyMessage.sender_type)
        console.log('   - Company ID:', verifyMessage.company_id)
      }
    } catch (verifyErr) {
      console.error('❌ Erro ao verificar mensagem:', verifyErr)
    }

    // ✅ VALIDAÇÃO CRÍTICA: Garantir que mensagem recebida seja SEMPRE 'inbound' e 'human'
    if (newMessage.direction !== 'inbound') {
      console.error('❌ ERRO CRÍTICO: Mensagem recebida salva como outbound!')
      console.error('   - message_id:', newMessage.id)
      console.error('   - direction atual:', newMessage.direction)
      console.error('   - direction esperado: inbound')
      
      // Tentar corrigir no banco
      try {
        await serviceClient
          .from('messages')
          .update({ direction: 'inbound' })
          .eq('id', newMessage.id)
        console.log('✅ Direção corrigida no banco de dados')
        newMessage.direction = 'inbound'
      } catch (fixError) {
        console.error('❌ Erro ao corrigir direção:', fixError)
      }
    }
    
    if (newMessage.sender_type !== 'human') {
      console.error('❌ ERRO CRÍTICO: Mensagem humana salva com sender_type incorreto!')
      console.error('   - message_id:', newMessage.id)
      console.error('   - sender_type atual:', newMessage.sender_type)
      console.error('   - sender_type esperado: human')
      
      // Tentar corrigir no banco
      try {
        await serviceClient
          .from('messages')
          .update({ sender_type: 'human' })
          .eq('id', newMessage.id)
        console.log('✅ Sender type corrigido no banco de dados')
        newMessage.sender_type = 'human'
      } catch (fixError) {
        console.error('❌ Erro ao corrigir sender_type:', fixError)
      }
    }

    // ✅ PASSO 2: Verificar se IA está habilitada antes de buscar automações
    // IMPORTANTE: Mensagem JÁ FOI SALVA no passo anterior
    // Verificar se a IA está habilitada na conversa E no contato
    // AMBOS devem estar true para enviar ao n8n
    const conversationAIEnabled = conversation?.ai_assistant_enabled === true
    const contactAIEnabled = contact?.ai_enabled === true
    const isAIEnabled = conversationAIEnabled && contactAIEnabled
    
    console.log('📋 PASSO 2: Verificando se IA está habilitada (VERIFICAÇÃO CRÍTICA)')
    console.log('   - conversation.id:', conversation?.id)
    console.log('   - conversation.ai_assistant_enabled:', conversation?.ai_assistant_enabled, `(${typeof conversation?.ai_assistant_enabled})`)
    console.log('   - contact.id:', contact?.id)
    console.log('   - contact.ai_enabled:', contact?.ai_enabled, `(${typeof contact?.ai_enabled})`)
    console.log('   - conversationAIEnabled:', conversationAIEnabled)
    console.log('   - contactAIEnabled:', contactAIEnabled)
    console.log('   - isAIEnabled (AMBOS devem ser true):', isAIEnabled)
    
    // ✅ BLOQUEIO CRÍTICO: Se IA não estiver habilitada, NÃO buscar automações e NÃO enviar ao n8n
    if (!isAIEnabled) {
      console.log('')
      console.log('🚫 ==========================================')
      console.log('🚫 BLOQUEIO: IA NÃO ESTÁ HABILITADA')
      console.log('🚫 ==========================================')
      console.log('⚠️ conversation.ai_assistant_enabled:', conversationAIEnabled ? '✅ true' : '❌ false/undefined')
      console.log('⚠️ contact.ai_enabled:', contactAIEnabled ? '✅ true' : '❌ false/undefined')
      console.log('⚠️ Mensagem foi salva no Controlia, mas NÃO será enviada para n8n')
      console.log('✅ Fluxo: Telegram -> Controlia (SEM n8n)')
      console.log('🚫 ==========================================')
      console.log('')
      
      // Retornar sucesso - mensagem foi salva, mas NÃO será processada pela IA
      return NextResponse.json({
        success: true,
        message_id: newMessage.id,
        conversation_id: conversation.id,
        direction: newMessage.direction,
        sender_type: newMessage.sender_type,
        saved_to_controlia: true,
        ai_processing: false,
        reason: 'IA não habilitada para esta conversa/contato',
        conversation_ai_enabled: conversationAIEnabled,
        contact_ai_enabled: contactAIEnabled
      })
    }
    
    console.log('✅ IA está habilitada - continuando para buscar automações...')
    
    // ✅ VERIFICAÇÃO ADICIONAL: Garantir que não estamos processando mensagem duplicada
    // Verificar novamente antes de enviar para n8n (pode haver race condition)
    if (newMessage && newMessage.id) {
      const { data: verifyNewMessage } = await serviceClient
        .from('messages')
        .select('id')
        .eq('id', newMessage.id)
        .single()
      
      if (!verifyNewMessage) {
        console.error('❌ Mensagem não encontrada após criar - possível race condition')
        return NextResponse.json(
          { error: 'Erro: mensagem não encontrada após criação' },
          { status: 500 }
        )
      }
    }

    // ✅ PASSO 3: Buscar automações ativas para processar mensagens
    // IMPORTANTE: Só chegamos aqui se a IA estiver habilitada
    console.log('📋 PASSO 3: Buscando automações para company_id:', contact.company_id)
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
    
    // ✅ VALIDAÇÃO CRÍTICA: Logar ERRO CRÍTICO se não encontrar automações
    if (!automations || automations.length === 0) {
      console.error('❌ CRÍTICO: Nenhuma automação encontrada!')
      console.error('   - company_id:', contact.company_id)
      console.error('   - trigger_event: new_message')
      console.error('   - is_active: true')
      console.error('   - is_paused: false')
      console.error('❌ Isso significa que a mensagem NÃO será enviada para o n8n')
      console.error('✅ MAS a mensagem JÁ FOI SALVA no Controlia e está disponível na interface!')
      
      // Tentar buscar TODAS as automações da empresa para debug
      const { data: allAutomations } = await supabase
        .from('automations')
        .select('*')
        .eq('company_id', contact.company_id)
      
      if (allAutomations && allAutomations.length > 0) {
        console.error('📋 Automações encontradas na empresa (mas não atendem aos critérios):')
        allAutomations.forEach(a => {
          console.error(`   - ${a.name}: trigger_event="${a.trigger_event}", is_active=${a.is_active}, is_paused=${a.is_paused}, url=${a.n8n_webhook_url ? '✅' : '❌'}`)
        })
      } else {
        console.error('📋 Nenhuma automação encontrada para esta empresa')
      }
      
      // NÃO falhar o webhook, mas logar o erro crítico
    }

    // ✅ IMPORTANTE: Processar apenas UMA automação por mensagem
    // Isso evita que a mesma mensagem seja enviada múltiplas vezes para o n8n
    if (automations && automations.length > 0) {
      console.log(`🔍 Encontradas ${automations.length} automação(ões) ativa(s)`)
      
      // ✅ VALIDAÇÃO: Logar todas as automações encontradas para debug
      automations.forEach((a, index) => {
        console.log(`   ${index + 1}. ${a.name} (ID: ${a.id}, URL: ${a.n8n_webhook_url ? '✅ configurada' : '❌ não configurada'})`)
      })
      
      // ✅ IMPORTANTE: Processar apenas UMA automação para evitar duplicações
      // Priorizar automação na seguinte ordem:
      // 1. "Atendimento com IA - Mensagens Recebidas" (nome exato ou similar)
      // 2. Qualquer automação com "Atendimento com IA" no nome
      // 3. Automação que tem secret na URL
      // 4. Primeira automação disponível
      let automation = automations.find(a => 
        a.name?.toLowerCase().includes('mensagens recebidas') ||
        (a.name?.toLowerCase().includes('atendimento') && a.name?.toLowerCase().includes('ia'))
      ) || automations.find(a => 
        a.name?.toLowerCase().includes('ia') || 
        a.name?.toLowerCase().includes('atendimento')
      ) || automations.find(a => 
        a.n8n_webhook_url && a.n8n_webhook_url.includes('secret=')
      ) || automations[0] // Fallback para primeira se não encontrar
      
      // ✅ VALIDAÇÃO: Se há múltiplas automações, logar aviso
      if (automations.length > 1) {
        console.warn('⚠️ AVISO: Múltiplas automações encontradas!')
        console.warn(`⚠️ Processando apenas a primeira/priorizada: ${automation.name} (ID: ${automation.id})`)
        console.warn('⚠️ As outras automações serão IGNORADAS para evitar duplicações')
        console.warn('⚠️ Se você precisa processar em múltiplas automações, configure isso no n8n ou use um workflow único')
      }
      
      console.log('🎯 Automação selecionada:', {
        id: automation.id,
        name: automation.name,
        url: automation.n8n_webhook_url?.substring(0, 80) + '...',
        has_url: !!automation.n8n_webhook_url
      })
      
      if (!automation.n8n_webhook_url) {
        console.error('❌ CRÍTICO: Automação sem n8n_webhook_url!')
        console.error('   - automation_id:', automation.id)
        console.error('   - automation_name:', automation.name)
        console.error('❌ A automação não será executada sem URL configurada')
        
        // Registrar erro mas não falhar
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
            status: 'error',
            error_message: 'Automação sem n8n_webhook_url configurado',
            started_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error('❌ Erro ao registrar log de automação:', logError)
        }
      } else {
        // ✅ PASSO 4: Enviar para n8n
        // IMPORTANTE: Mensagem JÁ FOI SALVA no Controlia (PASSO 1)
        // A mensagem JÁ ESTÁ disponível na interface do Controlia
        // IMPORTANTE: Só chegamos aqui se a IA estiver habilitada (verificado no PASSO 2)
        console.log('📤 PASSO 4: PREPARANDO envio para n8n')
        console.log('✅ LEMBRETE: Mensagem JÁ FOI SALVA no Controlia (ID:', newMessage.id, ')')
        console.log('✅ A mensagem JÁ ESTÁ disponível na interface do Controlia')
        console.log('📤 Agora vamos enviar para n8n para processamento adicional')
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
          // IMPORTANTE: Remover espaços em branco do secret ao ler das settings
          const n8nWebhookSecretRaw = settings.n8n_webhook_secret as string | undefined
          const n8nWebhookSecret = n8nWebhookSecretRaw?.trim() || undefined
          
          if (n8nWebhookSecretRaw && n8nWebhookSecretRaw !== n8nWebhookSecret) {
            console.warn('⚠️ Secret das settings tinha espaços em branco e foi removido')
            console.warn('   - Original:', JSON.stringify(n8nWebhookSecretRaw))
            console.warn('   - Limpo:', JSON.stringify(n8nWebhookSecret))
          }

          // Preparar URL do webhook
          let webhookUrl = automation.n8n_webhook_url
          console.log('🔗 URL do webhook (original):', webhookUrl)
          
          // O n8n pode esperar o secret de três formas:
          // 1. Como query parameter na URL (?secret=xxx) - quando Authentication é "None"
          // 2. Como header HTTP (X-Webhook-Secret) - quando Authentication é "Header Auth"
          // 3. Sem autenticação (None) - não recomendado
          
          // IMPORTANTE: O n8n pode estar configurado para aceitar secret como:
          // 1. Query parameter (?secret=xxx) - Authentication: None
          // 2. Header HTTP (X-Webhook-Secret) - Authentication: Header Auth (MOSTRADO NAS IMAGENS)
          // 3. Ambos (alguns n8n podem precisar dos dois)
          
          // Prioridade: usar secret das settings se disponível, senão extrair da URL
          let secretToUse: string | null = null
          let hasSecretInUrl = false
          
          // Primeiro, tentar usar secret das settings da empresa
          if (n8nWebhookSecret) {
            secretToUse = n8nWebhookSecret
            console.log('🔐 Usando secret das settings da empresa')
          }
          
          // Verificar se o secret está na URL (pode estar codificado ou não)
          try {
            const urlObj = new URL(webhookUrl)
            hasSecretInUrl = urlObj.searchParams.has('secret')
            
            if (hasSecretInUrl) {
              const secretFromUrl = urlObj.searchParams.get('secret')
              
              if (secretFromUrl) {
                // Decodificar o secret (converte %40 para @, etc)
                const decodedSecret = decodeURIComponent(secretFromUrl)
                
                // Se não temos secret das settings, usar o da URL
                if (!secretToUse) {
                  // IMPORTANTE: Remover espaços em branco e caracteres invisíveis
                  secretToUse = decodedSecret.trim()
                  console.log('🔐 Extraindo secret da URL (decodificado):', decodedSecret.substring(0, 5) + '...')
                  console.log('🔐 Secret após trim:', JSON.stringify(secretToUse))
                } else {
                  // Se temos secret das settings, garantir que URL está codificada corretamente
                  console.log('🔐 Secret também presente na URL (será usado apenas como query param)')
                }
                
                // IMPORTANTE: Garantir que o @ está codificado como %40 na URL
                if (decodedSecret.includes('@') && !webhookUrl.includes('%40')) {
                  console.warn('⚠️ Secret contém @ mas não está codificado na URL!')
                  console.warn('⚠️ Recodificando URL com secret codificado...')
                  urlObj.searchParams.set('secret', decodedSecret) // Isso vai codificar automaticamente
                  webhookUrl = urlObj.toString()
                  console.log('✅ URL recodificada:', webhookUrl)
                }
              }
            }
          } catch (urlError) {
            console.warn('⚠️ Erro ao processar URL do webhook:', urlError)
            hasSecretInUrl = webhookUrl.includes('secret=')
          }
          
          // IMPORTANTE: Sempre enviar secret como header HTTP se disponível
          // Mesmo que o secret esteja na URL, muitos n8n também precisam como header
          if (secretToUse) {
            // IMPORTANTE: Garantir que não há espaços ou caracteres invisíveis
            const cleanSecret = secretToUse.trim()
            headers['X-Webhook-Secret'] = cleanSecret
            console.log('🔐 Secret enviado como header HTTP: X-Webhook-Secret')
            console.log('🔐 Valor do secret (original):', JSON.stringify(secretToUse))
            console.log('🔐 Valor do secret (limpo):', JSON.stringify(cleanSecret))
            console.log('🔐 Tamanho do secret:', cleanSecret.length, 'caracteres')
          }
          
          if (hasSecretInUrl) {
            // Secret também está na URL (query parameter)
            console.log('🔐 Secret também presente na URL como query parameter')
            console.log('🔐 URL final:', webhookUrl)
          }
          
          if (!secretToUse) {
            // Nenhum secret configurado
            console.warn('⚠️ Nenhum secret configurado!')
            console.warn('⚠️ O n8n pode rejeitar a requisição com erro 403.')
            console.error('💡 Configure n8n_webhook_secret nas settings da empresa')
            console.error('💡 Ou adicione ?secret=xxx na URL do webhook do n8n')
          }

          // Buscar dados completos do contato incluindo campos customizados
          const { data: fullContact } = await serviceClient
            .from('contacts')
            .select('*')
            .eq('id', contact.id)
            .single()

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
            // Dados adicionais do Controlia - INCLUINDO TODOS OS DADOS DO CONTATO
            controlia: {
              company_id: contact.company_id,
              contact_id: contact.id,
              conversation_id: conversation?.id,
              message_id: newMessage?.id,
              channel: 'telegram',
              callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://controliaa.vercel.app'}/api/webhooks/n8n/channel-response`,
              // Incluir TODOS os dados do contato
              contact: fullContact ? {
                id: fullContact.id,
                name: fullContact.name,
                email: fullContact.email,
                phone: fullContact.phone,
                whatsapp: fullContact.whatsapp,
                document: fullContact.document,
                status: fullContact.status,
                source: fullContact.source,
                score: fullContact.score,
                notes: fullContact.notes,
                tags: fullContact.tags,
                ai_enabled: fullContact.ai_enabled,
                // INCLUIR TODOS OS CAMPOS CUSTOMIZADOS
                custom_fields: fullContact.custom_fields || {},
                created_at: fullContact.created_at,
                updated_at: fullContact.updated_at,
                last_interaction_at: fullContact.last_interaction_at,
              } : null,
            },
          }

          // ✅ VERIFICAÇÃO FINAL: Garantir que a mensagem ainda existe antes de enviar para n8n
          // Isso previne enviar mensagem duplicada se houve algum problema
          if (newMessage && newMessage.id) {
            const { data: finalCheck } = await serviceClient
              .from('messages')
              .select('id, direction, sender_type')
              .eq('id', newMessage.id)
              .eq('direction', 'inbound')
              .eq('sender_type', 'human')
              .single()
            
            if (!finalCheck) {
              console.error('❌ Mensagem não encontrada na verificação final - não enviando para n8n')
              return NextResponse.json({
                success: true,
                message_id: newMessage.id,
                conversation_id: conversation.id,
                saved_to_controlia: true,
                ai_processing: false,
                reason: 'Mensagem não encontrada na verificação final'
              })
            }
          }

          console.log('📤 ENVIANDO para n8n:')
          console.log('   URL:', webhookUrl)
          console.log('   Headers:', JSON.stringify(headers, null, 2))
          console.log('   Payload (resumo):', {
            update_id: n8nPayload.update_id,
            message_id: n8nPayload.message?.message_id,
            message_text: n8nPayload.message?.text?.substring(0, 50),
            controlia_company_id: n8nPayload.controlia?.company_id,
            controlia_contact_id: n8nPayload.controlia?.contact_id,
            controlia_conversation_id: n8nPayload.controlia?.conversation_id,
            controlia_message_id: n8nPayload.controlia?.message_id,
            controlia_callback_url: n8nPayload.controlia?.callback_url
          })
          console.log('   ✅ VALIDAÇÃO: Mensagem existe e está pronta para envio')
          console.log('   ✅ VALIDAÇÃO: Enviando apenas UMA vez para UMA automação')

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
            let errorMessage = errorText
            
            // Verificar se é erro 404 (workflow não ativo)
            if (n8nResponse.status === 404) {
              try {
                const errorJson = JSON.parse(errorText)
                if (errorJson.message?.includes('not registered') || errorJson.message?.includes('workflow must be active')) {
                  errorMessage = '❌ WORKFLOW DO N8N NÃO ESTÁ ATIVO! Ative o workflow no n8n usando o toggle no canto superior direito do editor.'
                  console.error('❌ CRÍTICO: Workflow do n8n não está ativo!')
                  console.error('   💡 Acesse o n8n e ative o workflow usando o toggle no canto superior direito')
                  console.error('   💡 O workflow deve estar ATIVO para receber webhooks em produção')
                }
              } catch {
                // Se não conseguir parsear, usar mensagem original
              }
            }
            
            console.error('❌ Erro ao enviar para n8n:')
            console.error('   Status HTTP:', n8nResponse.status)
            console.error('   Resposta:', errorMessage)
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
                error_message: `HTTP ${n8nResponse.status}: ${errorMessage.substring(0, 500)}`,
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
          console.error('❌ Erro ao enviar para n8n:', n8nError)
          // ✅ Registrar erro
          if (automation.id) {
            try {
              await supabase.from('automation_logs').insert({
                company_id: contact.company_id,
                automation_id: automation.id,
                trigger_event: 'new_message',
                trigger_data: {
                  message_id: newMessage?.id,
                  conversation_id: conversation?.id,
                  channel: 'telegram',
                  webhook_url: automation.n8n_webhook_url,
                },
                status: 'error',
                error_message: String(n8nError),
                started_at: new Date().toISOString(),
              })
            } catch (logError) {
              console.error('❌ Erro ao registrar log de automação:', logError)
            }
          }
          // ✅ Não falhar webhook, mas logar o erro
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
    console.log('✅ IMPORTANTE: Mensagem JÁ FOI SALVA no Controlia e está disponível na interface')
    console.log('✅ IMPORTANTE: Se a mensagem não aparecer na interface, verifique RLS ou queries')
    
    // ✅ VALIDAÇÃO FINAL: Garantir que mensagem pode ser consultada antes de retornar
    try {
      const { data: finalCheck, error: finalCheckError } = await serviceClient
        .from('messages')
        .select('id, direction, sender_type, company_id')
        .eq('id', newMessage.id)
        .eq('direction', 'inbound')
        .eq('sender_type', 'human')
        .single()
      
      if (finalCheckError || !finalCheck) {
        console.error('❌ ERRO CRÍTICO: Mensagem não pode ser consultada após salvar!')
        console.error('   - Isso pode indicar problema de RLS ou dados inconsistentes')
        console.error('   - Erro:', finalCheckError?.message)
        console.error('   - Código:', finalCheckError?.code)
      } else {
        console.log('✅ VALIDAÇÃO FINAL: Mensagem confirmada e pode ser consultada')
        console.log('   - ID:', finalCheck.id)
        console.log('   - Direction:', finalCheck.direction)
        console.log('   - Sender Type:', finalCheck.sender_type)
        console.log('   - Company ID:', finalCheck.company_id)
      }
    } catch (finalErr) {
      console.error('❌ Erro na validação final:', finalErr)
    }
    
    return NextResponse.json({
      success: true,
      message_id: newMessage.id,
      conversation_id: conversation.id,
      direction: newMessage.direction,
      sender_type: newMessage.sender_type,
      saved_to_controlia: true, // ✅ Confirmar que foi salvo no Controlia
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

