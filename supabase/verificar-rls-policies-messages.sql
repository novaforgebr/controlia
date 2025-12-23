-- ============================================
-- Script para verificar políticas RLS da tabela messages
-- ============================================

-- 1. Verificar todas as políticas RLS para messages
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual,
  pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- 2. Verificar se RLS está habilitado
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'messages';

-- 3. Verificar se há política que permite SELECT para authenticated
-- polroles é um array de OIDs, não strings, então verificamos pelo OID do role 'authenticated'
SELECT 
  polname,
  polcmd,
  polroles,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
  AND polcmd = 'SELECT'
  AND (SELECT oid FROM pg_roles WHERE rolname = 'authenticated') = ANY(polroles);

-- 4. Verificar mensagens recentes e seus company_id
SELECT 
  m.id,
  m.company_id,
  m.direction,
  m.sender_type,
  m.created_at,
  c.company_id as conversation_company_id,
  ct.company_id as contact_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;

