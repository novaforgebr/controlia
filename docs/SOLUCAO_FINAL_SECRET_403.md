# ✅ Solução Final: Erro 403 "Provided secret is not valid"

## 🔍 Problema Identificado

O n8n está retornando erro **403 Forbidden** mesmo com o secret na URL como query parameter.

**Logs mostram:**
```
🔐 Secret encontrado na URL - usando query parameter
URL: ...?secret=N0v4F0rg3@2025
Status: 403 Forbidden
Resposta: {"message":"Provided secret is not valid"}
```

## 🎯 Causa Raiz

O problema pode ser:

1. **Caractere `@` não codificado:** O caractere `@` no secret (`N0v4F0rg3@2025`) precisa ser codificado como `%40` na URL
2. **n8n configurado para Header Auth:** Mesmo com Authentication "None", o n8n pode ter uma validação adicional de secret
3. **Secret não corresponde:** O secret na URL pode não corresponder ao secret configurado no n8n

## ✅ Soluções

### Solução 1: Usar Header Auth (RECOMENDADO)

Esta é a solução mais confiável:

#### Passo 1: Remover Secret da URL

Execute o script `supabase/remover-secret-url-usar-header-auth.sql`:

```sql
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

#### Passo 2: Configurar n8n para Header Auth

1. **Acesse:** https://controlia.up.railway.app
2. **Abra o workflow:** `EW96u6Ji0AqtS7up`
3. **Clique no nó "Webhook"**
4. **Configure:**
   - **Authentication:** `Header Auth`
   - **Name:** `X-Webhook-Secret`
   - **Value:** `N0v4F0rg3@2025`

#### Passo 3: Verificar Secret nas Settings

Certifique-se de que o secret está configurado nas settings da empresa:

```sql
SELECT 
  settings->>'n8n_webhook_secret' as secret_configurado
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Deve retornar:** `N0v4F0rg3@2025`

### Solução 2: Codificar Secret na URL

Se preferir usar query parameter, codifique o `@` como `%40`:

```sql
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3%402025',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

**Nota:** O código agora detecta automaticamente e recodifica o secret se necessário.

### Solução 3: Verificar Configuração do n8n

Na imagem fornecida, vejo que o n8n está configurado com:
- **Authentication:** `None`
- **Path:** `/controlia-message`
- **URL:** `https://controlia.up.railway.app/webhook-test/controlia-message`

**Mas o código está enviando para:**
- **URL:** `https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`

**Verifique:**
- ✅ A URL do webhook está correta?
- ✅ O path está correto?
- ✅ O webhook está ativo no n8n?

## 🔍 Diagnóstico

### Passo 1: Verificar Logs da Vercel

Após enviar uma mensagem, verifique os logs:

```
🔐 Secret encontrado na URL - usando query parameter
URL: ...?secret=N0v4F0rg3@2025
Status: 403 Forbidden
```

**Se aparecer 403:**
- ❌ O secret não está sendo aceito
- ✅ Use Solução 1 (Header Auth)

### Passo 2: Testar com Header Auth

1. Execute `supabase/remover-secret-url-usar-header-auth.sql`
2. Configure o n8n para Header Auth
3. Envie uma mensagem
4. Verifique os logs - deve aparecer:
   ```
   🔐 Secret não na URL - usando Header Auth
   🔐 Secret enviado como header HTTP: X-Webhook-Secret
   Status: 200 OK
   ```

## 📋 Checklist

- [ ] Secret removido da URL (se usar Header Auth)
- [ ] n8n configurado para Header Auth
- [ ] Header Name no n8n: `X-Webhook-Secret`
- [ ] Header Value no n8n: `N0v4F0rg3@2025`
- [ ] Secret configurado nas settings da empresa
- [ ] Mensagem enviada no Telegram
- [ ] Logs da Vercel verificados
- [ ] Status: 200 OK (não 403)

## 🎯 Recomendação Final

**Use Header Auth** (Solução 1). É mais confiável e não tem problemas com caracteres especiais na URL.

1. Execute `supabase/remover-secret-url-usar-header-auth.sql`
2. Configure o n8n para Header Auth
3. Teste enviando uma mensagem

O código já está preparado para usar Header Auth quando o secret não estiver na URL!

