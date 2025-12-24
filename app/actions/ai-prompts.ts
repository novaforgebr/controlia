'use server'

/**
 * Server Actions para o módulo de Prompts de IA
 * Gerencia prompts versionados e controle sobre IA
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { createAIPromptSchema, updateAIPromptSchema } from '@/lib/validations/ai-prompt'
import { logHumanAction } from '@/lib/utils/audit'
import type { AIPromptInsert, AIPrompt } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

/**
 * Criar novo prompt de IA
 */
export async function createAIPrompt(formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    // Parse JSON com tratamento de erro
    let allowedActions: string[] = []
    let forbiddenActions: string[] = []
    
    try {
      const allowedActionsStr = formData.get('allowed_actions') as string
      if (allowedActionsStr) {
        allowedActions = JSON.parse(allowedActionsStr)
      }
    } catch (e) {
      console.error('Erro ao fazer parse de allowed_actions:', e)
      return { error: 'Erro ao processar ações permitidas: formato JSON inválido' }
    }

    try {
      const forbiddenActionsStr = formData.get('forbidden_actions') as string
      if (forbiddenActionsStr) {
        forbiddenActions = JSON.parse(forbiddenActionsStr)
      }
    } catch (e) {
      console.error('Erro ao fazer parse de forbidden_actions:', e)
      return { error: 'Erro ao processar ações proibidas: formato JSON inválido' }
    }

    // Tratar parent_id: se for string vazia, converter para null
    const parentIdRaw = formData.get('parent_id') as string
    const parentId = parentIdRaw && parentIdRaw.trim() !== '' ? parentIdRaw : null

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      version: parseInt(formData.get('version') as string) || 1,
      parent_id: parentId,
      prompt_text: formData.get('prompt_text') as string,
      system_prompt: formData.get('system_prompt') as string || '',
      model: formData.get('model') as string || 'gpt-4',
      temperature: parseFloat(formData.get('temperature') as string) || 0.7,
      max_tokens: parseInt(formData.get('max_tokens') as string) || 1000,
      context_type: formData.get('context_type') as string || '',
      channel: formData.get('channel') as string || '',
      allowed_actions: allowedActions,
      forbidden_actions: forbiddenActions,
      constraints: formData.get('constraints') as string || '',
      is_active: formData.get('is_active') === 'true',
      is_default: formData.get('is_default') === 'true',
    }

    const validatedData = createAIPromptSchema.parse(rawData)

    const supabase = await createClient()

    // Se for default, desmarcar outros defaults do mesmo contexto
    if (validatedData.is_default) {
      await supabase
        .from('ai_prompts')
        .update({ is_default: false })
        .eq('company_id', company.id)
        .eq('context_type', validatedData.context_type || '')
        .eq('channel', validatedData.channel || '')
    }

    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .insert({
        company_id: company.id,
        created_by: user.id,
        ...validatedData,
        parent_id: validatedData.parent_id || null,
        context_type: validatedData.context_type || null,
        channel: validatedData.channel || null,
        system_prompt: validatedData.system_prompt || null,
        constraints: validatedData.constraints || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar prompt:', error)
      return { error: error.message || 'Erro ao criar prompt de IA' }
    }

    if (!prompt) {
      console.error('Prompt criado mas não retornado')
      return { error: 'Erro ao criar prompt: dados não retornados' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'create_ai_prompt',
      'ai_prompt',
      prompt.id,
      { created: prompt }
    )

    revalidatePath('/ai/prompts')
    return { success: true, data: prompt }
  } catch (error) {
    if (error instanceof ZodError) {
      // Erro de validação Zod
      const messages = error.issues.map((issue) => {
        const field = issue.path.join('.')
        return `${field}: ${issue.message}`
      })
      return { error: `Dados inválidos: ${messages.join(', ')}` }
    }
    console.error('Erro ao criar prompt:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return { error: `Erro ao criar prompt de IA: ${errorMessage}` }
  }
}

/**
 * Criar nova versão de um prompt (versionamento)
 */
export async function createPromptVersion(promptId: string, formData: FormData) {
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

    // Buscar prompt original
    const { data: originalPrompt } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('company_id', company.id)
      .single()

    if (!originalPrompt) {
      return { error: 'Prompt não encontrado' }
    }

    // Buscar última versão
    const { data: lastVersion } = await supabase
      .from('ai_prompts')
      .select('version')
      .eq('parent_id', promptId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersion = lastVersion ? lastVersion.version + 1 : originalPrompt.version + 1

    const rawData = {
      name: formData.get('name') as string || originalPrompt.name,
      description: formData.get('description') as string || originalPrompt.description,
      version: newVersion,
      parent_id: promptId,
      prompt_text: formData.get('prompt_text') as string || originalPrompt.prompt_text,
      system_prompt: formData.get('system_prompt') as string || originalPrompt.system_prompt || '',
      model: formData.get('model') as string || originalPrompt.model,
      temperature: parseFloat(formData.get('temperature') as string) || originalPrompt.temperature,
      max_tokens: parseInt(formData.get('max_tokens') as string) || originalPrompt.max_tokens,
      context_type: formData.get('context_type') as string || originalPrompt.context_type || '',
      channel: formData.get('channel') as string || originalPrompt.channel || '',
      allowed_actions: formData.get('allowed_actions') ? JSON.parse(formData.get('allowed_actions') as string) : originalPrompt.allowed_actions,
      forbidden_actions: formData.get('forbidden_actions') ? JSON.parse(formData.get('forbidden_actions') as string) : originalPrompt.forbidden_actions,
      constraints: formData.get('constraints') as string || originalPrompt.constraints || '',
      is_active: formData.get('is_active') === 'true' ? true : originalPrompt.is_active,
      is_default: formData.get('is_default') === 'true',
    }

    const validatedData = createAIPromptSchema.parse(rawData)

    // Se for default, desmarcar outros
    if (validatedData.is_default) {
      await supabase
        .from('ai_prompts')
        .update({ is_default: false })
        .eq('company_id', company.id)
        .eq('context_type', validatedData.context_type || '')
        .eq('channel', validatedData.channel || '')
    }

    const { data: newPrompt, error } = await supabase
      .from('ai_prompts')
      .insert({
        company_id: company.id,
        created_by: user.id,
        ...validatedData,
        parent_id: promptId,
        context_type: validatedData.context_type || null,
        channel: validatedData.channel || null,
        system_prompt: validatedData.system_prompt || null,
        constraints: validatedData.constraints || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar versão:', error)
      return { error: 'Erro ao criar versão do prompt' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'create_ai_prompt_version',
      'ai_prompt',
      newPrompt.id,
      { version: newVersion, parent_id: promptId }
    )

    revalidatePath('/ai/prompts')
    revalidatePath(`/ai/prompts/${promptId}`)
    return { success: true, data: newPrompt }
  } catch (error) {
    console.error('Erro ao criar versão:', error)
    return { error: 'Erro ao criar versão do prompt' }
  }
}

/**
 * Atualizar prompt
 */
export async function updateAIPrompt(promptId: string, formData: FormData) {
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

    const { data: currentPrompt } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('company_id', company.id)
      .single()

    if (!currentPrompt) {
      return { error: 'Prompt não encontrado' }
    }

    const rawData: Record<string, unknown> = {}
    const fields = ['name', 'description', 'prompt_text', 'system_prompt', 'model', 'temperature', 'max_tokens', 'context_type', 'channel', 'constraints', 'is_active', 'is_default']
    
    fields.forEach(field => {
      const value = formData.get(field)
      if (value !== null) {
        if (field === 'temperature') {
          rawData[field] = parseFloat(value as string)
        } else if (field === 'max_tokens') {
          rawData[field] = parseInt(value as string)
        } else if (field === 'is_active' || field === 'is_default') {
          rawData[field] = value === 'true'
        } else {
          rawData[field] = value || ''
        }
      }
    })

    // Arrays JSON
    if (formData.get('allowed_actions')) {
      rawData.allowed_actions = JSON.parse(formData.get('allowed_actions') as string)
    }
    if (formData.get('forbidden_actions')) {
      rawData.forbidden_actions = JSON.parse(formData.get('forbidden_actions') as string)
    }

    const validatedData = updateAIPromptSchema.parse(rawData)

    // Se for default, desmarcar outros
    if (validatedData.is_default) {
      await supabase
        .from('ai_prompts')
        .update({ is_default: false })
        .eq('company_id', company.id)
        .eq('context_type', validatedData.context_type || currentPrompt.context_type || '')
        .eq('channel', validatedData.channel || currentPrompt.channel || '')
        .neq('id', promptId)
    }

    const { data: updatedPrompt, error } = await supabase
      .from('ai_prompts')
      .update(validatedData)
      .eq('id', promptId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar prompt:', error)
      return { error: 'Erro ao atualizar prompt' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'update_ai_prompt',
      'ai_prompt',
      promptId,
      { before: currentPrompt, after: updatedPrompt }
    )

    revalidatePath('/ai/prompts')
    revalidatePath(`/ai/prompts/${promptId}`)
    return { success: true, data: updatedPrompt }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao atualizar prompt:', error)
    return { error: 'Erro ao atualizar prompt' }
  }
}

/**
 * Buscar prompt por ID
 */
export async function getAIPrompt(promptId: string): Promise<AIPrompt | null> {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('company_id', company.id)
      .single()

    if (error || !data) {
      return null
    }

    return data as AIPrompt
  } catch (error) {
    console.error('Erro ao buscar prompt:', error)
    return null
  }
}

/**
 * Listar prompts com filtros
 */
export async function listAIPrompts(filters?: {
  context_type?: string
  channel?: string
  is_active?: boolean
  is_default?: boolean
}) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('ai_prompts')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (filters?.context_type) {
      query = query.eq('context_type', filters.context_type)
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.is_default !== undefined) {
      query = query.eq('is_default', filters.is_default)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar prompts:', error)
      return { error: 'Erro ao listar prompts', data: [] }
    }

    return { data: data as AIPrompt[] }
  } catch (error) {
    console.error('Erro ao listar prompts:', error)
    return { error: 'Erro ao listar prompts', data: [] }
  }
}

/**
 * Buscar versões de um prompt
 */
export async function getPromptVersions(promptId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    // Buscar prompt original e todas as versões
    const { data: allPrompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('company_id', company.id)
      .or(`id.eq.${promptId},parent_id.eq.${promptId}`)
      .order('version', { ascending: false })

    if (error) {
      console.error('Erro ao buscar versões:', error)
      return { error: 'Erro ao buscar versões', data: [] }
    }

    return { data: allPrompts as AIPrompt[] }
  } catch (error) {
    console.error('Erro ao buscar versões:', error)
    return { error: 'Erro ao buscar versões', data: [] }
  }
}

/**
 * Ativar/desativar prompt
 */
export async function togglePromptStatus(promptId: string, isActive: boolean) {
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
      .from('ai_prompts')
      .update({ is_active: isActive })
      .eq('id', promptId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao alterar status:', error)
      return { error: 'Erro ao alterar status do prompt' }
    }

    await logHumanAction(
      company.id,
      user.id,
      isActive ? 'activate_ai_prompt' : 'deactivate_ai_prompt',
      'ai_prompt',
      promptId,
      { is_active: isActive }
    )

    revalidatePath('/ai/prompts')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    return { error: 'Erro ao alterar status do prompt' }
  }
}

/**
 * Excluir prompt
 */
export async function deleteAIPrompt(promptId: string) {
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

    // Verificar se o prompt existe e pertence à empresa
    const { data: prompt } = await supabase
      .from('ai_prompts')
      .select('id, name')
      .eq('id', promptId)
      .eq('company_id', company.id)
      .single()

    if (!prompt) {
      return { error: 'Prompt não encontrado' }
    }

    // Excluir o prompt (cascade vai excluir versões relacionadas se houver)
    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao excluir prompt:', error)
      return { error: 'Erro ao excluir prompt' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'delete_ai_prompt',
      'ai_prompt',
      promptId,
      { deleted: prompt }
    )

    revalidatePath('/ai/prompts')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir prompt:', error)
    return { error: 'Erro ao excluir prompt' }
  }
}

