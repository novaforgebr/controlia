'use server'

/**
 * Server Actions para logs de IA
 * Registra e consulta todas as ações e decisões da IA
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { logAIAction } from '@/lib/utils/audit'
import type { AILog } from '@/lib/types/database'

/**
 * Criar log de ação da IA
 */
export async function createAILog(data: {
  conversation_id?: string
  contact_id?: string
  message_id?: string
  ai_agent_id?: string
  prompt_id?: string
  prompt_version?: number
  input_context: Record<string, unknown>
  user_message?: string
  ai_response: string
  ai_metadata?: Record<string, unknown>
  decisions?: Record<string, unknown>
  confidence_score?: number
  status?: string
  error_message?: string
}) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { data: log, error } = await supabase
      .from('ai_logs')
      .insert({
        company_id: company.id,
        conversation_id: data.conversation_id || null,
        contact_id: data.contact_id || null,
        message_id: data.message_id || null,
        ai_agent_id: data.ai_agent_id || null,
        prompt_id: data.prompt_id || null,
        prompt_version: data.prompt_version || null,
        input_context: data.input_context,
        user_message: data.user_message || null,
        ai_response: data.ai_response,
        ai_metadata: data.ai_metadata || null,
        decisions: data.decisions || null,
        confidence_score: data.confidence_score || null,
        status: data.status || 'success',
        error_message: data.error_message || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar log de IA:', error)
      return { error: 'Erro ao criar log de IA' }
    }

    // Registrar também na auditoria
    await logAIAction(
      company.id,
      'ai_response',
      'ai_log',
      log.id,
      { log: log }
    )

    return { success: true, data: log }
  } catch (error) {
    console.error('Erro ao criar log de IA:', error)
    return { error: 'Erro ao criar log de IA' }
  }
}

/**
 * Listar logs de IA com filtros
 */
export async function listAILogs(filters?: {
  conversation_id?: string
  contact_id?: string
  prompt_id?: string
  status?: string
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
      .from('ai_logs')
      .select('*, ai_prompts(name, version), conversations(id, subject), contacts(name)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (filters?.conversation_id) {
      query = query.eq('conversation_id', filters.conversation_id)
    }

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }

    if (filters?.prompt_id) {
      query = query.eq('prompt_id', filters.prompt_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar logs de IA:', error)
      return { error: 'Erro ao listar logs de IA', data: [] }
    }

    return { data: data as any[] }
  } catch (error) {
    console.error('Erro ao listar logs de IA:', error)
    return { error: 'Erro ao listar logs de IA', data: [] }
  }
}

/**
 * Buscar log por ID
 */
export async function getAILog(logId: string): Promise<AILog | null> {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_logs')
      .select('*')
      .eq('id', logId)
      .eq('company_id', company.id)
      .single()

    if (error || !data) {
      return null
    }

    return data as AILog
  } catch (error) {
    console.error('Erro ao buscar log:', error)
    return null
  }
}

/**
 * Marcar log como revisado
 */
export async function reviewAILog(logId: string) {
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

    const { data, error } = await supabase
      .from('ai_logs')
      .update({
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao revisar log:', error)
      return { error: 'Erro ao revisar log' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao revisar log:', error)
    return { error: 'Erro ao revisar log' }
  }
}

