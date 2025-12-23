-- ============================================
-- CORREÇÃO: RLS bloqueando INSERT em audit_logs
-- ============================================
-- A política atual só permite SELECT, mas não INSERT
-- Este script adiciona política para permitir INSERT

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can insert audit_logs in their companies" ON audit_logs;
DROP POLICY IF EXISTS "System and AI can insert audit_logs" ON audit_logs;

-- Criar política única para INSERT que permite:
-- 1. Usuários da empresa inserirem logs
-- 2. Sistema/IA inserirem logs (quando user_id é NULL)
CREATE POLICY "Users and system can insert audit_logs"
    ON audit_logs FOR INSERT
    WITH CHECK (
        -- Permite inserção quando é do sistema/IA (user_id NULL) e company_id válido
        (user_id IS NULL AND actor_type IN ('system', 'ai'))
        OR
        -- Ou quando é de um usuário da empresa
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

