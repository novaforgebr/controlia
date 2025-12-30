import { updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const companyId = body.company_id || request.headers.get('x-company-id')

    // Para requisições do n8n, company_id é obrigatório
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório para requisições externas. Forneça via body ou header x-company-id' },
        { status: 400 }
      )
    }

    // Validar que end_at é posterior a start_at se ambos forem fornecidos
    if (body.start_at && body.end_at) {
      if (new Date(body.end_at) <= new Date(body.start_at)) {
        return NextResponse.json(
          { error: 'Data de fim deve ser posterior à data de início' },
          { status: 400 }
        )
      }
    }

    // Criar FormData para a server action
    const formData = new FormData()
    if (body.title !== undefined) formData.append('title', body.title)
    if (body.description !== undefined) formData.append('description', body.description || '')
    if (body.start_at !== undefined) formData.append('start_at', body.start_at)
    if (body.end_at !== undefined) formData.append('end_at', body.end_at)
    if (body.is_all_day !== undefined) formData.append('is_all_day', body.is_all_day ? 'true' : 'false')
    if (body.location !== undefined) formData.append('location', body.location || '')
    if (body.contact_id !== undefined) formData.append('contact_id', body.contact_id || '')
    if (body.visibility !== undefined) formData.append('visibility', body.visibility)
    if (body.status !== undefined) formData.append('status', body.status)

    const result = await updateCalendarEvent(id, formData, companyId || undefined)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id') || request.headers.get('x-company-id')

    // Para requisições do n8n, company_id é obrigatório
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório para requisições externas. Forneça via query parameter ou header x-company-id' },
        { status: 400 }
      )
    }

    const result = await deleteCalendarEvent(id, companyId || undefined)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao deletar evento' }, { status: 500 })
  }
}

