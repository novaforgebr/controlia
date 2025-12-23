'use server'

/**
 * Server Actions para o módulo de Contatos
 * Toda lógica de negócio fica aqui, separada da interface
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { createContactSchema, updateContactSchema } from '@/lib/validations/contact'
import { logHumanAction } from '@/lib/utils/audit'
import type { ContactInsert, Contact } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

/**
 * Criar novo contato
 */
export async function createContact(formData: FormData) {
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

    // Extrair dados do FormData
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || '',
      phone: formData.get('phone') as string || '',
      whatsapp: formData.get('whatsapp') as string || '',
      document: formData.get('document') as string || '',
      status: formData.get('status') as string || 'lead',
      source: formData.get('source') as string || '',
      score: formData.get('score') ? parseInt(formData.get('score') as string) : 0,
      notes: formData.get('notes') as string || '',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
      ai_enabled: formData.get('ai_enabled') === 'true',
    }

    // Extrair campos customizados (todos os campos que começam com "custom_")
    const customFields: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('custom_')) {
        const fieldKey = key.replace('custom_', '')
        const fieldValue = value as string
        
        // Buscar definição do campo para converter o tipo corretamente
        const { data: fieldDef } = await supabase
          .from('contact_custom_fields')
          .select('field_type')
          .eq('company_id', company.id)
          .eq('field_key', fieldKey)
          .eq('is_active', true)
          .single()

        if (fieldDef) {
          // Converter valor baseado no tipo do campo
          if (fieldDef.field_type === 'number') {
            customFields[fieldKey] = value ? Number(value) : null
          } else if (fieldDef.field_type === 'boolean') {
            customFields[fieldKey] = value === 'true'
          } else if (fieldDef.field_type === 'date' && value) {
            customFields[fieldKey] = new Date(value as string).toISOString()
          } else {
            customFields[fieldKey] = value || null
          }
        } else {
          // Se não encontrar definição, salvar como string
          customFields[fieldKey] = value || null
        }
      }
    }

    // Validar dados
    const validatedData = createContactSchema.parse(rawData)

    // Criar contato
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        company_id: company.id,
        created_by: user.id,
        ...validatedData,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : {},
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar contato:', error)
      return { error: 'Erro ao criar contato' }
    }

    // Registrar auditoria
    await logHumanAction(
      company.id,
      user.id,
      'create_contact',
      'contact',
      contact.id,
      { created: contact }
    )

    revalidatePath('/contacts')
    return { success: true, data: contact }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao criar contato:', error)
    return { error: 'Erro ao criar contato' }
  }
}

/**
 * Atualizar contato existente
 */
export async function updateContact(contactId: string, formData: FormData) {
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

    // Buscar contato atual para auditoria
    const { data: currentContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('company_id', company.id)
      .single()

    if (!currentContact) {
      return { error: 'Contato não encontrado' }
    }

    // Extrair dados do FormData
    const rawData: Record<string, unknown> = {}
    const fields = ['name', 'email', 'phone', 'whatsapp', 'document', 'status', 'source', 'score', 'notes', 'tags', 'ai_enabled']
    
    fields.forEach(field => {
      const value = formData.get(field)
      if (value !== null) {
        if (field === 'tags' && typeof value === 'string') {
          rawData[field] = value ? value.split(',').map(t => t.trim()) : []
        } else if (field === 'score') {
          rawData[field] = value ? parseInt(value as string) : 0
        } else if (field === 'ai_enabled') {
          rawData[field] = value === 'true'
        } else {
          rawData[field] = value || ''
        }
      }
    })

    // Extrair campos customizados
    const customFields: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('custom_')) {
        const fieldKey = key.replace('custom_', '')
        
        // Buscar definição do campo para converter o tipo corretamente
        const { data: fieldDef } = await supabase
          .from('contact_custom_fields')
          .select('field_type')
          .eq('company_id', company.id)
          .eq('field_key', fieldKey)
          .eq('is_active', true)
          .single()

        if (fieldDef) {
          // Converter valor baseado no tipo do campo
          if (fieldDef.field_type === 'number') {
            customFields[fieldKey] = value ? Number(value) : null
          } else if (fieldDef.field_type === 'boolean') {
            customFields[fieldKey] = value === 'true'
          } else if (fieldDef.field_type === 'date' && value) {
            customFields[fieldKey] = new Date(value as string).toISOString()
          } else {
            customFields[fieldKey] = value || null
          }
        } else {
          customFields[fieldKey] = value || null
        }
      }
    }

    // Validar dados
    const validatedData = updateContactSchema.parse(rawData)

    // Mesclar campos customizados existentes com novos
    const existingCustomFields = (currentContact.custom_fields as Record<string, unknown>) || {}
    const mergedCustomFields = { ...existingCustomFields, ...customFields }

    // Atualizar contato
    const { data: updatedContact, error } = await supabase
      .from('contacts')
      .update({
        ...validatedData,
        custom_fields: Object.keys(mergedCustomFields).length > 0 ? mergedCustomFields : {},
      })
      .eq('id', contactId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar contato:', error)
      return { error: 'Erro ao atualizar contato' }
    }

    // Registrar auditoria
    await logHumanAction(
      company.id,
      user.id,
      'update_contact',
      'contact',
      contactId,
      { before: currentContact, after: updatedContact }
    )

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    return { success: true, data: updatedContact }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Dados inválidos', details: error }
    }
    console.error('Erro ao atualizar contato:', error)
    return { error: 'Erro ao atualizar contato' }
  }
}

/**
 * Deletar contato
 */
export async function deleteContact(contactId: string) {
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

    // Buscar contato para auditoria
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('company_id', company.id)
      .single()

    if (!contact) {
      return { error: 'Contato não encontrado' }
    }

    // Deletar contato
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar contato:', error)
      return { error: 'Erro ao deletar contato' }
    }

    // Registrar auditoria
    await logHumanAction(
      company.id,
      user.id,
      'delete_contact',
      'contact',
      contactId,
      { deleted: contact }
    )

    revalidatePath('/contacts')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar contato:', error)
    return { error: 'Erro ao deletar contato' }
  }
}

/**
 * Buscar contato por ID
 */
export async function getContact(contactId: string): Promise<Contact | null> {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('company_id', company.id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Contact
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return null
  }
}

/**
 * Listar contatos com filtros
 */
export async function listContacts(filters?: {
  status?: string
  search?: string
  tags?: string[]
  pipeline_id?: string
  pipeline_stage_id?: string
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
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    if (filters?.pipeline_id) {
      query = query.eq('pipeline_id', filters.pipeline_id)
    }

    if (filters?.pipeline_stage_id) {
      query = query.eq('pipeline_stage_id', filters.pipeline_stage_id)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao listar contatos:', error)
      return { error: 'Erro ao listar contatos', data: [], count: 0 }
    }

    return { data: data as Contact[], count: count || 0 }
  } catch (error) {
    console.error('Erro ao listar contatos:', error)
    return { error: 'Erro ao listar contatos', data: [], count: 0 }
  }
}

