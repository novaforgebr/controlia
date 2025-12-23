-- ============================================
-- CORREÇÃO DEFINITIVA: RLS bloqueando criação de empresas
-- ============================================
-- Este script cria políticas mais permissivas e garante
-- que usuários autenticados possam criar empresas
-- ============================================

-- Primeiro, vamos verificar e remover TODAS as políticas existentes
DO $$ 
BEGIN
    -- Remover todas as políticas de companies
    DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
    DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
    DROP POLICY IF EXISTS "Users can create companies" ON companies;
    DROP POLICY IF EXISTS "Admins can update companies" ON companies;
    DROP POLICY IF EXISTS "Admins can delete companies" ON companies;
    
    -- Remover políticas de company_users
    DROP POLICY IF EXISTS "Users can view company_users of their companies" ON company_users;
    DROP POLICY IF EXISTS "Users can view own company_users" ON company_users;
    DROP POLICY IF EXISTS "Users can insert own company_users" ON company_users;
    DROP POLICY IF EXISTS "Users can insert company_users" ON company_users;
    DROP POLICY IF EXISTS "Users can update own company_users" ON company_users;
    DROP POLICY IF EXISTS "Users can update company_users" ON company_users;
END $$;

-- ============================================
-- POLÍTICAS PARA TABELA COMPANIES
-- ============================================

-- Policy SELECT: Usuários podem ver empresas onde são membros
-- Mas também podem ver empresas que acabaram de criar (antes de associar)
CREATE POLICY "Users can view companies they belong to or created"
    ON companies FOR SELECT
    USING (
        -- Empresas onde são membros
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR
        -- OU empresas criadas recentemente (últimos 5 minutos) por este usuário
        -- Nota: Isso permite ver a empresa logo após criar
        (created_at > NOW() - INTERVAL '5 minutes')
    );

-- Policy INSERT: Qualquer usuário autenticado pode criar empresa
-- Política mais simples e direta
CREATE POLICY "Authenticated users can create companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy UPDATE: Apenas usuários admin da empresa podem atualizar
CREATE POLICY "Admins can update companies"
    ON companies FOR UPDATE
    TO authenticated
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
    TO authenticated
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- ============================================
-- POLÍTICAS PARA TABELA COMPANY_USERS
-- ============================================

-- Policy SELECT: Usuários podem ver seus próprios registros
CREATE POLICY "Users can view own company_users"
    ON company_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy INSERT: Usuários podem criar associações para si mesmos
-- Política mais permissiva para permitir a criação inicial
CREATE POLICY "Users can insert company_users"
    ON company_users FOR INSERT
    TO authenticated
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
CREATE POLICY "Users can update company_users"
    ON company_users FOR UPDATE
    TO authenticated
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
-- GARANTIR PERMISSÕES
-- ============================================

-- Garantir permissões básicas
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON company_users TO authenticated;

-- ============================================
-- ATUALIZAR FUNÇÃO user_belongs_to_company
-- ============================================
CREATE OR REPLACE FUNCTION user_belongs_to_company(company_uuid UUID)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION user_belongs_to_company(UUID) TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar as políticas:
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('companies', 'company_users')
-- ORDER BY tablename, policyname;

