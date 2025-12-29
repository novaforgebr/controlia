-- ============================================
-- VERIFICAÇÃO RÁPIDA DE REALTIME
-- ============================================
-- Execute este script para verificar se o Realtime está habilitado
-- ============================================

-- 1. Verificar se as tabelas estão na publicação supabase_realtime
SELECT 
  'Publicação' as tipo_verificacao,
  pubname,
  tablename,
  CASE 
    WHEN tablename IS NOT NULL THEN '✅ Habilitado'
    ELSE '❌ Não habilitado'
  END as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations', 'contacts')
ORDER BY tablename;

-- Resultado esperado: 3 linhas com status "✅ Habilitado"
-- Se retornar menos de 3 linhas ou nenhuma, execute: supabase/enable-realtime-all.sql

-- 2. Verificar REPLICA IDENTITY de cada tabela
SELECT 
  'REPLICA IDENTITY' as tipo_verificacao,
  n.nspname as schema,
  c.relname as tabela,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('messages', 'conversations', 'contacts')
  AND n.nspname = 'public'
ORDER BY c.relname;

-- Resultado esperado: Todas as tabelas devem ter 'FULL ✅'
-- Se alguma não tiver 'FULL', execute: ALTER TABLE [nome_tabela] REPLICA IDENTITY FULL;

-- 3. Verificar se a publicação existe
SELECT 
  'Publicação Existe' as tipo_verificacao,
  pubname,
  CASE 
    WHEN pubname IS NOT NULL THEN '✅ Publicação existe'
    ELSE '❌ Publicação não existe'
  END as status
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Resultado esperado: 1 linha com status "✅ Publicação existe"

