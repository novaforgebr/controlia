-- Script para testar se a empresa existe no banco
-- Execute este script no Supabase SQL Editor

-- Verificar se a empresa existe
SELECT 
  id, 
  name, 
  slug, 
  is_active, 
  created_at 
FROM companies 
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

-- Se não encontrar, listar todas as empresas para ver os IDs disponíveis
SELECT 
  id, 
  name, 
  slug, 
  is_active 
FROM companies 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se há algum problema com o formato do UUID
SELECT 
  id, 
  name,
  LENGTH(id) as id_length,
  id::text as id_text
FROM companies 
WHERE id::text LIKE '%cae292bd%'
LIMIT 5;



