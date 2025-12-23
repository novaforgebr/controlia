/**
 * Utilitário para criar logs de auditoria
 * Registra todas as ações importantes do sistema (humanas e de IA)
 */

import { createClient } from '@/lib/supabase/server'
import type { ActorType } from '@/lib/types/database'

interface AuditLogParams {
  companyId: string
  userId?: string | null
  actorType: ActorType
  actorName?: string | null
  action: string
  entityType: string
  entityId?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('audit_logs').insert({
      company_id: params.companyId,
      user_id: params.userId,
      actor_type: params.actorType,
      actor_name: params.actorName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      changes: params.changes || null,
      metadata: params.metadata || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    })

    if (error) {
      console.error('Erro ao criar log de auditoria:', error)
      // Não lançar erro para não quebrar o fluxo principal
    }
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error)
  }
}

/**
 * Helper para criar log de ação humana
 */
export async function logHumanAction(
  companyId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: Record<string, unknown>
) {
  return createAuditLog({
    companyId,
    userId,
    actorType: 'human',
    action,
    entityType,
    entityId: entityId || null,
    changes: changes || null,
  })
}

/**
 * Helper para criar log de ação de IA
 */
export async function logAIAction(
  companyId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  return createAuditLog({
    companyId,
    userId: null,
    actorType: 'ai',
    actorName: 'AI Assistant',
    action,
    entityType,
    entityId: entityId || null,
    metadata: metadata || null,
  })
}

