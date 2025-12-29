-- Script para atualizar o campo "Data de Agendamento" de 'date' para 'datetime'
-- ID do campo: 2e360c31-a678-4d34-b855-117b9d2153f6
-- Nome: data_agendamento

-- Atualizar o tipo do campo de 'date' para 'datetime'
UPDATE contact_custom_fields
SET 
  field_type = 'datetime',
  updated_at = NOW()
WHERE id = '2e360c31-a678-4d34-b855-117b9d2153f6'
  AND field_key = 'data_agendamento'
  AND field_type = 'date';

-- Verificar se a atualização foi bem-sucedida
SELECT 
  id,
  field_key,
  field_label,
  field_type,
  updated_at
FROM contact_custom_fields
WHERE id = '2e360c31-a678-4d34-b855-117b9d2153f6';

