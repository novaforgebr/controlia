-- ============================================
-- CRIAÇÃO DO BUCKET "files" NO SUPABASE STORAGE
-- ============================================
-- Este script cria o bucket "files" e configura as políticas RLS necessárias
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================
-- NOTA: Não é necessário criar extensão "storage" - o Supabase Storage
-- é um serviço gerenciado e a tabela storage.buckets já está disponível

-- Criar o bucket "files" se não existir
-- O ON CONFLICT garante que não dará erro se o bucket já existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Bucket privado (não público)
    52428800, -- Limite de 50MB por arquivo
    NULL -- Permitir todos os tipos MIME
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS PARA O BUCKET "files"
-- ============================================
-- Essas políticas garantem que usuários só possam acessar arquivos de suas empresas

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can upload files to their companies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files from their companies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files from their companies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their companies" ON storage.objects;

-- Função helper para verificar se o usuário pertence à empresa do arquivo
-- O caminho do arquivo segue o padrão: {company_id}/{filename}
CREATE OR REPLACE FUNCTION storage.user_belongs_to_file_company(file_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    file_company_id UUID;
    path_parts TEXT[];
BEGIN
    -- Extrair company_id do caminho do arquivo (primeira parte antes da barra)
    path_parts := string_to_array(file_name, '/');
    
    -- Verificar se há pelo menos uma parte no caminho
    IF array_length(path_parts, 1) < 1 THEN
        RETURN false;
    END IF;
    
    -- Tentar converter a primeira parte em UUID (company_id)
    BEGIN
        file_company_id := path_parts[1]::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            -- Se não for um UUID válido, retornar false
            RETURN false;
    END;
    
    -- Verificar se o usuário pertence à empresa
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = file_company_id
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Usuários podem fazer upload de arquivos para suas empresas
CREATE POLICY "Users can upload files to their companies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'files' AND
    storage.user_belongs_to_file_company(name)
);

-- Policy: Usuários podem visualizar arquivos de suas empresas
CREATE POLICY "Users can view files from their companies"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'files' AND
    storage.user_belongs_to_file_company(name)
);

-- Policy: Usuários podem atualizar arquivos de suas empresas
CREATE POLICY "Users can update files from their companies"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'files' AND
    storage.user_belongs_to_file_company(name)
)
WITH CHECK (
    bucket_id = 'files' AND
    storage.user_belongs_to_file_company(name)
);

-- Policy: Usuários podem deletar arquivos de suas empresas
CREATE POLICY "Users can delete files from their companies"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'files' AND
    storage.user_belongs_to_file_company(name)
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar se o bucket foi criado:
-- SELECT * FROM storage.buckets WHERE name = 'files';

-- Para verificar as políticas criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Se o método SQL acima não funcionar, crie o bucket manualmente:
--    - Acesse o Supabase Dashboard
--    - Vá em Storage
--    - Clique em "New bucket"
--    - Nome: "files"
--    - Público: Não (desmarcado)
--    - File size limit: 50MB (ou o valor desejado)
--    - Allowed MIME types: Deixe vazio para permitir todos
--
-- 2. As políticas RLS acima garantem que:
--    - Usuários só podem fazer upload para pastas de suas empresas
--    - Usuários só podem visualizar arquivos de suas empresas
--    - Usuários só podem atualizar/deletar arquivos de suas empresas
--
-- 3. O caminho dos arquivos deve seguir o padrão: {company_id}/{filename}
--    Exemplo: "123e4567-e89b-12d3-a456-426614174000/documento.pdf"
--
-- ============================================

