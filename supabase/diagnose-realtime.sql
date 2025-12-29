-- ============================================
-- DIAGNÓSTICO DE REALTIME - MESSAGES
-- ============================================
-- Este script verifica se o Realtime está configurado corretamente
-- Execute este script para diagnosticar problemas com subscriptions Realtime
-- ============================================

-- 1. Verificar se a tabela messages está na publicação supabase_realtime
SELECT 
  pubname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'messages';

-- Se não retornar nenhuma linha, o Realtime NÃO está habilitado para messages
-- Execute: supabase/enable-realtime-all.sql

-- 2. Verificar REPLICA IDENTITY da tabela messages
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'messages' 
  AND n.nspname = 'public';

-- replica_identity deve ser 'FULL' para Realtime funcionar corretamente
-- Se não for 'FULL', execute: ALTER TABLE messages REPLICA IDENTITY FULL;

-- 3. Verificar se a publicação supabase_realtime existe
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Se não retornar nenhuma linha, a publicação não existe (problema grave)

-- 4. Verificar todas as tabelas na publicação supabase_realtime
SELECT 
  pubname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Deve retornar pelo menos: messages, conversations, contacts

-- 5. Verificar permissões RLS na tabela messages
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- Verifique se há políticas RLS que podem estar bloqueando o Realtime

-- 6. Verificar se há triggers na tabela messages que podem interferir
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'messages';

-- ============================================
-- SOLUÇÃO RÁPIDA:
-- ============================================
-- Se o Realtime não estiver habilitado, execute:

-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER TABLE messages REPLICA IDENTITY FULL;

-- Ou execute o script completo:
-- supabase/enable-realtime-all.sql

-- ============================================
-- VERIFICAÇÃO DE CONECTIVIDADE:
-- ============================================
-- Para verificar se o Supabase Realtime está acessível:
-- 1. Acesse o Dashboard do Supabase
-- 2. Vá em Settings > API
-- 3. Verifique se "Realtime" está habilitado
-- 4. Verifique a URL do Realtime (geralmente: wss://[project].supabase.co/realtime/v1)

-- ============================================
-- PROBLEMAS COMUNS:
-- ============================================
-- 1. Realtime não habilitado no projeto Supabase
--    Solução: Habilite no Dashboard > Settings > API > Realtime
--
-- 2. Tabela não está na publicação
--    Solução: Execute ALTER PUBLICATION supabase_realtime ADD TABLE messages;
--
-- 3. REPLICA IDENTITY não está FULL
--    Solução: Execute ALTER TABLE messages REPLICA IDENTITY FULL;
--
-- 4. Problemas de RLS bloqueando subscriptions
--    Solução: Verifique as políticas RLS e garanta que o usuário tem permissão SELECT
--
-- 5. Problemas de rede/firewall
--    Solução: Verifique se conexões WebSocket (wss://) estão permitidas
