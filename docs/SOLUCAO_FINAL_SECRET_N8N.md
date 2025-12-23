# ✅ Solução Final: Secret n8n com Header Auth

## 🔍 Problema Identificado

O n8n está configurado com **Header Auth** (`X-Webhook-Secret: N0v4F0rg3@2025`), mas o Controlia estava enviando o secret **tanto como header quanto como query parameter**, causando conflito.

## ✅ SOLUÇÃO: Remover Secret da URL

Quando o n8n usa **Header Auth**, ele **NÃO** aceita o secret como query parameter. Precisamos remover o `?secret=...` da URL.

### Passo 1: Atualizar URL da Automação (Remover Secret)

Execute no **Supabase SQL Editor**:

```sql
-- Remover secret da URL (o n8n vai usar apenas o header)
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'
  AND name = 'Atendimento com IA';
```

**Resultado:** A URL ficará sem `?secret=...`, e o secret será enviado apenas como header HTTP.

### Passo 2: Verificar Configuração no n8n

No n8n, verifique:
- ✅ **Authentication**: `Header Auth`
- ✅ **Credential**: `Header Auth account`
- ✅ **Header Name**: `X-Webhook-Secret`
- ✅ **Header Value**: `N0v4F0rg3@2025`

### Passo 3: Fazer Deploy das Correções

O código foi atualizado para:
- ✅ Detectar se o secret está na URL (query parameter) ou não (header)
- ✅ Se estiver na URL, usar apenas query parameter
- ✅ Se NÃO estiver na URL, usar apenas headers HTTP

**Faça deploy na Vercel:**
1. Commit as alterações
2. Push para o repositório
3. Aguarde deploy automático

### Passo 4: Testar

#### Teste 1: Com Header (sem secret na URL)

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

**Se funcionar:** ✅ O problema era o conflito entre query parameter e header.

#### Teste 2: Enviar Mensagem Real no Telegram

1. **Envie uma mensagem no Telegram** para o bot
2. **Verifique os logs da Vercel:**
   - Deve aparecer: `🔐 Secret não na URL - usando Header Auth`
   - Deve aparecer: `🔐 Secret enviado como headers HTTP: X-Webhook-Secret, X-n8n-Webhook-Secret`
   - Deve aparecer: `✅ Mensagem enviada para n8n com sucesso`
3. **Verifique no n8n:**
   - Abra o workflow
   - Vá em **Executions**
   - Deve aparecer uma nova execução

## 🔄 Como Funciona Agora

### Quando Secret está na URL:
```
URL: ...webhook?secret=xxx
→ Usa apenas query parameter (Authentication: None)
→ NÃO envia headers
```

### Quando Secret NÃO está na URL:
```
URL: ...webhook (sem ?secret=)
→ Usa apenas headers HTTP (Authentication: Header Auth)
→ Envia: X-Webhook-Secret e X-n8n-Webhook-Secret
→ NÃO adiciona query parameter
```

## ✅ Checklist Final

- [ ] URL da automação atualizada (sem `?secret=...`)
- [ ] Secret configurado no Controlia (Configurações > Integrações > n8n)
- [ ] Header Auth configurado no n8n (`X-Webhook-Secret: N0v4F0rg3@2025`)
- [ ] Deploy feito na Vercel
- [ ] Teste com curl funcionou (sem erro 403)
- [ ] Mensagem do Telegram chega ao n8n

## 🎉 Pronto!

Após seguir estes passos, o secret será enviado apenas como header HTTP, e o n8n deve aceitar corretamente!

