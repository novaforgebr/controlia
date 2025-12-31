import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/rag/search
 * 
 * Busca informações na base de conhecimento da empresa usando RAG (Retrieval Augmented Generation)
 * 
 * Body:
 * {
 *   "query": "string", // Pergunta ou termo de busca
 *   "company_id": "uuid", // ID da empresa
 *   "limit": 5, // Número de resultados (opcional, padrão: 5)
 *   "similarity_threshold": 0.7, // Threshold de similaridade (opcional, padrão: 0.7)
 *   "file_ids": ["uuid"], // Filtrar por IDs de arquivos específicos (opcional)
 *   "categories": ["string"], // Filtrar por categorias (opcional)
 *   "tags": ["string"] // Filtrar por tags (opcional)
 * }
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * - x-company-id: <company_id>
 */
export async function POST(request: NextRequest) {
  try {
    // Extrair company_id do header ou body
    const companyIdHeader = request.headers.get('x-company-id')
    const body = await request.json()
    const { query, company_id, limit = 5, similarity_threshold = 0.7, file_ids, categories, tags } = body

    // Validar parâmetros obrigatórios
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro "query" é obrigatório e deve ser uma string não vazia' },
        { status: 400 }
      )
    }

    const companyId = company_id || companyIdHeader
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório (header x-company-id ou body)' },
        { status: 400 }
      )
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json(
        { error: 'company_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    // Validar OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração de IA não disponível' },
        { status: 500 }
      )
    }

    // Criar cliente Supabase com service role (bypass RLS)
    const supabase = createServiceRoleClient()

    // Verificar se a empresa existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('Erro ao buscar empresa:', companyError)
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Gerar embedding da query usando OpenAI
    console.log('Gerando embedding para query:', query.substring(0, 100))
    let queryEmbedding: number[]
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small', // Modelo mais barato e rápido (1536 dimensões)
        input: query.trim(),
      })

      queryEmbedding = embeddingResponse.data[0].embedding

      if (!queryEmbedding || queryEmbedding.length !== 1536) {
        throw new Error('Embedding inválido retornado pela OpenAI')
      }
    } catch (embeddingError: any) {
      console.error('Erro ao gerar embedding:', embeddingError)
      return NextResponse.json(
        { 
          error: 'Erro ao processar a consulta',
          details: embeddingError.message || 'Erro desconhecido ao gerar embedding'
        },
        { status: 500 }
      )
    }

    // Converter array para formato vector do PostgreSQL
    const embeddingVector = `[${queryEmbedding.join(',')}]`

    // Buscar chunks similares usando a função RPC
    console.log('Buscando chunks similares...')
    const { data: similarChunks, error: searchError } = await supabase.rpc(
      'search_similar_chunks',
      {
        p_company_id: companyId,
        p_query_embedding: embeddingVector,
        p_limit: Math.min(limit, 10), // Limitar a 10 resultados no máximo
        p_similarity_threshold: similarity_threshold,
        p_file_ids: file_ids && file_ids.length > 0 ? file_ids : null,
        p_categories: categories && categories.length > 0 ? categories : null,
        p_tags: tags && tags.length > 0 ? tags : null,
      }
    )

    if (searchError) {
      console.error('Erro ao buscar chunks similares:', searchError)
      return NextResponse.json(
        { 
          error: 'Erro ao buscar na base de conhecimento',
          details: searchError.message
        },
        { status: 500 }
      )
    }

    // Se não encontrou resultados, retornar vazio
    if (!similarChunks || similarChunks.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'Nenhum resultado encontrado na base de conhecimento',
        query: query,
        company_id: companyId,
      })
    }

    // Formatar resposta
    const results = similarChunks.map((chunk: any) => ({
      id: chunk.id,
      file_id: chunk.file_id,
      content: chunk.content,
      file_name: chunk.file_name,
      file_type: chunk.file_type,
      file_category: chunk.file_category,
      file_tags: chunk.file_tags,
      chunk_index: chunk.chunk_index,
      similarity: chunk.similarity,
      metadata: chunk.metadata,
    }))

    // Agrupar por arquivo para facilitar uso
    const groupedByFile = results.reduce((acc: any, chunk: any) => {
      if (!acc[chunk.file_id]) {
        acc[chunk.file_id] = {
          file_id: chunk.file_id,
          file_name: chunk.file_name,
          file_type: chunk.file_type,
          file_category: chunk.file_category,
          file_tags: chunk.file_tags,
          chunks: [],
        }
      }
      acc[chunk.file_id].chunks.push({
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        similarity: chunk.similarity,
      })
      return acc
    }, {})

    return NextResponse.json({
      data: results,
      grouped_by_file: Object.values(groupedByFile),
      summary: {
        total_results: results.length,
        average_similarity: results.reduce((sum: number, r: any) => sum + r.similarity, 0) / results.length,
        files_found: Object.keys(groupedByFile).length,
      },
      query: query,
      company_id: companyId,
    })
  } catch (error: any) {
    console.error('Erro na busca RAG:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar busca',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rag/search
 * 
 * Versão GET da busca (para facilitar testes)
 * 
 * Query params:
 * - query: string (obrigatório)
 * - company_id: uuid (obrigatório)
 * - limit: number (opcional, padrão: 5)
 * - similarity_threshold: number (opcional, padrão: 0.7)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const companyId = searchParams.get('company_id') || request.headers.get('x-company-id')
    const limit = parseInt(searchParams.get('limit') || '5')
    const similarityThreshold = parseFloat(searchParams.get('similarity_threshold') || '0.7')

    if (!query) {
      return NextResponse.json(
        { error: 'Parâmetro "query" é obrigatório' },
        { status: 400 }
      )
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // Redirecionar para POST com body
    const body = {
      query,
      company_id: companyId,
      limit,
      similarity_threshold: similarityThreshold,
    }

    // Criar uma nova requisição POST
    const postRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body),
    })

    return POST(postRequest)
  } catch (error: any) {
    console.error('Erro na busca RAG (GET):', error)
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar busca',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

