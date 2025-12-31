-- ============================================
-- SUPABASE VECTOR STORE - RAG (Retrieval Augmented Generation)
-- ============================================
-- Este schema cria a estrutura para armazenar embeddings de documentos
-- e permitir busca por similaridade semântica usando pgvector

-- Habilitar extensão pgvector (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar chunks (pedaços) de documentos com embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    
    -- Conteúdo do chunk
    content TEXT NOT NULL, -- Texto do chunk
    content_embedding vector(1536), -- Embedding OpenAI (text-embedding-3-small = 1536 dimensões)
    
    -- Metadados do chunk
    chunk_index INTEGER NOT NULL, -- Índice do chunk no documento (0, 1, 2, ...)
    chunk_size INTEGER, -- Tamanho do chunk em caracteres
    token_count INTEGER, -- Número aproximado de tokens
    
    -- Metadados do arquivo original
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_category VARCHAR(100),
    file_tags TEXT[],
    
    -- Status
    is_indexed BOOLEAN DEFAULT false, -- Se o embedding foi gerado e indexado
    indexing_error TEXT, -- Erro ao gerar embedding (se houver)
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_document_chunks_company ON document_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_indexed ON document_chunks(company_id, is_indexed) WHERE is_indexed = true;
CREATE INDEX IF NOT EXISTS idx_document_chunks_knowledge_base ON document_chunks(company_id, is_indexed) 
    WHERE is_indexed = true;

-- Índice HNSW para busca vetorial por similaridade (muito mais rápido que busca linear)
-- HNSW (Hierarchical Navigable Small World) é otimizado para busca de similaridade
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw ON document_chunks 
    USING hnsw (content_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE content_embedding IS NOT NULL AND is_indexed = true;

-- Índice alternativo usando ivfflat (pode ser mais rápido em alguns casos, mas requer mais memória)
-- Comentado por padrão - descomente se preferir ivfflat ao invés de HNSW
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_ivfflat ON document_chunks 
--     USING ivfflat (content_embedding vector_cosine_ops)
--     WITH (lists = 100)
--     WHERE content_embedding IS NOT NULL AND is_indexed = true;

-- Função para buscar chunks similares usando busca vetorial
CREATE OR REPLACE FUNCTION search_similar_chunks(
    p_company_id UUID,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 5,
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_file_ids UUID[] DEFAULT NULL,
    p_categories TEXT[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    file_id UUID,
    content TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_category VARCHAR(100),
    file_tags TEXT[],
    chunk_index INTEGER,
    similarity FLOAT,
    metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.file_id,
        dc.content,
        dc.file_name,
        dc.file_type,
        dc.file_category,
        dc.file_tags,
        dc.chunk_index,
        -- Similaridade cosseno (1 - distância = similaridade)
        -- Quanto maior o valor, mais similar (1.0 = idêntico, 0.0 = completamente diferente)
        1 - (dc.content_embedding <=> p_query_embedding)::FLOAT as similarity,
        jsonb_build_object(
            'file_id', dc.file_id,
            'file_name', dc.file_name,
            'file_type', dc.file_type,
            'file_category', dc.file_category,
            'file_tags', dc.file_tags,
            'chunk_index', dc.chunk_index,
            'chunk_size', dc.chunk_size,
            'token_count', dc.token_count
        ) as metadata
    FROM document_chunks dc
    WHERE 
        dc.company_id = p_company_id
        AND dc.is_indexed = true
        AND dc.content_embedding IS NOT NULL
        -- Filtro por similaridade (threshold)
        AND (1 - (dc.content_embedding <=> p_query_embedding)::FLOAT) >= p_similarity_threshold
        -- Filtros opcionais
        AND (p_file_ids IS NULL OR dc.file_id = ANY(p_file_ids))
        AND (p_categories IS NULL OR dc.file_category = ANY(p_categories))
        AND (p_tags IS NULL OR dc.file_tags && p_tags)
    ORDER BY dc.content_embedding <=> p_query_embedding -- Ordena por similaridade (menor distância = mais similar)
    LIMIT p_limit;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION search_similar_chunks(UUID, vector, INTEGER, FLOAT, UUID[], TEXT[], TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION search_similar_chunks(UUID, vector, INTEGER, FLOAT, UUID[], TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_chunks(UUID, vector, INTEGER, FLOAT, UUID[], TEXT[], TEXT[]) TO anon;

-- Comentário explicativo
COMMENT ON FUNCTION search_similar_chunks IS 'Busca chunks de documentos similares usando busca vetorial. Retorna os chunks mais similares à query, ordenados por similaridade.';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_document_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_chunks_updated_at
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_document_chunks_updated_at();

-- RLS (Row Level Security) - Apenas usuários da mesma empresa podem ver os chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver chunks da própria empresa
CREATE POLICY "Users can view chunks from their company"
    ON document_chunks
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Política: Service role pode fazer tudo (para APIs externas)
CREATE POLICY "Service role can do everything"
    ON document_chunks
    FOR ALL
    USING (true)
    WITH CHECK (true);

