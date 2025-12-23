# 🔧 Corrigir: Mensagens Não Chegam ao n8n

## 🔍 Problema Identificado

Você tem **2 automações ativas** para cada mensagem:
1. **"Atendimento com IA"** - URL com secret: `...webhook?secret=N0v4F0rg3@2025`
2. **"Envia Mensagens do App"** - URL sem secret: `...webhook/controlia-message`

O código atual pega apenas a **primeira automação** (`automations[0]`), que pode ser a errada.

## ✅ Solução Passo a Passo

### Passo 1: Verificar Qual Automação Está Sendo Usada

O código pega `automations[0]`, mas a ordem pode variar. Precisamos garantir que use a automação correta.

**Opção A: Desativar a automação que não deve ser usada**

Execute no Supabase SQL Editor:

```sql
-- Desativar "Envia Mensagens do App" (se não for para mensagens do Telegram)
UPDATE automations
SET is_active = false
WHERE id = 'b48c23e8-b0a8-4a2a-972f-ab02db34c9d5'
  AND name = 'Envia Mensagens do App';
```

**Opção B: Priorizar a automação correta**

O código será atualizado para priorizar a automação "Atendimento com IA".

### Passo 2: Verificar Secret nas Settings

Execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as secret_configurado
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';
```

**Se retornar NULL ou vazio:**
1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **"n8n"**, cole: `N0v4F0rg3@2025`
3. Clique em **"Salvar Configurações"**

### Passo 3: Verificar Logs da Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Functions** > `/api/webhooks/telegram` > **Logs**
3. Envie uma nova mensagem no Telegram
4. Procure por estas linhas:

```
🔍 Automações encontradas: 2
📋 Detalhes das automações: [...]
📤 Enviando para n8n:
   URL: https://...
```

**Verifique:**
- Qual URL está sendo usada?
- Se está usando a URL correta (`...7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`)
- Se há erro na resposta do n8n

### Passo 4: Testar Webhook do n8n Manualmente

Execute no terminal (substitua `SEU_CONTACT_ID` e `SEU_CONVERSATION_ID`):

```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: N0v4F0rg3@2025" \
  -H "X-n8n-Webhook-Secret: N0v4F0rg3@2025" \
  -d '{
    "update_id": 123456,
    "message": {
      "message_id": 999,
      "from": {
        "id": 7772641515,
        "is_bot": false,
        "first_name": "Teste",
        "last_name": "Usuario"
      },
      "chat": {
        "id": 7772641515,
        "type": "private"
      },
      "date": 1234567890,
      "text": "Teste manual"
    },
    "controlia": {
      "company_id": "cae292bd-2cc7-42b9-9254-779ed011989e",
      "contact_id": "SEU_CONTACT_ID",
      "conversation_id": "SEU_CONVERSATION_ID",
      "channel": "telegram"
    }
  }'
```

**Se funcionar:**
- ✅ O webhook do n8n está acessível
- ✅ A autenticação está correta
- ✅ O problema está no Controlia não enviando

**Se não funcionar:**
- ❌ Verifique se o workflow está ativo no n8n
- ❌ Verifique se o secret está correto no n8n (Header Auth)
- ❌ Verifique se o nome do header está correto (`X-n8n-Webhook-Secret`)

### Passo 5: Verificar Configuração no n8n

1. Abra o workflow no n8n
2. Clique no nó **"Webhook"**
3. Verifique:
   - ✅ Authentication: **Header Auth**
   - ✅ Header Name: `X-n8n-Webhook-Secret` (ou `X-Webhook-Secret`)
   - ✅ Header Value: `N0v4F0rg3@2025`
   - ✅ Workflow está **ativo**

### Passo 6: Atualizar Código para Priorizar Automação Correta

O código será atualizado para:
1. Priorizar automação "Atendimento com IA"
2. Ou usar a automação que tem secret na URL
3. Adicionar mais logs para debug

## 🔧 Correção Imediata

Execute este SQL para garantir que apenas a automação correta está ativa:

```sql
-- Desativar "Envia Mensagens do App" para mensagens do Telegram
UPDATE automations
SET is_paused = true
WHERE id = 'b48c23e8-b0a8-4a2a-972f-ab02db34c9d5'
  AND name = 'Envia Mensagens do App';

-- Garantir que "Atendimento com IA" está ativa
UPDATE automations
SET is_active = true,
    is_paused = false
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'
  AND name = 'Atendimento com IA';
```

Depois, envie uma nova mensagem no Telegram e verifique os logs.

## 📋 Checklist Final

- [ ] Apenas uma automação ativa para `new_message` (ou a correta priorizada)
- [ ] Secret configurado nas settings da empresa (`N0v4F0rg3@2025`)
- [ ] Secret configurado no n8n (Header Auth: `X-n8n-Webhook-Secret`)
- [ ] Workflow ativo no n8n
- [ ] Webhook testado manualmente (funciona)
- [ ] Logs da Vercel mostram tentativa de envio
- [ ] Logs mostram URL correta sendo usada

## 🐛 Se Ainda Não Funcionar

1. **Copie os logs completos da Vercel** (última execução)
2. **Verifique os execution logs do n8n** (se recebeu algo)
3. **Execute o teste manual** (curl) e copie a resposta
4. **Envie todas as informações** para análise

