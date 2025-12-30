-- Script para verificar detalhes do evento de calendário
-- Execute este script no Supabase SQL Editor

-- Ver todos os dados do evento scheduled
SELECT 
  id,
  title,
  start_at,
  end_at,
  status,
  company_id,
  contact_id,
  created_at,
  -- Verificar se está no período especificado
  start_at >= '2025-12-30T00:00:00Z' as start_in_period,
  end_at <= '2025-12-31T23:59:59Z' as end_in_period,
  -- Verificar o intervalo completo
  start_at >= '2025-12-30T00:00:00Z' AND end_at <= '2025-12-31T23:59:59Z' as full_period_match,
  -- Verificar se há sobreposição (melhor forma de verificar)
  (start_at <= '2025-12-31T23:59:59Z' AND end_at >= '2025-12-30T00:00:00Z') as overlaps_period
FROM calendar_events
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND status = 'scheduled'
ORDER BY start_at DESC;

