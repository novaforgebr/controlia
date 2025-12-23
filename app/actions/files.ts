'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { revalidatePath } from 'next/cache'

/**
 * Listar arquivos da base de conhecimento
 */
export async function listKnowledgeBaseFiles(filters?: {
  search?: string
  category?: string
  tags?: string[]
}) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('files')
      .select('*, user_profiles:uploaded_by(full_name)')
      .eq('company_id', company.id)
      .eq('is_knowledge_base', true)

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar arquivos:', error)
      return { error: 'Erro ao listar arquivos', data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao listar arquivos', data: [] }
  }
}

/**
 * Obter um arquivo específico
 */
export async function getFile(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('files')
      .select('*, user_profiles:uploaded_by(full_name)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (error) {
      console.error('Erro ao buscar arquivo:', error)
      return { error: 'Arquivo não encontrado', data: null }
    }

    return { data }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao buscar arquivo', data: null }
  }
}

/**
 * Criar registro de arquivo (após upload)
 */
export async function createFileRecord(formData: FormData) {
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
    const original_name = formData.get('original_name') as string
    const description = formData.get('description') as string
    const storage_path = formData.get('storage_path') as string
    const file_url = formData.get('file_url') as string
    const file_size = parseInt(formData.get('file_size') as string)
    const mime_type = formData.get('mime_type') as string
    const file_type = formData.get('file_type') as string || 'document'
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const is_knowledge_base = formData.get('is_knowledge_base') === 'true'

    if (!name || !original_name || !storage_path || !file_url) {
      return { error: 'Dados obrigatórios faltando' }
    }

    const { error } = await supabase.from('files').insert({
      company_id: company.id,
      name,
      original_name,
      description: description || null,
      storage_path,
      file_url,
      file_size,
      mime_type: mime_type || null,
      file_type,
      category: category || null,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      is_knowledge_base,
      uploaded_by: user.id,
    })

    if (error) {
      console.error('Erro ao criar arquivo:', error)
      return { error: 'Erro ao criar registro do arquivo' }
    }

    revalidatePath('/documents')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao criar arquivo' }
  }
}

/**
 * Atualizar arquivo
 */
export async function updateFile(id: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const is_knowledge_base = formData.get('is_knowledge_base') === 'true'

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== null) updateData.description = description || null
    if (category !== null) updateData.category = category || null
    if (tags !== null) updateData.tags = tags ? tags.split(',').map((t) => t.trim()) : []
    if (formData.has('is_knowledge_base')) updateData.is_knowledge_base = is_knowledge_base

    const { error } = await supabase
      .from('files')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao atualizar arquivo:', error)
      return { error: 'Erro ao atualizar arquivo' }
    }

    revalidatePath('/documents')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao atualizar arquivo' }
  }
}

/**
 * Deletar arquivo
 */
export async function deleteFile(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    // Buscar o arquivo para obter o storage_path
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('storage_path, storage_bucket')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (fetchError || !file) {
      return { error: 'Arquivo não encontrado' }
    }

    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from(file.storage_bucket || 'files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('Erro ao deletar do storage:', storageError)
      // Continuar mesmo se falhar no storage
    }

    // Deletar registro do banco
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      return { error: 'Erro ao deletar arquivo' }
    }

    revalidatePath('/documents')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao deletar arquivo' }
  }
}

