-- ============================================
-- CORREÇÃO: Recursão infinita em company_users RLS
-- ============================================
-- Este script corrige o problema de recursão infinita
-- na política RLS da tabela company_users
-- ============================================

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view company_users of their companies" ON company_users;
DROP POLICY IF EXISTS "Users can manage company_users" ON company_users;
DROP POLICY IF EXISTS "Users can insert company_users" ON company_users;
DROP POLICY IF EXISTS "Users can update company_users" ON company_users;
DROP POLICY IF EXISTS "Users can delete company_users" ON company_users;

-- Nova política SELECT: Usuários podem ver seus próprios registros
-- Isso evita recursão porque verifica diretamente o user_id
CREATE POLICY "Users can view own company_users"
    ON company_users FOR SELECT
    USING (user_id = auth.uid());

-- Nova política INSERT: Usuários podem criar associações para si mesmos
-- Isso permite criar a empresa e associar o usuário como admin
CREATE POLICY "Users can insert own company_users"
    ON company_users FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Nova política UPDATE: Usuários podem atualizar seus próprios registros
-- Apenas campos não críticos (role, permissions, is_active)
CREATE POLICY "Users can update own company_users"
    ON company_users FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- NOTA: DELETE não é permitido via RLS para company_users
-- Apenas admins da empresa podem remover usuários (via lógica de aplicação)

-- ============================================
-- ATUALIZAR FUNÇÃO user_belongs_to_company
-- ============================================
-- A função precisa usar SECURITY DEFINER para bypass RLS
-- quando verificar se o usuário pertence à empresa
CREATE OR REPLACE FUNCTION user_belongs_to_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Usar SECURITY DEFINER permite bypass RLS temporariamente
    -- para verificar a associação sem causar recursão
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PERMISSÕES ADICIONAIS
-- ============================================
-- Garantir que a função tenha as permissões necessárias
GRANT EXECUTE ON FUNCTION user_belongs_to_company(UUID) TO authenticated;

