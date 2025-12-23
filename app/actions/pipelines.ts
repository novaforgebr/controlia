'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { revalidatePath } from 'next/cache'

/**
 * Listar pipelines da empresa
 */
export async function listPipelines() {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pipelines')
      .select('*, pipeline_stages(*)')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao listar pipelines:', error)
      return { error: 'Erro ao listar pipelines', data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao listar pipelines', data: [] }
  }
}

/**
 * Obter um pipeline específico
 */
export async function getPipeline(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pipelines')
      .select('*, pipeline_stages(*)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (error) {
      console.error('Erro ao buscar pipeline:', error)
      return { error: 'Pipeline não encontrado', data: null }
    }

    return { data }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao buscar pipeline', data: null }
  }
}

/**
 * Criar pipeline
 */
export async function createPipeline(formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const is_default = formData.get('is_default') === 'true'

    if (!name) {
      return { error: 'Nome do pipeline é obrigatório' }
    }

    // Se for padrão, desmarcar outros como padrão
    if (is_default) {
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('company_id', company.id)
    }

    const { data: pipeline, error } = await supabase
      .from('pipelines')
      .insert({
        company_id: company.id,
        name,
        description: description || null,
        is_default,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar pipeline:', error)
      return { error: 'Erro ao criar pipeline' }
    }

    revalidatePath('/crm')
    return { success: true, data: pipeline }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao criar pipeline' }
  }
}

/**
 * Atualizar pipeline
 */
export async function updatePipeline(id: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const is_default = formData.get('is_default') === 'true'

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== null) updateData.description = description || null
    if (formData.has('is_default')) {
      updateData.is_default = is_default
      // Se for padrão, desmarcar outros
      if (is_default) {
        await supabase
          .from('pipelines')
          .update({ is_default: false })
          .eq('company_id', company.id)
          .neq('id', id)
      }
    }

    const { error } = await supabase
      .from('pipelines')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao atualizar pipeline:', error)
      return { error: 'Erro ao atualizar pipeline' }
    }

    revalidatePath('/crm')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao atualizar pipeline' }
  }
}

/**
 * Deletar pipeline
 */
export async function deletePipeline(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar pipeline:', error)
      return { error: 'Erro ao deletar pipeline' }
    }

    revalidatePath('/crm')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao deletar pipeline' }
  }
}

/**
 * Criar stage do pipeline
 */
export async function createPipelineStage(pipelineId: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const color = formData.get('color') as string || '#039155'
    const is_closed = formData.get('is_closed') === 'true'
    const is_lost = formData.get('is_lost') === 'true'
    const display_order = parseInt(formData.get('display_order') as string) || 0

    if (!name) {
      return { error: 'Nome do estágio é obrigatório' }
    }

    const supabase = await createClient()

    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .insert({
        pipeline_id: pipelineId,
        company_id: company.id,
        name,
        description: description || null,
        color,
        is_closed,
        is_lost,
        display_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar estágio:', error)
      return { error: 'Erro ao criar estágio' }
    }

    revalidatePath('/crm')
    return { success: true, data: stage }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao criar estágio' }
  }
}

/**
 * Atualizar stage do pipeline
 */
export async function updatePipelineStage(id: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const updateData: any = {}
    if (formData.has('name')) updateData.name = formData.get('name') as string
    if (formData.has('description')) updateData.description = formData.get('description') as string || null
    if (formData.has('color')) updateData.color = formData.get('color') as string
    if (formData.has('is_closed')) updateData.is_closed = formData.get('is_closed') === 'true'
    if (formData.has('is_lost')) updateData.is_lost = formData.get('is_lost') === 'true'
    if (formData.has('display_order')) updateData.display_order = parseInt(formData.get('display_order') as string)

    const { error } = await supabase
      .from('pipeline_stages')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao atualizar estágio:', error)
      return { error: 'Erro ao atualizar estágio' }
    }

    revalidatePath('/crm')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao atualizar estágio' }
  }
}

/**
 * Deletar stage do pipeline
 */
export async function deletePipelineStage(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar estágio:', error)
      return { error: 'Erro ao deletar estágio' }
    }

    revalidatePath('/crm')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao deletar estágio' }
  }
}

