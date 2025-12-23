import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMessage } from '@/app/actions/messages'
import { createAILog } from '@/app/actions/ai-logs'

/**
 * Webhook para receber respostas do n8n
 * Este endpoint recebe as respostas dos agentes de IA processados no n8n
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar estrutura básica
    if (!body.company_id || !body.conversation_id || !body.ai_response) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se a empresa existe e o webhook é válido
    // (em produção, adicionar validação de assinatura/secret)

    // Buscar informações da conversa
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, contacts(id, name, ai_enabled)')
      .eq('id', body.conversation_id)
      .eq('company_id', body.company_id)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se IA está habilitada para este contato
    if (!conversation.contacts?.ai_enabled || !conversation.ai_assistant_enabled) {
      return NextResponse.json(
        { error: 'IA não habilitada para este contato/conversa' },
        { status: 403 }
      )
    }

    // Criar mensagem da IA
    const messageFormData = new FormData()
    messageFormData.append('conversation_id', body.conversation_id)
    messageFormData.append('contact_id', conversation.contact_id)
    messageFormData.append('content', body.ai_response)
    messageFormData.append('sender_type', 'ai')
    messageFormData.append('ai_agent_id', body.ai_agent_id || 'n8n')
    messageFormData.append('direction', 'outbound')
    messageFormData.append('status', 'sent')
    if (body.ai_context) {
      messageFormData.append('ai_context', JSON.stringify(body.ai_context))
    }
    if (body.prompt_id) {
      messageFormData.append('ai_prompt_version_id', body.prompt_id)
    }

    const messageResult = await createMessage(messageFormData)

    if (messageResult.error) {
      console.error('Erro ao criar mensagem:', messageResult.error)
      return NextResponse.json(
        { error: 'Erro ao criar mensagem' },
        { status: 500 }
      )
    }

    // Criar log de IA
    await createAILog({
      conversation_id: body.conversation_id,
      contact_id: conversation.contact_id,
      message_id: messageResult.data?.id,
      ai_agent_id: body.ai_agent_id || 'n8n',
      prompt_id: body.prompt_id,
      prompt_version: body.prompt_version,
      input_context: body.input_context || {},
      user_message: body.user_message,
      ai_response: body.ai_response,
      ai_metadata: body.metadata || {},
      decisions: body.decisions || {},
      confidence_score: body.confidence_score,
      status: body.status || 'success',
      error_message: body.error_message,
    })

    return NextResponse.json({
      success: true,
      message_id: messageResult.data?.id,
    })
  } catch (error) {
    console.error('Erro no webhook n8n:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

/**
 * Webhook para enviar eventos para o n8n
 * Este endpoint é chamado quando eventos acontecem no CRM
 */
export async function GET(request: NextRequest) {
  // Este endpoint pode ser usado para health check ou configuração
  return NextResponse.json({
    status: 'ok',
    service: 'n8n webhook handler',
  })
}

