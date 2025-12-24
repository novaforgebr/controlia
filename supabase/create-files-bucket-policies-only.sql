-- ============================================
-- CRIAÇÃO DE POLÍTICAS RLS PARA O BUCKET "files"
-- ============================================
-- Execute este script APENAS se o bucket "files" já foi criado
-- Este script cria apenas as políticas RLS necessárias
-- ============================================

-- Remover políticas existentes (se tiver permissão)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Policy: Usuários autenticados podem fazer upload de arquivos
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

-- Policy: Usuários autenticados podem visualizar arquivos
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'files');

-- Policy: Usuários autenticados podem atualizar arquivos
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'files')
WITH CHECK (bucket_id = 'files');

-- Policy: Usuários autenticados podem deletar arquivos
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files');

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies 
-- WHERE tablename = 'objects' 
-- AND schemaname = 'storage'
-- AND policyname LIKE '%files%';

-- ============================================
-- NOTA: Se você receber erro de permissão,
-- crie as políticas manualmente pelo Dashboard:
-- 1. Acesse Storage > Policies
-- 2. Selecione o bucket "files"
-- 3. Crie as políticas conforme acima
-- ============================================

