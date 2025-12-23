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
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const rawData = {
      conversation_id: formData.get('conversation_id') as string,
      contact_id: formData.get('contact_id') as string,
      content: formData.get('content') as string,
      content_type: formData.get('content_type') as string || 'text',
      media_url: formData.get('media_url') as string || '',
      sender_type: formData.get('sender_type') as string || 'human',
      sender_id: formData.get('sender_id') as string || user.id,
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
      sender_id: rawData.sender_type === 'human' ? rawData.sender_id : null,
      ai_agent_id: rawData.sender_type === 'ai' ? rawData.ai_agent_id : null,
      channel_message_id: rawData.channel_message_id || null,
      channel_timestamp: rawData.channel_timestamp || null,
      ai_context: rawData.ai_context || null,
      ai_prompt_version_id: rawData.ai_prompt_version_id || null,
    })

    const supabase = await createClient()

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        company_id: company.id,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar mensagem:', error)
      return { error: 'Erro ao criar mensagem' }
    }

    // Registrar auditoria
    if (validatedData.sender_type === 'ai') {
      await logAIAction(
        company.id,
        'create_message',
        'message',
        message.id,
        { message: message }
      )
    } else {
      await logHumanAction(
        company.id,
        user.id,
        'create_message',
        'message',
        message.id,
        { created: message }
      )
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

