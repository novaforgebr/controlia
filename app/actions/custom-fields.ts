'use server'

/**
 * Server Actions para o módulo de Campos Customizados
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { logHumanAction } from '@/lib/utils/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const customFieldSchema = z.object({
  field_key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e underscore'),
  field_label: z.string().min(1).max(255),
  field_type: z.enum(['text', 'number', 'date', 'select', 'textarea', 'boolean']),
  field_options: z.array(z.string()).optional(),
  is_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
  validation_rules: z.record(z.unknown()).optional(),
})

/**
 * Listar campos customizados da empresa
 */
export async function listCustomFields() {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    const { data: fields, error } = await supabase
      .from('contact_custom_fields')
      .select('*')
      .eq('company_id', company.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao listar campos customizados:', error)
      return { error: 'Erro ao listar campos customizados', data: [] }
    }

    return { success: true, data: fields || [] }
  } catch (error) {
    console.error('Erro ao listar campos customizados:', error)
    return { error: 'Erro ao listar campos customizados', data: [] }
  }
}

/**
 * Criar campo customizado
 */
export async function createCustomField(formData: FormData) {
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
      field_key: formData.get('field_key') as string,
      field_label: formData.get('field_label') as string,
      field_type: formData.get('field_type') as string,
      field_options: formData.get('field_options') 
        ? (formData.get('field_options') as string).split(',').map(o => o.trim()).filter(o => o)
        : undefined,
      is_required: formData.get('is_required') === 'true',
      is_active: formData.get('is_active') !== 'false',
      display_order: formData.get('display_order') 
        ? parseInt(formData.get('display_order') as string) 
        : 0,
    }

    const validatedData = customFieldSchema.parse(rawData)

    const supabase = await createClient()

    // Verificar se field_key já existe
    const { data: existing } = await supabase
      .from('contact_custom_fields')
      .select('id')
      .eq('company_id', company.id)
      .eq('field_key', validatedData.field_key)
      .single()

    if (existing) {
      return { error: 'Já existe um campo com esta chave' }
    }

    const { data: field, error } = await supabase
      .from('contact_custom_fields')
      .insert({
        company_id: company.id,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar campo customizado:', error)
      return { error: 'Erro ao criar campo customizado' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'create_custom_field',
      'contact_custom_field',
      field.id,
      { created: field }
    )

    revalidatePath('/contacts/custom-fields')
    revalidatePath('/contacts/new')
    revalidatePath('/contacts')

    return { success: true, data: field }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Erro ao criar campo customizado:', error)
    return { error: 'Erro ao criar campo customizado' }
  }
}

/**
 * Atualizar campo customizado
 */
export async function updateCustomField(fieldId: string, formData: FormData) {
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

    // Buscar campo atual
    const { data: currentField } = await supabase
      .from('contact_custom_fields')
      .select('*')
      .eq('id', fieldId)
      .eq('company_id', company.id)
      .single()

    if (!currentField) {
      return { error: 'Campo customizado não encontrado' }
    }

    const rawData = {
      field_label: formData.get('field_label') as string,
      field_type: formData.get('field_type') as string,
      field_options: formData.get('field_options') 
        ? (formData.get('field_options') as string).split(',').map(o => o.trim()).filter(o => o)
        : undefined,
      is_required: formData.get('is_required') === 'true',
      is_active: formData.get('is_active') !== 'false',
      display_order: formData.get('display_order') 
        ? parseInt(formData.get('display_order') as string) 
        : currentField.display_order,
    }

    const validatedData = customFieldSchema.partial().parse(rawData)

    const { data: updatedField, error } = await supabase
      .from('contact_custom_fields')
      .update(validatedData)
      .eq('id', fieldId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar campo customizado:', error)
      return { error: 'Erro ao atualizar campo customizado' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'update_custom_field',
      'contact_custom_field',
      fieldId,
      { updated: updatedField }
    )

    revalidatePath('/contacts/custom-fields')
    revalidatePath('/contacts/new')
    revalidatePath('/contacts')

    return { success: true, data: updatedField }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Erro ao atualizar campo customizado:', error)
    return { error: 'Erro ao atualizar campo customizado' }
  }
}

/**
 * Deletar campo customizado
 */
export async function deleteCustomField(fieldId: string) {
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

    const { error } = await supabase
      .from('contact_custom_fields')
      .delete()
      .eq('id', fieldId)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar campo customizado:', error)
      return { error: 'Erro ao deletar campo customizado' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'delete_custom_field',
      'contact_custom_field',
      fieldId,
      {}
    )

    revalidatePath('/contacts/custom-fields')
    revalidatePath('/contacts/new')
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar campo customizado:', error)
    return { error: 'Erro ao deletar campo customizado' }
  }
}

/**
 * Obter campo customizado por ID
 */
export async function getCustomField(fieldId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: null }
    }

    const supabase = await createClient()

    const { data: field, error } = await supabase
      .from('contact_custom_fields')
      .select('*')
      .eq('id', fieldId)
      .eq('company_id', company.id)
      .single()

    if (error) {
      console.error('Erro ao buscar campo customizado:', error)
      return { error: 'Campo customizado não encontrado', data: null }
    }

    return { success: true, data: field }
  } catch (error) {
    console.error('Erro ao buscar campo customizado:', error)
    return { error: 'Erro ao buscar campo customizado', data: null }
  }
}

