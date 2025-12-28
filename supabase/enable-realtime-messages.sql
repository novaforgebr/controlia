-- ============================================
-- HABILITAR REALTIME PARA TABELA MESSAGES
-- ============================================
-- Este script habilita o Supabase Realtime para a tabela messages
-- permitindo que as mensagens apareçam em tempo real na interface

-- 1. Habilitar Realtime na tabela messages
-- Isso permite que o Supabase publique mudanças nesta tabela via Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Configurar REPLICA IDENTITY FULL
-- Isso garante que todas as colunas sejam replicadas corretamente
-- IMPORTANTE: Isso é necessário para que o Realtime funcione corretamente
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 3. Verificar se a tabela está habilitada para Realtime
-- Execute esta query para verificar:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. O Realtime do Supabase funciona através de PostgreSQL Logical Replication
-- 2. A tabela precisa estar na publicação 'supabase_realtime'
-- 3. REPLICA IDENTITY FULL garante que todas as colunas sejam replicadas
-- 4. As políticas RLS continuam funcionando normalmente com Realtime
-- 5. Após executar este script, as mensagens devem aparecer em tempo real
--    sem necessidade de recarregar a página

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
-- WHERE tablename = 'messages';
--
-- Se retornar uma linha, o Realtime está habilitado.
-- Se não retornar nada, execute este script novamente.


