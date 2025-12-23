-- ============================================
-- Script para limpar dados de teste
-- ATENÇÃO: Este script remove TODOS os dados de teste relacionados a contatos, conversas e mensagens
-- Execute com cuidado e apenas em ambiente de desenvolvimento/teste
-- ============================================

-- 1. Deletar todas as mensagens (cascata vai limpar relacionamentos)
DELETE FROM messages;

-- 2. Deletar todas as conversas
DELETE FROM conversations;

-- 3. Deletar todos os contatos (cascata vai limpar relacionamentos)
DELETE FROM contacts;

-- 4. Opcional: Limpar logs de automação (se houver)
DELETE FROM automation_logs;

-- 5. Opcional: Limpar logs de auditoria relacionados (se quiser limpar tudo)
-- DELETE FROM audit_logs WHERE entity_type IN ('contact', 'conversation', 'message');

-- 6. Verificar se há dados restantes
SELECT 
  (SELECT COUNT(*) FROM contacts) as total_contacts,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM automation_logs) as total_automation_logs;

-- ============================================
-- NOTA: Este script mantém:
-- - Empresas (companies)
-- - Usuários (users, user_profiles)
-- - Configurações de integrações (nas settings das empresas)
-- - Automações (automations) - apenas os logs são limpos
-- - Prompts de IA (ai_prompts)
-- ============================================

