-- Script para verificar eventos de calendário
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela calendar_events existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'calendar_events'
) as table_exists;

-- Se a tabela existir, verificar eventos para a empresa
SELECT 
  id,
  title,
  start_at,
  end_at,
  status,
  company_id,
  contact_id,
  created_at
FROM calendar_events
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
ORDER BY start_at DESC
LIMIT 10;

-- Contar eventos por status
SELECT 
  status,
  COUNT(*) as count
FROM calendar_events
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
GROUP BY status;

-- Verificar eventos no período específico (30-31 dez 2025)
SELECT 
  id,
  title,
  start_at,
  end_at,
  status
FROM calendar_events
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND status = 'scheduled'
  AND start_at >= '2025-12-30T00:00:00Z'
  AND end_at <= '2025-12-31T23:59:59Z'
ORDER BY start_at;

