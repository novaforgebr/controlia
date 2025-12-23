'use server'

/**
 * Server Actions para o módulo de Automações
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { logHumanAction } from '@/lib/utils/audit'
import type { Automation, AutomationLog } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

/**
 * Criar nova automação
 */
export async function createAutomation(formData: FormData) {
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
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      n8n_workflow_id: formData.get('n8n_workflow_id') as string || '',
      n8n_webhook_url: formData.get('n8n_webhook_url') as string || '',
      trigger_event: formData.get('trigger_event') as string,
      trigger_conditions: formData.get('trigger_conditions') ? JSON.parse(formData.get('trigger_conditions') as string) : {},
      is_active: formData.get('is_active') === 'true',
    }

    const supabase = await createClient()

    const { data: automation, error } = await supabase
      .from('automations')
      .insert({
        company_id: company.id,
        created_by: user.id,
        ...rawData,
        n8n_workflow_id: rawData.n8n_workflow_id || null,
        n8n_webhook_url: rawData.n8n_webhook_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar automação:', error)
      return { error: 'Erro ao criar automação' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'create_automation',
      'automation',
      automation.id,
      { created: automation }
    )

    revalidatePath('/automations')
    return { success: true, data: automation }
  } catch (error) {
    console.error('Erro ao criar automação:', error)
    return { error: 'Erro ao criar automação' }
  }
}

/**
 * Listar automações
 */
export async function listAutomations() {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao listar automações:', error)
      return { error: 'Erro ao listar automações', data: [] }
    }

    return { data: data as Automation[] }
  } catch (error) {
    console.error('Erro ao listar automações:', error)
    return { error: 'Erro ao listar automações', data: [] }
  }
}

/**
 * Atualizar configuração n8n de uma automação
 */
export async function updateAutomationN8nConfig(automationId: string, formData: FormData) {
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

    // Verificar se automação pertence à empresa
    const { data: automation } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .eq('company_id', company.id)
      .single()

    if (!automation) {
      return { error: 'Automação não encontrada' }
    }

    const updates: Record<string, unknown> = {}
    const workflowId = formData.get('n8n_workflow_id')
    const webhookUrl = formData.get('n8n_webhook_url')

    if (workflowId !== null) {
      updates.n8n_workflow_id = workflowId || null
    }
    if (webhookUrl !== null) {
      updates.n8n_webhook_url = webhookUrl || null
    }

    const { data: updated, error } = await supabase
      .from('automations')
      .update(updates)
      .eq('id', automationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar configuração n8n:', error)
      return { error: 'Erro ao atualizar configuração' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'update_automation_n8n',
      'automation',
      automationId,
      { updated }
    )

    revalidatePath('/settings')
    revalidatePath('/automations')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Erro ao atualizar configuração n8n:', error)
    return { error: 'Erro ao atualizar configuração' }
  }
}

/**
 * Ativar/desativar automação
 */
export async function toggleAutomation(automationId: string, isActive: boolean) {
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
      .from('automations')
      .update({ is_active: isActive })
      .eq('id', automationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao alterar status:', error)
      return { error: 'Erro ao alterar status da automação' }
    }

    await logHumanAction(
      company.id,
      user.id,
      isActive ? 'activate_automation' : 'deactivate_automation',
      'automation',
      automationId,
      { is_active: isActive }
    )

    revalidatePath('/automations')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    return { error: 'Erro ao alterar status da automação' }
  }
}

/**
 * Pausar/retomar automação
 */
export async function pauseAutomation(automationId: string, isPaused: boolean) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('automations')
      .update({ is_paused: isPaused })
      .eq('id', automationId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao pausar automação:', error)
      return { error: 'Erro ao pausar/retomar automação' }
    }

    revalidatePath('/automations')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao pausar automação:', error)
    return { error: 'Erro ao pausar/retomar automação' }
  }
}

/**
 * Listar logs de automação
 */
export async function listAutomationLogs(automationId?: string, limit = 50) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('automation_logs')
      .select('*, automations(name)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (automationId) {
      query = query.eq('automation_id', automationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar logs:', error)
      return { error: 'Erro ao listar logs', data: [] }
    }

    return { data: data as any[] }
  } catch (error) {
    console.error('Erro ao listar logs:', error)
    return { error: 'Erro ao listar logs', data: [] }
  }
}

