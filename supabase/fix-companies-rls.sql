-- ============================================
-- CORREÇÃO: RLS bloqueando criação de empresas
-- ============================================
-- Este script adiciona políticas RLS para permitir
-- que usuários autenticados criem empresas
-- ============================================

-- Remover políticas existentes (se houver conflito)
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON companies;

-- ============================================
-- POLÍTICAS PARA TABELA COMPANIES
-- ============================================

-- Policy SELECT: Usuários podem ver empresas onde são membros
CREATE POLICY "Users can view companies they belong to"
    ON companies FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Policy INSERT: Usuários autenticados podem criar empresas
-- IMPORTANTE: Esta política permite que qualquer usuário autenticado crie uma empresa
CREATE POLICY "Authenticated users can create companies"
    ON companies FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy UPDATE: Apenas usuários admin da empresa podem atualizar
CREATE POLICY "Admins can update companies"
    ON companies FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    )
    WITH CHECK (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Policy DELETE: Apenas admins podem deletar empresas
CREATE POLICY "Admins can delete companies"
    ON companies FOR DELETE
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- ============================================
-- GARANTIR PERMISSÕES DE USUÁRIO
-- ============================================

-- Garantir que usuários autenticados tenham permissões na tabela companies
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;

-- ============================================
-- VERIFICAR POLÍTICAS DE COMPANY_USERS
-- ============================================
-- Garantir que as políticas de company_users também estão corretas

-- Remover políticas antigas de company_users se existirem
DROP POLICY IF EXISTS "Users can view company_users of their companies" ON company_users;
DROP POLICY IF EXISTS "Users can view own company_users" ON company_users;
DROP POLICY IF EXISTS "Users can insert own company_users" ON company_users;
DROP POLICY IF EXISTS "Users can insert company_users" ON company_users;
DROP POLICY IF EXISTS "Users can update own company_users" ON company_users;
DROP POLICY IF EXISTS "Users can update company_users" ON company_users;

-- Policy SELECT: Usuários podem ver seus próprios registros
CREATE POLICY "Users can view own company_users"
    ON company_users FOR SELECT
    USING (user_id = auth.uid());

-- Policy INSERT: Usuários podem criar associações para si mesmos
-- OU se já são admin de uma empresa, podem adicionar outros usuários
CREATE POLICY "Users can insert company_users"
    ON company_users FOR INSERT
    WITH CHECK (
        -- Pode criar associação para si mesmo
        user_id = auth.uid()
        OR
        -- OU é admin da empresa e pode adicionar outros
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Policy UPDATE: Usuários podem atualizar seus próprios registros
-- OU admins podem atualizar registros de suas empresas
CREATE POLICY "Users can update company_users"
    ON company_users FOR UPDATE
    USING (
        user_id = auth.uid()
        OR
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- ============================================
-- ATUALIZAR FUNÇÃO user_belongs_to_company
-- ============================================
CREATE OR REPLACE FUNCTION user_belongs_to_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION user_belongs_to_company(UUID) TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar se as políticas foram criadas corretamente:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('companies', 'company_users')
-- ORDER BY tablename, policyname;
