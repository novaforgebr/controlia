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
    const { company_id, contact_id, conversation_id, message_id, channel, channel_id } = controliaData

    if (!output || !company_id || !conversation_id) {
      return NextResponse.json(
        { error: 'Dados incompletos: output, company_id e conversation_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar configurações do canal da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', company_id)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const settings = (company.settings as Record<string, unknown>) || {}

    // Buscar informações da conversa para obter channel_id se não foi enviado
    const { data: conversation } = await supabase
      .from('conversations')
      .select('channel_thread_id, contact_id, channel')
      .eq('id', conversation_id)
      .eq('company_id', company_id)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
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

      const telegramChatId = channel_id || conversation.channel_thread_id

      if (!telegramChatId) {
        return NextResponse.json(
          { error: 'Chat ID do Telegram não encontrado' },
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
    messageFormData.append('contact_id', conversation.contact_id || contact_id || '')
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
