-- Script para verificar se a empresa existe no banco de dados
-- Execute este script no Supabase SQL Editor

-- Verificar se a empresa específica existe
SELECT 
  id,
  name,
  is_active,
  created_at,
  updated_at
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

-- Se não encontrar, listar todas as empresas (primeiras 10)
SELECT 
  id,
  name,
  is_active,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- Verificar o formato do ID
SELECT 
  id,
  name,
  length(id::text) as id_length,
  id::text = 'cae292bd-2cc7-42b9-9254-779ed011989e' as exact_match
FROM companies
WHERE id::text LIKE '%cae292bd-2cc7-42b9-9254-779ed011989e%'
OR id::text LIKE '%cae292bd%';


