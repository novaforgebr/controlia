-- ============================================
-- Script para corrigir RLS da tabela messages para permitir leitura
-- ============================================

-- 1. Verificar políticas atuais
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can manage messages of their companies" ON messages;
DROP POLICY IF EXISTS "Users can manage messages of their companies or without company" ON messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON messages;

-- 3. Criar política que permite SELECT para usuários autenticados da empresa
-- E também permite SELECT quando company_id IS NULL (para compatibilidade)
CREATE POLICY "Users can view messages of their companies or without company"
    ON messages FOR SELECT
    TO authenticated
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- 4. Criar política que permite INSERT para service role (webhooks)
CREATE POLICY "Service role can insert messages"
    ON messages FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 5. Criar política que permite UPDATE para usuários autenticados da empresa
CREATE POLICY "Users can update messages of their companies"
    ON messages FOR UPDATE
    TO authenticated
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    )
    WITH CHECK (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- 6. Criar política que permite DELETE para usuários autenticados da empresa
CREATE POLICY "Users can delete messages of their companies"
    ON messages FOR DELETE
    TO authenticated
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- 7. Verificar políticas criadas
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

