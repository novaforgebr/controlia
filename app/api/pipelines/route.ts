import { listPipelines } from '@/app/actions/pipelines'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await listPipelines()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar pipelines' }, { status: 500 })
  }
}

