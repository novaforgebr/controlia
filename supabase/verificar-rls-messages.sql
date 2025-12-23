-- ============================================
-- Script para verificar políticas RLS da tabela messages
-- ============================================

-- Verificar políticas RLS para messages
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS cmd,
  polroles AS roles,
  qual,
  with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- Verificar se RLS está habilitado
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'messages';

