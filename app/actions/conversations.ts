'use server'

/**
 * Server Actions para o módulo de Conversas
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { createConversationSchema, updateConversationSchema } from '@/lib/validations/conversation'
import { logHumanAction } from '@/lib/utils/audit'
import type { ConversationInsert, Conversation } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

/**
 * Criar nova conversa
 */
export async function createConversation(formData: FormData) {
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
      contact_id: formData.get('contact_id') as string,
      channel: formData.get('channel') as string || 'whatsapp',
      channel_thread_id: formData.get('channel_thread_id') as string || '',
      status: formData.get('status') as string || 'open',
      priority: formData.get('priority') as string || 'normal',
      subject: formData.get('subject') as string || '',
      assigned_to: formData.get('assigned_to') as string || '',
      ai_assistant_enabled: formData.get('ai_assistant_enabled') === 'true',
    }

    const validatedData = createConversationSchema.parse(rawData)

    const supabase = await createClient()

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        company_id: company.id,
        ...validatedData,
        assigned_to: validatedData.assigned_to || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conversa:', error)
      return { error: 'Erro ao criar conversa' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'create_conversation',
      'conversation',
      conversation.id,
      { created: conversation }
    )

    revalidatePath('/conversations')
    return { success: true, data: conversation }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao criar conversa:', error)
    return { error: 'Erro ao criar conversa' }
  }
}

/**
 * Atualizar conversa
 */
export async function updateConversation(conversationId: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    const { data: currentConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('company_id', company.id)
      .single()

    if (!currentConversation) {
      return { error: 'Conversa não encontrada' }
    }

    const rawData: Record<string, unknown> = {}
    const fields = ['status', 'priority', 'subject', 'assigned_to', 'ai_assistant_enabled']
    
    fields.forEach(field => {
      const value = formData.get(field)
      if (value !== null) {
        if (field === 'ai_assistant_enabled') {
          rawData[field] = value === 'true'
        } else if (field === 'assigned_to' && value === '') {
          rawData[field] = null
        } else {
          rawData[field] = value || ''
        }
      }
    })

    const validatedData = updateConversationSchema.parse(rawData)

    const { data: updatedConversation, error } = await supabase
      .from('conversations')
      .update(validatedData)
      .eq('id', conversationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conversa:', error)
      return { error: 'Erro ao atualizar conversa' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'update_conversation',
      'conversation',
      conversationId,
      { before: currentConversation, after: updatedConversation }
    )

    revalidatePath('/conversations')
    revalidatePath(`/conversations/${conversationId}`)
    return { success: true, data: updatedConversation }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao atualizar conversa:', error)
    return { error: 'Erro ao atualizar conversa' }
  }
}

/**
 * Fechar conversa
 */
export async function closeConversation(conversationId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao fechar conversa:', error)
      return { error: 'Erro ao fechar conversa' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'close_conversation',
      'conversation',
      conversationId,
      { closed: conversation }
    )

    revalidatePath('/conversations')
    revalidatePath(`/conversations/${conversationId}`)
    return { success: true, data: conversation }
  } catch (error) {
    console.error('Erro ao fechar conversa:', error)
    return { error: 'Erro ao fechar conversa' }
  }
}

/**
 * Buscar conversa por ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('company_id', company.id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Conversation
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    return null
  }
}

/**
 * Toggle IA Assistant na conversa
 */
export async function toggleConversationAI(conversationId: string, enabled: boolean) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    const { data: updatedConversation, error } = await supabase
      .from('conversations')
      .update({ ai_assistant_enabled: enabled })
      .eq('id', conversationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar IA da conversa:', error)
      return { error: 'Erro ao atualizar IA da conversa' }
    }

    await logHumanAction(
      company.id,
      user.id,
      enabled ? 'enable_ai_conversation' : 'disable_ai_conversation',
      'conversation',
      conversationId,
      { ai_assistant_enabled: enabled }
    )

    revalidatePath('/conversations')
    revalidatePath(`/conversations/${conversationId}`)
    return { success: true, data: updatedConversation }
  } catch (error) {
    console.error('Erro ao atualizar IA da conversa:', error)
    return { error: 'Erro ao atualizar IA da conversa' }
  }
}

/**
 * Listar conversas com filtros
 */
export async function listConversations(filters?: {
  status?: string
  contact_id?: string
  assigned_to?: string
  channel?: string
  limit?: number
  offset?: number
}) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('conversations')
      .select('*, contacts(name, email, phone)', { count: 'exact' })
      .eq('company_id', company.id)
      .order('last_message_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao listar conversas:', error)
      return { error: 'Erro ao listar conversas', data: [], count: 0 }
    }

    return { data: data as any[], count: count || 0 }
  } catch (error) {
    console.error('Erro ao listar conversas:', error)
    return { error: 'Erro ao listar conversas', data: [], count: 0 }
  }
}

