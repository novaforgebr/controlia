import { listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const status = searchParams.get('status')
    const contactId = searchParams.get('contact_id')
    const visibility = searchParams.get('visibility')

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    const result = await listCalendarEvents(start, end)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Aplicar filtros adicionais no lado do servidor
    let filteredData = result.data || []
    if (status) {
      filteredData = filteredData.filter((event: any) => event.status === status)
    }
    if (contactId) {
      filteredData = filteredData.filter((event: any) => event.contact_id === contactId)
    }
    if (visibility) {
      filteredData = filteredData.filter((event: any) => event.visibility === visibility)
    }

    return NextResponse.json({ data: filteredData })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, start_at, end_at, is_all_day, location, contact_id, visibility } = body

    if (!title || !start_at || !end_at) {
      return NextResponse.json(
        { error: 'Título, data de início e fim são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar que end_at é posterior a start_at
    if (new Date(end_at) <= new Date(start_at)) {
      return NextResponse.json(
        { error: 'Data de fim deve ser posterior à data de início' },
        { status: 400 }
      )
    }

    // Criar FormData para a server action
    const formData = new FormData()
    formData.append('title', title)
    if (description) formData.append('description', description)
    formData.append('start_at', start_at)
    formData.append('end_at', end_at)
    formData.append('is_all_day', is_all_day ? 'true' : 'false')
    if (location) formData.append('location', location)
    if (contact_id) formData.append('contact_id', contact_id)
    if (visibility) formData.append('visibility', visibility)

    const result = await createCalendarEvent(formData)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}

