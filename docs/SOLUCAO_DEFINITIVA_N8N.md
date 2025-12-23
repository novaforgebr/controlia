# ✅ Solução Definitiva: Mensagens Não Chegam ao n8n

## 🔍 Problema Identificado

Você tem **2 automações ativas**:
1. ✅ **"Atendimento com IA"** - URL: `...7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025`
2. ⚠️ **"Envia Mensagens do App"** - URL: `...webhook/controlia-message` (sem secret)

O código estava pegando a primeira automação, que pode ser a errada.

## ✅ SOLUÇÃO: Execute Estes Passos na Ordem

### Passo 1: Pausar Automação que Não Deve Ser Usada

Execute no **Supabase SQL Editor**:

```sql
-- Pausar "Envia Mensagens do App" (não é para mensagens do Telegram)
UPDATE automations
SET is_paused = true
WHERE id = 'b48c23e8-b0a8-4a2a-972f-ab02db34c9d5';
```

**Resultado esperado:** Apenas "Atendimento com IA" ficará ativa.

### Passo 2: Verificar Secret nas Settings

Execute no **Supabase SQL Editor**:

```sql
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as secret
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Se o secret for NULL ou vazio:**

1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **"n8n"**, cole: `N0v4F0rg3@2025`
3. Clique em **"Salvar Configurações"**

### Passo 3: Verificar Configuração no n8n

1. Abra o workflow no n8n
2. Clique no nó **"Webhook"**
3. Verifique:
   - ✅ **Authentication**: `Header Auth`
   - ✅ **Header Name**: `X-n8n-Webhook-Secret` (ou `X-Webhook-Secret`)
   - ✅ **Header Value**: `N0v4F0rg3@2025`
   - ✅ Workflow está **ativo** (toggle no canto superior direito)

### Passo 4: Testar Webhook Manualmente

Execute no terminal:

```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025" \
  -H "Content-Type: application/json" \
  -H "X-n8n-Webhook-Secret: N0v4F0rg3@2025" \
  -d '{
    "update_id": 999999,
    "message": {
      "message_id": 999,
      "from": {"id": 7772641515, "is_bot": false, "first_name": "Teste"},
      "chat": {"id": 7772641515, "type": "private"},
      "date": 1234567890,
      "text": "Teste manual"
    },
    "controlia": {
      "company_id": "cae292bd-2cc7-42b9-9254-779ed011989e",
      "channel": "telegram"
    }
  }'
```

**Se retornar erro 401:**
- ❌ Secret incorreto no n8n
- ❌ Nome do header incorreto

**Se retornar 200 ou processar:**
- ✅ Webhook está funcionando
- ✅ Problema está no Controlia não enviando

### Passo 5: Fazer Deploy das Correções

O código foi atualizado para:
- ✅ Priorizar automação "Atendimento com IA"
- ✅ Usar automação que tem secret na URL
- ✅ Adicionar logs detalhados

**Faça deploy na Vercel:**
1. Commit as alterações
2. Push para o repositório
3. Aguarde deploy automático

### Passo 6: Testar com Mensagem Real

1. **Envie uma mensagem no Telegram** para o bot
2. **Acesse logs da Vercel:**
   - Dashboard Vercel > Functions > `/api/webhooks/telegram` > Logs
3. **Procure por:**
   ```
   🎯 Automação selecionada: {
     id: "49666eb5-d6ca-45f6-9944-9c58354ad6aa",
     name: "Atendimento com IA",
     url: "https://controlia.up.railway.app/webhook/7ab5d664..."
   }
   📤 Enviando para n8n:
      URL: https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=...
   ```

**Se aparecer:**
- ✅ `🎯 Automação selecionada` com "Atendimento com IA" → Correto!
- ✅ `✅ Mensagem enviada para n8n com sucesso` → Funcionou!

**Se aparecer erro:**
- ❌ Copie o erro completo dos logs
- ❌ Verifique se o secret está correto
- ❌ Verifique se o workflow está ativo no n8n

### Passo 7: Verificar no n8n

1. Abra o workflow no n8n
2. Vá em **Executions** (execuções)
3. Procure por execuções recentes
4. Se houver execução, o problema foi resolvido! ✅

## 🔧 Se Ainda Não Funcionar

### Verificar Logs de Automação

Execute no Supabase SQL Editor:

```sql
SELECT 
  al.id,
  al.status,
  al.error_message,
  al.started_at,
  a.name as automation_name
FROM automation_logs al
JOIN automations a ON a.id = al.automation_id
WHERE al.started_at > NOW() - INTERVAL '1 hour'
ORDER BY al.started_at DESC
LIMIT 10;
```

**Se houver logs com erro:**
- Copie a mensagem de erro
- Verifique o que está falhando

### Verificar Ordem das Automações

O código agora prioriza:
1. Automação com nome contendo "IA" ou "Atendimento"
2. Automação com secret na URL
3. Primeira automação (fallback)

Se ainda não funcionar, pode ser necessário desativar completamente a automação "Envia Mensagens do App":

```sql
UPDATE automations
SET is_active = false
WHERE id = 'b48c23e8-b0a8-4a2a-972f-ab02db34c9d5';
```

## ✅ Checklist Final

- [ ] Automação "Envia Mensagens do App" está pausada
- [ ] Secret `N0v4F0rg3@2025` configurado no Controlia (Configurações > Integrações > n8n)
- [ ] Secret `N0v4F0rg3@2025` configurado no n8n (Header Auth: `X-n8n-Webhook-Secret`)
- [ ] Workflow ativo no n8n
- [ ] Teste manual (curl) funcionou
- [ ] Deploy feito na Vercel
- [ ] Logs mostram "🎯 Automação selecionada: Atendimento com IA"
- [ ] Logs mostram "✅ Mensagem enviada para n8n com sucesso"
- [ ] Execução aparece no n8n

## 🎉 Pronto!

Após seguir todos os passos, as mensagens devem chegar ao n8n corretamente!

