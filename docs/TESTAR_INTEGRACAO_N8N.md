# 🧪 Como Testar e Diagnosticar Integração com n8n

## 🔍 Passo 1: Verificar Configuração no Banco de Dados

Execute o script de diagnóstico no Supabase SQL Editor:

```sql
-- Execute: supabase/diagnose-n8n-integration.sql
```

Este script verifica:
- ✅ Automações ativas configuradas
- ✅ Secret do n8n nas settings da empresa
- ✅ Logs de execução recentes
- ✅ Mensagens que deveriam ter disparado automação

## 🔍 Passo 2: Verificar Logs da Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Functions** > `/api/webhooks/telegram`
3. Clique em **Logs**
4. Envie uma mensagem no Telegram
5. Procure por estas mensagens nos logs:

### ✅ Logs Esperados (Sucesso):

```
📥 Webhook Telegram recebido: {...}
✅ Empresa identificada: [company_id]
✅ Contato encontrado/criado: [contact_id]
✅ Conversa encontrada/criada: [conversation_id]
✅ Mensagem criada com sucesso: [message_id]
🔍 Buscando automações para company_id: [company_id]
🔍 Automações encontradas: 1
📋 Detalhes das automações: [...]
📤 Enviando para n8n:
   URL: https://...
   Headers: {...}
   Payload: {...}
🔐 Secret adicionado à URL do webhook como query parameter
🔐 Secret também enviado como header HTTP (para Header Auth)
📡 Resposta do n8n:
   Status: 200 OK
✅ Mensagem enviada para n8n com sucesso
📥 Resposta do n8n: {...}
```

### ❌ Logs de Erro Comuns:

#### Erro 1: Nenhuma automação encontrada
```
⚠️ Nenhuma automação ativa encontrada para company_id: [id]
```

**Solução:**
1. Verifique se existe automação no banco com:
   - `company_id` correto
   - `trigger_event = 'new_message'`
   - `is_active = true`
   - `is_paused = false`
   - `n8n_webhook_url` configurado

#### Erro 2: Secret não configurado
```
⚠️ Nenhum secret configurado. O n8n pode rejeitar a requisição se exigir autenticação.
```

**Solução:**
1. Configure o secret em **Configurações > Integrações > n8n**
2. Ou adicione `?secret=xxx` na URL do webhook na automação

#### Erro 3: Erro HTTP do n8n
```
❌ Erro ao enviar para n8n:
   Status HTTP: 401
   Resposta: {"message":"Provided secret is not valid"}
```

**Solução:**
1. Verifique se o secret no Controlia é igual ao configurado no n8n
2. Se usar Header Auth, verifique o nome do header (`X-Webhook-Secret` ou `X-n8n-Webhook-Secret`)
3. Se usar query parameter, verifique se está na URL

#### Erro 4: URL inválida
```
❌ Erro ao processar URL do webhook
```

**Solução:**
1. Verifique se a URL do webhook está correta
2. Verifique se a URL está acessível publicamente
3. Teste a URL manualmente com `curl`

## 🔍 Passo 3: Testar Webhook do n8n Manualmente

Execute este comando no terminal (substitua os valores):

```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=SEU_SECRET" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: SEU_SECRET" \
  -d '{
    "update_id": 123456,
    "message": {
      "message_id": 1,
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
      "text": "Teste de mensagem"
    },
    "controlia": {
      "company_id": "SEU_COMPANY_ID",
      "contact_id": "SEU_CONTACT_ID",
      "conversation_id": "SEU_CONVERSATION_ID",
      "channel": "telegram"
    }
  }'
```

**Se funcionar:**
- ✅ O webhook do n8n está acessível
- ✅ A autenticação está correta
- ✅ O problema pode estar no Controlia não encontrando a automação

**Se não funcionar:**
- ❌ Verifique a URL do webhook
- ❌ Verifique o secret
- ❌ Verifique se o workflow está ativo no n8n

## 🔍 Passo 4: Verificar no n8n

1. Abra o workflow no n8n
2. Verifique se está **ativo** (toggle no canto superior direito)
3. Verifique os **execution logs** do workflow
4. Procure por execuções recentes

## 🔧 Correções Comuns

### Problema: Automação não encontrada

**Verificar no banco:**
```sql
SELECT * FROM automations 
WHERE company_id = 'SEU_COMPANY_ID' 
  AND trigger_event = 'new_message' 
  AND is_active = true 
  AND is_paused = false;
```

**Se não retornar nada:**
1. Crie uma automação usando `supabase/create-automation-example.sql`
2. Ou crie via interface do Controlia (se houver)

### Problema: Secret não está sendo enviado

**Verificar settings:**
```sql
SELECT settings->>'n8n_webhook_secret' as secret 
FROM companies 
WHERE id = 'SEU_COMPANY_ID';
```

**Se retornar NULL:**
1. Configure em **Configurações > Integrações > n8n**
2. Ou atualize via SQL:
```sql
UPDATE companies
SET settings = jsonb_set(
  settings,
  '{n8n_webhook_secret}',
  '"SEU_SECRET_AQUI"'
)
WHERE id = 'SEU_COMPANY_ID';
```

### Problema: URL do webhook incorreta

**Verificar URL:**
```sql
SELECT n8n_webhook_url FROM automations WHERE id = 'SEU_AUTOMATION_ID';
```

**Testar URL:**
```bash
curl -X POST "URL_DO_WEBHOOK" -H "Content-Type: application/json" -d '{"test": "data"}'
```

## ✅ Checklist de Verificação

Antes de reportar problema, verifique:

- [ ] Automação existe no banco de dados
- [ ] Automação está ativa (`is_active = true`)
- [ ] Automação não está pausada (`is_paused = false`)
- [ ] URL do webhook está configurada
- [ ] Secret está configurado nas settings da empresa
- [ ] Workflow está ativo no n8n
- [ ] Webhook do n8n está acessível publicamente
- [ ] Logs da Vercel mostram tentativa de envio
- [ ] Logs do n8n mostram recebimento (ou erro)

## 📞 Próximos Passos

Se após seguir todos os passos ainda não funcionar:

1. **Copie os logs completos da Vercel** (última execução do webhook)
2. **Copie os logs do n8n** (se houver)
3. **Execute o script de diagnóstico** e copie os resultados
4. **Envie todas as informações** para análise

