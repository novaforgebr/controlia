-- ============================================
-- Script para garantir que service role pode inserir mensagens
-- ============================================

-- Verificar políticas RLS atuais
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS cmd,
  polroles AS roles
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- Criar política que permite service role inserir mensagens
-- (service role já bypassa RLS, mas vamos garantir)
-- Na verdade, service role já bypassa RLS automaticamente, então não precisa de política específica

-- Verificar se há políticas que podem estar bloqueando
-- Se houver políticas muito restritivas, podemos ajustar

-- Verificar se RLS está habilitado
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'messages';

-- IMPORTANTE: Service role (SUPABASE_SERVICE_ROLE_KEY) já bypassa RLS automaticamente
-- Se as mensagens não estão sendo salvas, o problema não é RLS
-- Pode ser:
-- 1. Erro na inserção (verificar logs)
-- 2. Campos obrigatórios faltando
-- 3. Foreign key constraints
-- 4. Problema com o código do webhook

-- Para testar se service role funciona, execute como superuser:
-- (Isso só funciona se você tiver acesso de superuser)
/*
SET ROLE service_role;
INSERT INTO messages (
  company_id,
  conversation_id,
  contact_id,
  content,
  content_type,
  direction,
  sender_type,
  status
) VALUES (
  'cae292bd-2cc7-42b9-9254-779ed011989e',
  'dd17b2bf-6c3f-42b8-bb81-1c85dac8829c',
  '493fcd71-78e2-44d2-82aa-f2a8b13f4566',
  'Teste service role',
  'text',
  'inbound',
  'human',
  'delivered'
)
RETURNING id;
RESET ROLE;
*/

