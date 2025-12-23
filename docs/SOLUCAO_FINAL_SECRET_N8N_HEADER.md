# ✅ Solução Final: Secret do n8n com Header Auth

## 🔍 Problema Identificado

O n8n está configurado para aceitar:
- **Header Name:** `X-Webhook-Secret`
- **Header Value:** `N0v4F0rg3@2025`

O Controlia está enviando o secret corretamente, mas ainda recebe erro 403.

## ✅ Solução Implementada

### 1. Código Atualizado

O código agora envia **APENAS** o header `X-Webhook-Secret` (conforme configurado no n8n) e inclui logs detalhados para debug:

```typescript
headers['X-Webhook-Secret'] = n8nWebhookSecret
console.log('🔐 Secret enviado como header HTTP: X-Webhook-Secret')
console.log('🔐 Valor do secret completo:', n8nWebhookSecret)
console.log('🔐 Tamanho do secret:', n8nWebhookSecret.length, 'caracteres')
console.log('🔐 Secret em bytes (para verificar encoding):', Buffer.from(n8nWebhookSecret).toString('hex'))
```

### 2. Verificação do Secret

Execute o script `supabase/verificar-secret-correto.sql` para verificar:
- ✅ Valor do secret no Controlia
- ✅ Tamanho do secret
- ✅ Encoding (hex)
- ✅ Comparação entre diferentes fontes

### 3. Logs Detalhados

Após enviar uma mensagem no Telegram, verifique os logs da Vercel. Você deve ver:

```
🔐 Secret não na URL - usando Header Auth
🔐 Secret enviado como header HTTP: X-Webhook-Secret
🔐 Valor do secret completo: N0v4F0rg3@2025
🔐 Tamanho do secret: 14 caracteres
🔐 Secret em bytes (para verificar encoding): 4e30763446307267334032303235
```

## 🔍 Diagnóstico

### Passo 1: Verificar Secret no Controlia

Execute:

```sql
SELECT 
  settings->>'n8n_webhook_secret' as secret_no_controlia,
  LENGTH(settings->>'n8n_webhook_secret') as tamanho
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Deve retornar:**
- `secret_no_controlia`: `N0v4F0rg3@2025`
- `tamanho`: `14`

### Passo 2: Verificar Configuração no n8n

1. Acesse: https://controlia.up.railway.app
2. Abra o workflow `EW96u6Ji0AqtS7up`
3. Clique no nó **"Webhook"**
4. Verifique:
   - **Tipo de autenticação:** Header Auth
   - **Name:** `X-Webhook-Secret`
   - **Value:** `N0v4F0rg3@2025`

### Passo 3: Testar Envio

1. **Envie uma mensagem no Telegram**
2. **Verifique os logs da Vercel:**
   - Deve mostrar o valor completo do secret
   - Deve mostrar o tamanho (14 caracteres)
   - Deve mostrar o encoding em hex

3. **Verifique a resposta do n8n:**
   - Se ainda der 403, compare o valor do secret nos logs com o valor no n8n
   - Verifique se há diferenças de encoding ou caracteres invisíveis

## 🎯 Solução Alternativa: Query Parameter

Se o Header Auth continuar falhando, você pode usar query parameter:

### Passo 1: Atualizar Automação

Execute:

```sql
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

### Passo 2: Configurar n8n

1. **No n8n:** Configure o webhook para usar **"None"** como autenticação
2. **Remova o Header Auth** do webhook

### Passo 3: Testar

O código detectará automaticamente o secret na URL e não enviará headers.

## 📋 Checklist

- [ ] Secret no Controlia: `N0v4F0rg3@2025` (14 caracteres)
- [ ] Secret no n8n: `N0v4F0rg3@2025` (14 caracteres)
- [ ] Header Name no n8n: `X-Webhook-Secret`
- [ ] Código atualizado (enviando apenas `X-Webhook-Secret`)
- [ ] Logs da Vercel mostram o valor completo do secret
- [ ] Testado enviando mensagem no Telegram
- [ ] Verificado resposta do n8n (200 OK ou 403)

## ⚠️ Problemas Comuns

### Problema 1: Caracteres Especiais

O secret contém `@` que pode causar problemas em URLs. Se usar query parameter, certifique-se de fazer URL encoding:

```sql
-- URL encoding de N0v4F0rg3@2025 = N0v4F0rg3%402025
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3%402025'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

### Problema 2: Espaços Extras

Verifique se não há espaços extras no secret:

```sql
SELECT 
  settings->>'n8n_webhook_secret' as original,
  TRIM(settings->>'n8n_webhook_secret') as sem_espacos,
  LENGTH(settings->>'n8n_webhook_secret') as tamanho_original,
  LENGTH(TRIM(settings->>'n8n_webhook_secret')) as tamanho_sem_espacos
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

### Problema 3: Encoding

O secret pode ter problemas de encoding. Verifique:

```sql
SELECT 
  encode(convert_to(settings->>'n8n_webhook_secret', 'UTF8'), 'hex') as secret_hex
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Valor esperado:** `4e30763446307267334032303235`

## 🎯 Próximos Passos

1. **Execute o código atualizado** (já está no repositório)
2. **Envie uma mensagem no Telegram**
3. **Verifique os logs da Vercel** - deve mostrar o valor completo do secret
4. **Compare com o valor no n8n** - devem ser exatamente iguais
5. **Se ainda der erro 403**, use a solução alternativa com query parameter

