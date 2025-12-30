import { listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('start')
    const endDateParam = searchParams.get('end')
    const status = searchParams.get('status')
    const contactId = searchParams.get('contact_id')
    const visibility = searchParams.get('visibility')
    
    // Extrair company_id de múltiplas fontes (case-insensitive para headers)
    let companyId = searchParams.get('company_id')
    if (!companyId) {
      // Tentar header case-insensitive
      const headers = request.headers
      companyId = headers.get('x-company-id') || 
                  headers.get('X-Company-Id') || 
                  headers.get('X-COMPANY-ID')
    }
    
    // Normalizar company_id (trim, remover quebras de linha e validar)
    if (companyId) {
      companyId = companyId.trim()
        .replace(/\n/g, '') // Remover quebras de linha
        .replace(/\r/g, '') // Remover carriage return
        .replace(/\s+/g, '') // Remover todos os espaços
        .split('\n')[0] // Pegar apenas a primeira linha se houver múltiplas
        .trim()
      
      // Verificar se é uma expressão do n8n não resolvida
      if (companyId.includes('{{') || companyId.includes('$(')) {
        console.error('❌ Expressão do n8n não resolvida detectada:', companyId)
        companyId = null
      }
      
      // Validar formato UUID básico (36 caracteres com hífens)
      if (companyId && companyId.length === 0) {
        companyId = null
      } else if (companyId && companyId.length < 36) {
        console.warn('⚠️ company_id parece inválido (muito curto):', companyId)
      }
    }

    // Log para debug
    console.log('🔍 GET /api/calendar/events')
    console.log('🔍 companyId (query):', searchParams.get('company_id'))
    console.log('🔍 companyId (header x-company-id):', request.headers.get('x-company-id'))
    console.log('🔍 companyId (normalizado):', companyId)
    console.log('🔍 Todos os headers:', Object.fromEntries(request.headers.entries()))
    console.log('🔍 Parâmetros:', { startDateParam, endDateParam, status, contactId, visibility })

    // Parse das datas com melhor tratamento de erros
    let start: Date | undefined
    let end: Date | undefined

    if (startDateParam) {
      try {
        // Tentar parse direto
        start = new Date(startDateParam)
        // Verificar se a data é válida
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { error: 'Formato de data de início inválido. Use ISO 8601 (ex: 2025-01-15T10:00:00Z)' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato de data de início inválido. Use ISO 8601 (ex: 2025-01-15T10:00:00Z)' },
          { status: 400 }
        )
      }
    }

    if (endDateParam) {
      try {
        end = new Date(endDateParam)
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Formato de data de fim inválido. Use ISO 8601 (ex: 2025-01-15T11:00:00Z)' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato de data de fim inválido. Use ISO 8601 (ex: 2025-01-15T11:00:00Z)' },
          { status: 400 }
        )
      }
    }

    // Validar que ambas as datas foram fornecidas se uma foi fornecida
    if ((start && !end) || (!start && end)) {
      return NextResponse.json(
        { error: 'Ambos os parâmetros start e end devem ser fornecidos juntos' },
        { status: 400 }
      )
    }

    // Validar company_id para requisições externas
    // Se não tiver company_id, tentar usar autenticação normal (para frontend)
    if (!companyId) {
      console.warn('⚠️ company_id não fornecido - tentando autenticação normal')
    }

    console.log('🔍 Chamando listCalendarEvents com:', { 
      start, 
      end, 
      companyId,
      startISO: start?.toISOString(),
      endISO: end?.toISOString()
    })
    
    const result = await listCalendarEvents(start, end, companyId || undefined)
    
    console.log('🔍 Resultado de listCalendarEvents:', {
      hasError: !!result.error,
      error: result.error,
      dataLength: result.data?.length || 0,
      hasData: !!result.data
    })

    if (result.error) {
      console.error('❌ Erro retornado por listCalendarEvents:', result.error)
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
    const { title, description, start_at, end_at, is_all_day, location, contact_id, visibility, organizer_id } = body
    const companyId = body.company_id || request.headers.get('x-company-id')

    if (!title || !start_at || !end_at) {
      return NextResponse.json(
        { error: 'Título, data de início e fim são obrigatórios' },
        { status: 400 }
      )
    }

    // Para requisições do n8n, company_id é obrigatório
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório para requisições externas. Forneça via body ou header x-company-id' },
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
    if (organizer_id) formData.append('organizer_id', organizer_id)

    const result = await createCalendarEvent(formData, companyId || undefined)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}

