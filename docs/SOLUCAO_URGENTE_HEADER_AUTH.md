# ✅ Solução Urgente: Configurar Header Auth no n8n

## 🔍 Problema Identificado

O n8n está configurado para usar **Header Auth**, mas a URL da automação ainda contém o secret como query parameter (`?secret=N0v4F0rg3@2025`).

**Resultado:** O código detecta o secret na URL e tenta usar query parameter, mas o n8n está esperando Header Auth, causando erro 403.

## ✅ Solução: Remover Secret da URL

### Passo 1: Executar Script SQL

Execute o script `supabase/remover-secret-url-agora.sql` no Supabase SQL Editor:

```sql
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

Isso remove o `?secret=...` da URL.

### Passo 2: Verificar Configuração do n8n

No n8n, certifique-se de que está configurado:

- **Authentication:** `Header Auth`
- **Credential for Header Auth:** `Header Auth account`
- **Name:** `X-Webhook-Secret`
- **Value:** `N0v4F0rg3@2025`

### Passo 3: Verificar Secret nas Settings

Certifique-se de que o secret está configurado nas settings da empresa:

```sql
SELECT 
  settings->>'n8n_webhook_secret' as secret_configurado
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Deve retornar:** `N0v4F0rg3@2025`

## 🎯 Como Funciona Agora

Após remover o secret da URL:

1. **Código detecta:** Secret não está na URL
2. **Código envia:** Secret como header `X-Webhook-Secret`
3. **n8n recebe:** Header Auth com o secret correto
4. **Resultado:** ✅ 200 OK

## 📋 Checklist

- [ ] Secret removido da URL da automação (SQL executado)
- [ ] n8n configurado para Header Auth
- [ ] Header Name no n8n: `X-Webhook-Secret`
- [ ] Header Value no n8n: `N0v4F0rg3@2025`
- [ ] Secret configurado nas settings da empresa
- [ ] Mensagem enviada no Telegram
- [ ] Logs da Vercel mostram `🔐 Secret não na URL - usando Header Auth`
- [ ] Logs da Vercel mostram `Status: 200 OK`

## ⚠️ Importante

**NÃO** adicione o secret de volta na URL! O n8n está configurado para Header Auth, então o secret deve ser enviado apenas como header HTTP.

