-- ============================================
-- CORREÇÃO: Políticas RLS para user_profiles
-- ============================================
-- Garantir que usuários possam criar e atualizar seus próprios perfis
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Policy SELECT: Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Policy INSERT: Usuários autenticados podem criar seus próprios perfis
-- IMPORTANTE: Permite que o usuário crie seu próprio perfil após registro
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Policy UPDATE: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar se as políticas foram criadas:
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'user_profiles';

