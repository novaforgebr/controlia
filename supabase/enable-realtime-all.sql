-- ============================================
-- HABILITAR REALTIME PARA TODAS AS TABELAS NECESSÁRIAS
-- ============================================
-- Este script habilita o Supabase Realtime para as tabelas:
-- - messages (mensagens)
-- - conversations (conversas)
-- - contacts (contatos - para atualizar custom_fields)
-- ============================================

-- 1. Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. Habilitar Realtime na tabela conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- 3. Habilitar Realtime na tabela contacts (para atualizar custom_fields em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- ============================================
-- VERIFICAÇÃO:
-- ============================================
-- Para verificar se o Realtime está habilitado, execute:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   pubname
-- FROM pg_publication_tables
-- WHERE tablename IN ('messages', 'conversations', 'contacts')
-- ORDER BY tablename;
--
-- Se retornar 3 linhas (uma para cada tabela), o Realtime está habilitado.
-- Se não retornar todas, execute este script novamente.
-- ============================================

