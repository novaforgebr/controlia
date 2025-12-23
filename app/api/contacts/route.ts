import { listContacts } from '@/app/actions/contacts'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipeline_id')
    const pipelineStageId = searchParams.get('pipeline_stage_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const filters: any = {}
    if (pipelineId) filters.pipeline_id = pipelineId
    if (pipelineStageId) filters.pipeline_stage_id = pipelineStageId
    if (status) filters.status = status
    if (search) filters.search = search

    const result = await listContacts(filters)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data || [] })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }
}

