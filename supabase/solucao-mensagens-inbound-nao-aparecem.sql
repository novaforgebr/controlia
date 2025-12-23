-- ============================================
-- SOLUÇÃO COMPLETA: Mensagens inbound não aparecem na plataforma
-- ============================================

-- PROBLEMA IDENTIFICADO:
-- As mensagens inbound podem estar sendo salvas com company_id diferente
-- do company_id da conversa/contato, ou com company_id NULL, o que faz
-- com que a política RLS bloqueie a leitura pelo frontend.

-- SOLUÇÃO:
-- 1. Garantir que mensagens inbound sempre tenham o mesmo company_id da conversa
-- 2. Corrigir mensagens existentes que estão inconsistentes
-- 3. Adicionar trigger para garantir consistência futura

-- ============================================
-- PASSO 1: Corrigir mensagens inbound existentes
-- ============================================

-- Atualizar mensagens inbound que têm company_id diferente da conversa
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id IS DISTINCT FROM c.company_id
  AND m.direction = 'inbound'
  AND m.sender_type = 'human';

-- Atualizar mensagens inbound que têm company_id NULL
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id IS NULL
  AND c.company_id IS NOT NULL
  AND m.direction = 'inbound'
  AND m.sender_type = 'human';

-- ============================================
-- PASSO 2: Criar trigger para garantir consistência futura
-- ============================================

-- Função que garante que company_id da mensagem seja igual ao da conversa
CREATE OR REPLACE FUNCTION ensure_message_company_id_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Se company_id não foi fornecido ou é diferente da conversa, usar o da conversa
  IF NEW.company_id IS NULL OR NEW.company_id IS DISTINCT FROM (
    SELECT company_id FROM conversations WHERE id = NEW.conversation_id
  ) THEN
    SELECT company_id INTO NEW.company_id
    FROM conversations
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se existir
DROP TRIGGER IF EXISTS trigger_ensure_message_company_id_consistency ON messages;

-- Criar trigger antes de INSERT
CREATE TRIGGER trigger_ensure_message_company_id_consistency
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_message_company_id_consistency();

-- ============================================
-- PASSO 3: Verificar políticas RLS
-- ============================================

-- Verificar se a política de SELECT permite ler mensagens da empresa do usuário
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
  AND polcmd = 'SELECT'
ORDER BY polname;

-- Se não houver política de SELECT adequada, criar:
-- (A política já deve existir, mas vamos garantir)

DO $$
BEGIN
  -- Verificar se já existe política de SELECT com este nome
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid::regclass::text = 'messages' 
    AND polcmd = 'SELECT'
    AND polname = 'Users can view messages of their companies or without company'
  ) THEN
    -- Criar política de SELECT
    EXECUTE 'CREATE POLICY "Users can view messages of their companies or without company"
      ON messages FOR SELECT
      TO authenticated
      USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
      )';
  ELSE
    RAISE NOTICE 'Política RLS já existe, pulando criação.';
  END IF;
END $$;

-- ============================================
-- PASSO 4: Verificar resultado
-- ============================================

-- Verificar mensagens inbound recentes e seus company_id
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL AND c.company_id IS NULL THEN '⚠️ Ambos NULL'
    WHEN m.company_id IS NULL THEN '❌ Mensagem NULL, conversa tem company_id'
    ELSE '❌ Diferente'
  END as status_consistencia,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- ============================================
-- RESUMO
-- ============================================

SELECT 
  '✅ Correção aplicada' as status,
  COUNT(*) as total_mensagens_inbound,
  COUNT(CASE WHEN m.company_id = c.company_id THEN 1 END) as mensagens_consistentes,
  COUNT(CASE WHEN m.company_id IS DISTINCT FROM c.company_id THEN 1 END) as mensagens_inconsistentes
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours';

