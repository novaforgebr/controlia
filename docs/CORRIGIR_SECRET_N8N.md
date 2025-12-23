# 🔐 Corrigir: "Provided secret is not valid"

## 🔍 Problema

O n8n está rejeitando o secret `N0v4F0rg3@2025` com erro:
```
HTTP 403: {"message":"Provided secret is not valid"}
```

Isso significa que o secret configurado no n8n é **diferente** do que está sendo enviado.

## ✅ SOLUÇÃO: Verificar e Corrigir Configuração no n8n

### Passo 1: Verificar Configuração Atual no n8n

1. **Abra o workflow no n8n**
2. **Clique no nó "Webhook"**
3. **Verifique a seção "Authentication":**
   - Qual método está selecionado? (Header Auth, Basic Auth, JWT Auth, None)
   - Se for **Header Auth**, qual é o **Header Name**?
   - Qual é o **Header Value**?

### Passo 2: Verificar Nome do Header

O n8n pode estar esperando um nome de header específico. Verifique:

**Opções comuns:**
- `X-Webhook-Secret`
- `X-n8n-Webhook-Secret`
- `webhook-secret`
- `secret`

**No n8n, o Header Name deve ser EXATAMENTE igual ao que você configurou.**

### Passo 3: Verificar Valor do Secret

O valor do secret no n8n deve ser **EXATAMENTE** igual a `N0v4F0rg3@2025` (sem espaços, case-sensitive).

**Verifique:**
- Não há espaços antes ou depois
- Todos os caracteres estão corretos (maiúsculas/minúsculas)
- Não há caracteres especiais diferentes

### Passo 4: Testar com Diferentes Configurações

#### Opção A: Usar Query Parameter (Mais Simples)

Se o Header Auth não funcionar, use query parameter:

1. **No n8n:**
   - Selecione **"None"** em Authentication
   - O secret será validado via query parameter na URL

2. **No Controlia:**
   - A URL já tem o secret: `?secret=N0v4F0rg3@2025`
   - Isso deve funcionar automaticamente

3. **Teste:**
```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456,
    "message": {
      "message_id": 999,
      "from": {"id": 7772641515, "is_bot": false, "first_name": "Teste"},
      "chat": {"id": 7772641515, "type": "private"},
      "date": 1234567890,
      "text": "Teste"
    }
  }'
```

**Se funcionar:** O problema era o Header Auth. Use query parameter.

#### Opção B: Corrigir Header Auth

Se quiser usar Header Auth:

1. **No n8n, configure:**
   - Authentication: **Header Auth**
   - Header Name: `X-Webhook-Secret` (ou `X-n8n-Webhook-Secret`)
   - Header Value: `N0v4F0rg3@2025` (exatamente assim)

2. **Verifique se o Controlia está enviando o header correto:**
   - O código já envia: `X-Webhook-Secret` e `X-n8n-Webhook-Secret`
   - Verifique os logs da Vercel para ver quais headers estão sendo enviados

3. **Teste:**
```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: N0v4F0rg3@2025" \
  -d '{
    "update_id": 123456,
    "message": {
      "message_id": 999,
      "from": {"id": 7772641515, "is_bot": false, "first_name": "Teste"},
      "chat": {"id": 7772641515, "type": "private"},
      "date": 1234567890,
      "text": "Teste"
    }
  }'
```

**Se funcionar:** O problema era o nome do header ou o valor.

### Passo 5: Verificar se o Webhook Aceita Secret

Alguns webhooks do n8n podem não ter autenticação configurada. Verifique:

1. **No nó Webhook do n8n:**
   - Se Authentication estiver como **"None"**, o webhook não valida secret
   - Nesse caso, remova o secret da URL e das settings

2. **Se Authentication for "None":**
   - Remova `?secret=...` da URL da automação:
   ```sql
   UPDATE automations
   SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook'
   WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
   ```

### Passo 6: Verificar Logs do n8n

1. **No n8n, vá em Executions**
2. **Procure por execuções recentes do webhook**
3. **Veja se há erros de autenticação**
4. **Verifique qual secret o n8n está esperando**

## 🔧 Solução Rápida (Recomendada)

**Use Query Parameter em vez de Header Auth:**

1. **No n8n:**
   - Configure Authentication como **"None"**
   - O n8n validará o secret via query parameter automaticamente

2. **No Controlia:**
   - A URL já tem o secret: `?secret=N0v4F0rg3@2025`
   - Não precisa fazer nada

3. **Teste novamente:**
   - Envie uma mensagem no Telegram
   - Verifique os logs da Vercel
   - Deve funcionar!

## 📋 Checklist de Verificação

- [ ] Secret no n8n é exatamente `N0v4F0rg3@2025` (sem espaços)
- [ ] Nome do header no n8n corresponde ao enviado (`X-Webhook-Secret` ou `X-n8n-Webhook-Secret`)
- [ ] Teste com curl funcionou (sem erro 403)
- [ ] Workflow está ativo no n8n
- [ ] URL do webhook está correta

## 🎯 Próximos Passos

1. **Teste com Authentication "None"** (mais simples)
2. **Se não funcionar, verifique o secret no n8n** (pode estar diferente)
3. **Se ainda não funcionar, copie a configuração exata do n8n** (screenshot ou valores)

## ❓ Se Nada Funcionar

1. **No n8n, desabilite completamente a autenticação:**
   - Authentication: **None**
   - Remova o secret da URL da automação

2. **Teste sem secret:**
```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Se funcionar:** O problema é a autenticação. Configure corretamente ou desabilite.

