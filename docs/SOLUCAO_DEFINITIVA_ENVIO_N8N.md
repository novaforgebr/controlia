# ✅ Solução Definitiva: Enviar Mensagens para n8n

## 🔍 Problema Identificado

As mensagens do usuário aparecem corretamente na conversa, mas **não estão sendo enviadas para o n8n** para processamento pela IA.

## ✅ Solução Implementada

### 1. Código Atualizado com Logs Detalhados

O código agora inclui logs muito mais detalhados para diagnosticar o problema:

- ✅ Verificação se o secret está na URL
- ✅ Logs do secret extraído da URL
- ✅ Logs dos headers enviados
- ✅ Logs do payload (resumo)
- ✅ Logs da requisição HTTP
- ✅ Logs da resposta do n8n

### 2. Lógica de Detecção do Secret

O código agora detecta corretamente se o secret está na URL:

```typescript
// Verifica se o secret está na URL
const urlObj = new URL(webhookUrl)
const hasSecretInUrl = urlObj.searchParams.has('secret')

if (hasSecretInUrl) {
  // Usa query parameter (não adiciona headers)
  console.log('🔐 Secret encontrado na URL - usando query parameter')
} else if (n8nWebhookSecret) {
  // Usa Header Auth
  headers['X-Webhook-Secret'] = n8nWebhookSecret
  console.log('🔐 Secret não na URL - usando Header Auth')
}
```

### 3. Configuração Atual

**Automação configurada:**
- URL: `https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025`
- Tipo: Query Parameter (secret na URL)

**n8n deve estar configurado:**
- Authentication: **"None"** (porque o secret está na URL como query parameter)

## 🔍 Passos para Diagnosticar

### Passo 1: Verificar Logs da Vercel

Após enviar uma mensagem no Telegram, verifique os logs da Vercel. Você deve ver:

```
🎯 Automação selecionada: { id: '...', name: 'Atendimento com IA', ... }
📤 PREPARANDO envio para n8n
🔗 URL do webhook (original): https://controlia.up.railway.app/webhook/...?secret=...
🔍 Verificação da URL:
   - Secret na URL? true
   - Secret extraído da URL: N0v4F...
🔐 Secret encontrado na URL - usando query parameter (Authentication: None)
🔐 NÃO adicionando headers de autenticação - o secret já está na URL
📤 ENVIANDO para n8n:
   URL: https://controlia.up.railway.app/webhook/...?secret=...
   Headers: { "Content-Type": "application/json" }
🚀 Fazendo requisição HTTP POST para n8n...
✅ Requisição HTTP concluída
📡 Resposta do n8n:
   Status: 200 OK
```

### Passo 2: Verificar Configuração do n8n

1. **Acesse:** https://controlia.up.railway.app
2. **Abra o workflow:** `EW96u6Ji0AqtS7up`
3. **Clique no nó "Webhook"**
4. **Verifique:**
   - **Authentication:** Deve estar como **"None"** (porque o secret está na URL)
   - Se estiver como "Header Auth", mude para "None"

### Passo 3: Verificar Logs de Automação

Execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  automation_id,
  trigger_event,
  status,
  error_message,
  started_at,
  LEFT(trigger_data::text, 200) as trigger_data_preview
FROM automation_logs
WHERE started_at > NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC
LIMIT 10;
```

**Verifique:**
- ✅ Há logs com `status = 'success'`?
- ✅ Há logs com `status = 'error'`?
- ✅ Qual é a `error_message` (se houver)?

## 🎯 Solução Rápida

### Opção 1: Usar Query Parameter (Recomendado - Já Configurado)

A automação já está configurada com secret na URL. Certifique-se de que o n8n está configurado para usar **"None"** como autenticação.

### Opção 2: Usar Header Auth

Se preferir usar Header Auth:

1. **Remova o secret da URL da automação:**

```sql
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

2. **Configure o n8n para usar "Header Auth":**
   - Name: `X-Webhook-Secret`
   - Value: `N0v4F0rg3@2025`

3. **Certifique-se de que o secret está nas settings da empresa:**

```sql
SELECT 
  settings->>'n8n_webhook_secret' as secret_configurado
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

## 📋 Checklist

- [ ] Automação configurada com URL contendo `?secret=...`
- [ ] n8n configurado para usar "None" como autenticação
- [ ] Logs da Vercel mostram `🔐 Secret encontrado na URL`
- [ ] Logs da Vercel mostram `📤 ENVIANDO para n8n`
- [ ] Logs da Vercel mostram `✅ Requisição HTTP concluída`
- [ ] Logs da Vercel mostram `Status: 200 OK` (ou outro status de sucesso)
- [ ] Logs de automação mostram `status = 'success'`

## ⚠️ Problemas Comuns

### Problema 1: n8n Rejeita com 403

**Causa:** n8n está configurado para usar "Header Auth" mas o secret está na URL
**Solução:** Configure o n8n para usar "None" como autenticação

### Problema 2: Logs Não Mostram Envio

**Causa:** Automação não está sendo encontrada ou não tem URL configurada
**Solução:** Verifique se a automação existe e está ativa

### Problema 3: Erro ao Fazer Requisição

**Causa:** URL incorreta ou n8n não está acessível
**Solução:** Verifique a URL do webhook e se o n8n está online

## 🎯 Próximos Passos

1. **Envie uma mensagem no Telegram**
2. **Verifique os logs da Vercel** - deve mostrar todos os logs detalhados
3. **Verifique a resposta do n8n** - deve ser 200 OK
4. **Verifique se a IA responde** - a resposta deve aparecer na conversa

O código está pronto e com logs detalhados. Envie uma mensagem e verifique os logs para confirmar que está funcionando!

