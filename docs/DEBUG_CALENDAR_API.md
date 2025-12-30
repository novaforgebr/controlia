# Debug da API de Calendário

## Problema: "Empresa não encontrada"

### Verificações Implementadas (Atualizadas)

1. **Extração de `company_id` de múltiplas fontes**:
   - Query parameter: `?company_id=...`
   - Header: `x-company-id` (case-insensitive)
   - Header: `X-Company-Id`
   - Header: `X-COMPANY-ID`

2. **Normalização avançada**:
   - Trim de espaços
   - Remoção de quebras de linha (`\n`, `\r`, `\t`)
   - Remoção de todos os espaços
   - Validação de formato UUID (regex)
   - Detecção de expressões do n8n não resolvidas (`{{` ou `$(`)

3. **Logs detalhados melhorados**:
   - Log do `company_id` extraído de cada fonte
   - Log do ID original e normalizado (com JSON.stringify para ver caracteres invisíveis)
   - Log de todos os headers recebidos
   - Log do resultado da query no banco (com status e statusText)
   - Log de teste de acesso à tabela companies
   - Log das primeiras 10 empresas encontradas (para debug)
   - Validação de formato UUID antes da query

### Como Verificar os Logs no Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Functions** → **View Function Logs**
3. Execute a requisição novamente no n8n
4. Procure por logs que começam com:
   - 🔍 (debug)
   - ✅ (sucesso)
   - ❌ (erro)
   - ⚠️ (aviso)

### Possíveis Causas do Erro

1. **Empresa não existe no banco**:
   - Verifique se o `company_id` `cae292bd-2cc7-42b9-9254-779ed011989e` existe na tabela `companies` do Supabase
   - Execute a query: `SELECT id, name, is_active FROM companies WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e'`
   - Os logs agora mostram as primeiras 10 empresas encontradas para comparação

2. **Formato UUID inválido**:
   - Verifique se o UUID está no formato correto (36 caracteres com hífens)
   - Caracteres invisíveis ou espaços extras podem causar problemas
   - Os logs mostram o ID original e normalizado para comparação

3. **Header não está sendo enviado corretamente**:
   - Verifique nos logs se o header `x-company-id` está sendo recebido
   - O n8n pode não estar resolvendo a expressão `{{ $('Webhook').first().json.body.controlia.company_id }}`
   - Expressões não resolvidas são detectadas automaticamente e retornam erro

4. **Variável de ambiente não configurada ou incorreta**:
   - Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada no Vercel
   - A key deve começar com `eyJ...` (é um JWT)
   - Deve ser a **service_role** key, não a **anon** key
   - Verifique se não há espaços extras no início ou fim da variável

5. **Problema com RLS (Row Level Security)**:
   - O service role client deve bypassar RLS automaticamente
   - Se os logs mostrarem erro relacionado a "permission" ou "policy", pode ser problema de configuração
   - Verifique se a service role key está correta e se o redeploy foi feito após alterá-la

### Teste Manual

Você pode testar a API diretamente com curl:

```bash
curl -X GET "https://controliaa.vercel.app/api/calendar/events?start=2025-12-30T00:00:00Z&end=2025-12-31T23:59:59Z&status=scheduled&company_id=cae292bd-2cc7-42b9-9254-779ed011989e" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "x-company-id: cae292bd-2cc7-42b9-9254-779ed011989e"
```

### Próximos Passos

1. **Verificar os logs no Vercel após executar a requisição**
   - Procure por logs que começam com 🔍, ✅, ❌
   - Verifique se o `company_id` está sendo recebido corretamente
   - Verifique se o service role client está sendo criado
   - Verifique o resultado da query de teste de acesso

2. **Verificar se a empresa existe no Supabase**
   - Execute o script `scripts/test-company-query.sql` no Supabase SQL Editor
   - Verifique se o ID `cae292bd-2cc7-42b9-9254-779ed011989e` existe

3. **Verificar variável de ambiente no Vercel**
   - Acesse: Settings → Environment Variables
   - Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
   - Verifique se o valor está correto (deve começar com `eyJ...`)

4. **Verificar se o service role key está correto**
   - No Supabase Dashboard: Settings → API
   - Copie o `service_role` key (não o `anon` key)
   - Compare com o valor no Vercel

5. **Testar acesso direto ao banco**
   - Os logs agora mostram um teste de acesso à tabela companies
   - Se esse teste falhar, o problema é com o service role key ou conexão
   - Os logs também mostram as primeiras 10 empresas encontradas para comparação

6. **Verificar formato do UUID nos logs**
   - Os logs mostram o ID original e normalizado usando JSON.stringify
   - Isso ajuda a identificar caracteres invisíveis ou problemas de formatação
   - Compare o ID normalizado com o ID real no banco de dados

### Possível Causa: Service Role Key

O service role client deve bypassar RLS automaticamente. Se não estiver funcionando:

1. Verifique se a key está correta no Vercel
2. Verifique se não há espaços extras na variável de ambiente
3. Faça redeploy após alterar variáveis de ambiente

## Solução para "Empresa não encontrada" mesmo existindo no banco

Se você confirmou que a empresa existe no banco (através do script `test-company-exists.sql`), mas ainda recebe "empresa não encontrada", o problema provavelmente é que o **service role client não está bypassando o RLS corretamente**.

### Solução: Executar função SQL no Supabase

1. **Execute o script SQL no Supabase SQL Editor:**
   - Arquivo: `supabase/fix-company-service-role-access.sql`
   - Isso cria uma função RPC que bypassa RLS garantidamente

2. **Após executar o script, teste novamente o curl**

A função `get_company_by_id` usa `SECURITY DEFINER`, o que garante que ela executa com privilégios elevados e bypassa RLS completamente.

### Melhorias Implementadas (Última Atualização)

Foram implementadas várias melhorias para ajudar no diagnóstico do problema:

1. **Validação de UUID**:
   - Verificação de formato UUID usando regex antes de executar a query
   - Retorna erro claro se o formato for inválido

2. **Normalização melhorada**:
   - Remoção completa de espaços, quebras de linha e caracteres invisíveis
   - Detecção automática de expressões do n8n não resolvidas

3. **Logs aprimorados**:
   - ID original vs normalizado (usando JSON.stringify para ver caracteres invisíveis)
   - Resultado completo da query (status, statusText, data, error)
   - Lista das primeiras 10 empresas encontradas para comparação
   - Teste de acesso à tabela antes de buscar a empresa específica

4. **Tratamento de erros**:
   - Detecção específica de erros relacionados a RLS/permissões
   - Mensagens de erro mais descritivas
   - Tentativa de buscar todas as empresas quando uma específica não é encontrada (para debug)

### O que fazer agora

1. **Execute o curl novamente** e verifique os logs no Vercel:
   ```bash
   curl -X GET "https://controliaa.vercel.app/api/calendar/events?start=2025-12-30T00:00:00Z&end=2025-12-31T23:59:59Z&status=scheduled&company_id=cae292bd-2cc7-42b9-9254-779ed011989e" \
     -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
     -H "x-company-id: cae292bd-2cc7-42b9-9254-779ed011989e"
   ```

2. **No Vercel Dashboard, vá para:**
   - Deployments → Selecione o deployment mais recente
   - Clique em "Functions" → Encontre `/api/calendar/events`
   - Clique em "View Function Logs"
   - Procure pelos logs com emojis: 🔍, ✅, ❌, ⚠️

3. **Procure pelos seguintes logs importantes:**
   - `🔍 ID original:` - Mostra o ID recebido
   - `🔍 ID normalizado:` - Mostra o ID após normalização
   - `🔍 UUID válido:` - Deve ser `true`
   - `🔍 Teste de acesso à tabela companies:` - Deve mostrar acesso OK
   - `🔍 Query maybeSingle resultado:` - Mostra o resultado da busca
   - `🔍 Debug - Primeiras 10 empresas no banco:` - Lista empresas encontradas
   - `❌ Empresa não encontrada` - Se aparecer, verifique o ID

4. **Verifique o banco de dados:**
   - Execute o script `supabase/test-company-exists.sql` no Supabase SQL Editor
   - Isso verificará se a empresa existe e mostrará outras empresas para comparação

5. **Verifique a service role key:**
   - No Vercel: Settings → Environment Variables
   - Procure por `SUPABASE_SERVICE_ROLE_KEY`
   - Deve começar com `eyJ...` (é um JWT)
   - Copie do Supabase Dashboard: Settings → API → service_role key (NÃO a anon key)

6. **Se a empresa não for encontrada, mas existir no banco:**
   - Verifique se o ID nos logs corresponde exatamente ao ID no banco
   - Pode haver diferenças de case ou caracteres invisíveis
   - Os logs agora mostram o ID com `JSON.stringify` para revelar caracteres invisíveis

