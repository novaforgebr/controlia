-- Script para garantir que o service role pode acessar companies
-- O service role deveria bypassar RLS automaticamente, mas vamos criar uma função helper
-- para garantir acesso quando necessário

-- Função para buscar empresa por ID (bypassa RLS para service role)
CREATE OR REPLACE FUNCTION get_company_by_id(company_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  is_active BOOLEAN,
  slug VARCHAR(100),
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.is_active,
    c.slug,
    c.created_at
  FROM companies c
  WHERE c.id = company_uuid;
END;
$$;

-- Garantir que a função é executável por service role
GRANT EXECUTE ON FUNCTION get_company_by_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_company_by_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_company_by_id(UUID) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION get_company_by_id(UUID) IS 'Busca empresa por ID, bypassando RLS. Usada por service role client em APIs externas.';


