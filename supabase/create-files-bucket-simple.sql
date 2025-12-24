-- ============================================
-- CRIAÇÃO SIMPLIFICADA DO BUCKET "files"
-- ============================================
-- Se o script anterior não funcionar, use este método alternativo
-- ou crie o bucket manualmente pelo Dashboard do Supabase
-- ============================================

-- Método alternativo: Criar bucket diretamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Bucket privado
    52428800, -- 50MB
    NULL -- Permitir todos os tipos
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS BÁSICAS
-- ============================================
-- NOTA: Se você receber erro de permissão ao executar as políticas,
-- crie-as manualmente pelo Dashboard do Supabase em Storage > Policies
-- ou use uma conta com permissões de administrador

-- Remover políticas existentes (se tiver permissão)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Sem permissão para remover políticas. Continue manualmente.';
END $$;

-- Policy simplificada: Usuários autenticados podem gerenciar arquivos no bucket "files"
-- Nota: Esta é uma política mais permissiva. Ajuste conforme necessário.

DO $$
BEGIN
    CREATE POLICY "Authenticated users can upload files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'files');

    CREATE POLICY "Authenticated users can view files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'files');

    CREATE POLICY "Authenticated users can delete files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'files');
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Sem permissão para criar políticas. Crie-as manualmente pelo Dashboard.';
    WHEN duplicate_object THEN
        RAISE NOTICE 'Políticas já existem.';
END $$;

-- ============================================
-- IMPORTANTE: Para políticas mais restritivas por empresa,
-- use o script create-files-bucket.sql completo
-- ============================================

