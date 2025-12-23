'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { revalidatePath } from 'next/cache'

/**
 * Listar eventos do calendário
 */
export async function listCalendarEvents(startDate?: Date, endDate?: Date) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    let query = supabase
      .from('calendar_events')
      .select('*, contacts:contact_id(name, email), user_profiles:organizer_id(full_name)')
      .eq('company_id', company.id)
      .eq('status', 'scheduled')
      .order('start_at', { ascending: true })

    if (startDate && endDate) {
      query = query
        .gte('start_at', startDate.toISOString())
        .lte('end_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar eventos:', error)
      return { error: 'Erro ao listar eventos', data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao listar eventos', data: [] }
  }
}

/**
 * Obter um evento específico
 */
export async function getCalendarEvent(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, contacts:contact_id(name, email), user_profiles:organizer_id(full_name)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (error) {
      console.error('Erro ao buscar evento:', error)
      return { error: 'Evento não encontrado', data: null }
    }

    return { data }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao buscar evento', data: null }
  }
}

/**
 * Criar evento
 */
export async function createCalendarEvent(formData: FormData) {
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

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_at = formData.get('start_at') as string
    const end_at = formData.get('end_at') as string
    const is_all_day = formData.get('is_all_day') === 'true'
    const location = formData.get('location') as string
    const contact_id = formData.get('contact_id') as string
    const visibility = formData.get('visibility') as string || 'company'

    if (!title || !start_at || !end_at) {
      return { error: 'Título, data de início e fim são obrigatórios' }
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        company_id: company.id,
        title,
        description: description || null,
        start_at,
        end_at,
        is_all_day,
        location: location || null,
        contact_id: contact_id || null,
        organizer_id: user.id,
        visibility,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar evento:', error)
      return { error: 'Erro ao criar evento' }
    }

    revalidatePath('/calendar')
    return { success: true, data: event }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao criar evento' }
  }
}

/**
 * Atualizar evento
 */
export async function updateCalendarEvent(id: string, formData: FormData) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const updateData: any = {}
    if (formData.has('title')) updateData.title = formData.get('title') as string
    if (formData.has('description')) updateData.description = formData.get('description') as string || null
    if (formData.has('start_at')) updateData.start_at = formData.get('start_at') as string
    if (formData.has('end_at')) updateData.end_at = formData.get('end_at') as string
    if (formData.has('is_all_day')) updateData.is_all_day = formData.get('is_all_day') === 'true'
    if (formData.has('location')) updateData.location = formData.get('location') as string || null
    if (formData.has('contact_id')) updateData.contact_id = formData.get('contact_id') as string || null
    if (formData.has('visibility')) updateData.visibility = formData.get('visibility') as string
    if (formData.has('status')) updateData.status = formData.get('status') as string

    const { error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao atualizar evento:', error)
      return { error: 'Erro ao atualizar evento' }
    }

    revalidatePath('/calendar')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao atualizar evento' }
  }
}

/**
 * Deletar evento
 */
export async function deleteCalendarEvent(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar evento:', error)
      return { error: 'Erro ao deletar evento' }
    }

    revalidatePath('/calendar')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao deletar evento' }
  }
}

