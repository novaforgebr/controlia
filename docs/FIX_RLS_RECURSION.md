# Correção: Recursão Infinita em RLS

## Problema

Ao tentar criar uma empresa, ocorria o erro:
```
infinite recursion detected in policy for relation "company_users"
```

## Causa

A política RLS da tabela `company_users` estava causando recursão infinita porque:

1. A política SELECT verificava se o `company_id` estava na lista de empresas do usuário
2. Para fazer isso, consultava a própria tabela `company_users`
3. Isso criava um loop infinito

## Solução

Execute o script `supabase/fix-rls-recursion.sql` no SQL Editor do Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase/fix-rls-recursion.sql`
4. Execute o script

### O que o script faz:

1. **Remove políticas problemáticas** que causam recursão
2. **Cria novas políticas simples**:
   - SELECT: Usuários veem apenas seus próprios registros (`user_id = auth.uid()`)
   - INSERT: Usuários podem criar associações para si mesmos
   - UPDATE: Usuários podem atualizar seus próprios registros
3. **Atualiza a função `user_belongs_to_company`** para usar `SECURITY DEFINER` e evitar recursão

## Após executar o script

O fluxo de criação de empresa deve funcionar normalmente:
1. Usuário cria conta
2. Redireciona para `/setup/company`
3. Cria empresa
4. Sistema associa usuário como admin
5. Redireciona para dashboard

## Verificação

Para verificar se está funcionando:

```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE tablename = 'company_users';

-- Testar inserção (substitua os UUIDs)
INSERT INTO company_users (company_id, user_id, role, is_active)
VALUES ('company-uuid', 'user-uuid', 'admin', true);
```

