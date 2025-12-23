import { listCalendarEvents } from '@/app/actions/calendar'
import { NextRequest, NextResponse } from 'next/server'

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

