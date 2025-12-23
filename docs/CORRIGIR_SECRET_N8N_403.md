# 🔧 Corrigir: Erro 403 "Provided secret is not valid" do n8n

## 🔍 Problema Identificado

O n8n está retornando erro **403 Forbidden** com a mensagem `"Provided secret is not valid"`, mesmo com o secret sendo enviado nos headers.

**Logs mostram:**
```
🔐 Secret não na URL - usando Header Auth
🔐 Secret enviado como headers HTTP: X-Webhook-Secret, X-n8n-Webhook-Secret
Headers: {
  "X-Webhook-Secret": "N0v4F0rg3@2025",
  "X-n8n-Webhook-Secret": "N0v4F0rg3@2025"
}
Status: 403 Forbidden
Resposta: {"message":"Provided secret is not valid"}
```

## ✅ Soluções Possíveis

### Solução 1: Verificar o Secret no n8n

1. **Acesse seu n8n** (https://controlia.up.railway.app)
2. **Abra o workflow** com ID `EW96u6Ji0AqtS7up`
3. **Clique no nó "Webhook"** (não "Telegram Trigger")
4. **Verifique a configuração de autenticação:**
   - Se estiver usando **"Header Auth"**:
     - Verifique o **nome do header** configurado (ex: `X-Webhook-Secret`, `webhook-secret`, `secret`)
     - Verifique o **valor do secret** configurado
   - Se estiver usando **"None"**:
     - O secret deve estar na URL como query parameter: `?secret=xxx`

### Solução 2: Verificar o Secret no Controlia

Execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as n8n_webhook_secret_configurado
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Verifique:**
- ✅ O secret está configurado?
- ✅ O valor corresponde exatamente ao secret configurado no n8n?
- ✅ Não há espaços extras ou caracteres invisíveis?

### Solução 3: Usar Query Parameter em vez de Header

Se o n8n estiver configurado para usar query parameter:

1. **No n8n:** Configure o webhook para usar **"None"** como autenticação
2. **No Controlia:** Adicione o secret na URL da automação:

```sql
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

**Importante:** Se usar query parameter, o código do Controlia detectará automaticamente e não enviará headers.

### Solução 4: Verificar Nome do Header no n8n

O n8n pode estar esperando um nome de header diferente. Verifique no n8n qual nome está configurado e ajuste:

**Nomes comuns:**
- `X-Webhook-Secret`
- `webhook-secret`
- `secret`
- `X-n8n-Webhook-Secret`
- `Authorization` (com Bearer token)

O código do Controlia agora envia **todos esses headers** para garantir compatibilidade.

### Solução 5: Desabilitar Autenticação Temporariamente (NÃO RECOMENDADO)

**⚠️ Apenas para teste!** Não use em produção:

1. **No n8n:** Configure o webhook para usar **"None"** como autenticação
2. **No Controlia:** Remova o secret da URL:

```sql
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

## 🔍 Passos para Diagnosticar

### Passo 1: Verificar Configuração no n8n

1. Acesse: https://controlia.up.railway.app
2. Abra o workflow `EW96u6Ji0AqtS7up`
3. Clique no nó **"Webhook"** (não "Telegram Trigger")
4. Anote:
   - **Tipo de autenticação:** Header Auth / Basic Auth / None
   - **Nome do header** (se Header Auth)
   - **Valor do secret**

### Passo 2: Verificar Secret no Controlia

Execute:

```sql
SELECT 
  settings->>'n8n_webhook_secret' as secret_no_controlia
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

### Passo 3: Comparar

- ✅ Os valores são **exatamente iguais**?
- ✅ Não há espaços extras?
- ✅ Não há diferenças de maiúsculas/minúsculas?

### Passo 4: Testar

1. **Envie uma mensagem no Telegram**
2. **Verifique os logs da Vercel:**
   - Deve mostrar todos os headers enviados
   - Deve mostrar o valor do secret (primeiros 5 caracteres)
3. **Verifique os logs do n8n** (se disponível)
   - Deve mostrar qual header foi recebido
   - Deve mostrar qual valor foi recebido

## 🎯 Solução Recomendada

**Baseado nos logs, recomendo:**

1. **Verificar no n8n** qual nome de header está configurado
2. **Se for diferente de `X-Webhook-Secret`**, atualize o código para usar o nome correto OU configure o n8n para aceitar `X-Webhook-Secret`
3. **Verificar se o valor do secret** no Controlia corresponde exatamente ao valor no n8n

**Alternativamente**, se preferir usar query parameter:

```sql
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

E configure o n8n para usar **"None"** como autenticação.

## 📋 Checklist

- [ ] Verificado tipo de autenticação no n8n (Header Auth / None)
- [ ] Verificado nome do header no n8n (se Header Auth)
- [ ] Verificado valor do secret no n8n
- [ ] Verificado valor do secret no Controlia (SQL)
- [ ] Valores correspondem exatamente?
- [ ] Testado enviando mensagem no Telegram
- [ ] Verificado logs da Vercel (headers enviados)
- [ ] Verificado logs do n8n (se disponível)

