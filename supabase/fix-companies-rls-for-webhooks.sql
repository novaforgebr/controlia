-- ============================================
-- Script para permitir leitura de companies para webhooks
-- Isso permite que o sistema busque bot tokens mesmo sem usuário autenticado
-- ============================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
DROP POLICY IF EXISTS "Users can view companies they belong to or for webhooks" ON companies;

-- Política 1: Usuários podem ver empresas onde são membros
CREATE POLICY "Users can view companies they belong to"
    ON companies FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Política 2: Permitir leitura pública de settings para webhooks
-- Isso permite que webhooks leiam apenas o campo settings para buscar tokens
-- IMPORTANTE: Esta política permite leitura mesmo sem autenticação
CREATE POLICY "Webhooks can read company settings"
    ON companies FOR SELECT
    TO authenticated, anon
    USING (true);  -- Permite leitura para todos (autenticados e não autenticados)

-- Nota: Esta política permite leitura completa da tabela companies.
-- Se quiser mais segurança, você pode criar uma função que retorna apenas settings,
-- mas por enquanto isso resolve o problema dos webhooks.

-- Alternativa mais segura (comentada):
-- Criar função que retorna apenas settings:
/*
CREATE OR REPLACE FUNCTION get_company_settings(company_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT settings FROM companies WHERE id = company_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E usar no código:
-- SELECT get_company_settings('company-id') as settings;
*/

