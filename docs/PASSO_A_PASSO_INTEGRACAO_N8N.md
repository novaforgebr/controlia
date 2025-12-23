# 📘 Passo a Passo Completo: Integração n8n com Controlia

Este guia detalha **exatamente** o que fazer para integrar seu n8n self-hosted com o Controlia.

---

## 🎯 Objetivo Final

Configurar para que:
1. ✅ Mensagens do Telegram cheguem ao Controlia
2. ✅ Controlia envie mensagens para o n8n
3. ✅ n8n processe com IA e responda
4. ✅ Resposta apareça no Controlia e seja enviada ao Telegram

---

## 📝 PASSO 1: Obter Secret do Webhook n8n

### ⚠️ IMPORTANTE: Diferença entre Telegram Trigger e Webhook

No n8n, existem dois tipos de nós que podem receber mensagens:
- **Telegram Trigger**: Recebe mensagens diretamente do Telegram (não tem opção de secret)
- **Webhook**: Recebe mensagens do Controlia (tem opção de secret)

Como o Controlia envia mensagens para o nó **"Webhook"**, você precisa configurar o secret **APENAS no nó "Webhook"**, não no Telegram Trigger.

### O que fazer:

1. **Abra seu n8n self-hosted** no navegador
2. **Abra o workflow** que processa mensagens do Telegram
3. **Clique no nó "Webhook"** (não no Telegram Trigger)
4. **Procure por "Authentication"** ou **"Secret"** nas configurações do Webhook
5. **Se houver secret configurado:**
   - Copie o secret (ex: `abc123xyz789`)
   - Anote em um lugar seguro
6. **Se NÃO houver secret:**
   - Ative a opção **"Require Secret"** ou **"Authentication"**
   - Gere ou configure um secret
   - Copie o secret gerado

### ✅ Resultado esperado:
- Você tem o secret do nó Webhook anotado

---

## 📝 PASSO 2: Obter URL do Webhook n8n

### O que fazer:

1. **No mesmo nó Webhook do n8n**, procure pela **URL do webhook**
2. Geralmente está no formato:
   ```
   https://seu-n8n.com/webhook/UUID/webhook
   ```
3. **Exemplo real:**
   ```
   https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook
   ```
4. **Copie a URL completa**

### ✅ Resultado esperado:
- Você tem a URL completa do webhook n8n

---

## 📝 PASSO 3: Configurar Secret do n8n no Controlia

### O que fazer:

1. **Faça login no Controlia**
2. **Navegue até: Configurações > Integrações**
3. **Role até a seção "n8n"** (nova seção adicionada)
4. **No campo "Webhook Secret do n8n"**, cole o secret que você copiou no Passo 1
5. **Clique em "Salvar Configurações"**

### ✅ Resultado esperado:
- Secret do n8n configurado no Controlia
- Mensagem de sucesso: "Configurações de integração salvas com sucesso!"

---

## 📝 PASSO 4: Criar/Verificar Automação no Banco de Dados

### 4.1 Verificar se já existe automação

Execute no **Supabase SQL Editor**:

```sql
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused
FROM automations
WHERE trigger_event = 'new_message';
```

### 4.2 Se NÃO existir, criar automação

Execute no **Supabase SQL Editor** (substitua os valores):

```sql
-- Primeiro, obtenha o ID da sua empresa
SELECT id, name FROM companies;

-- Depois, crie a automação (substitua COMPANY_ID pela sua empresa)
INSERT INTO automations (
  company_id,
  name,
  description,
  trigger_event,
  trigger_conditions,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused
) VALUES (
  'cae292bd-2cc7-42b9-9254-779ed011989e',  -- Substitua pelo ID da sua empresa
  'Agente IA - Telegram',
  'Processa mensagens do Telegram com Agent de IA do n8n',
  'new_message',
  '{}'::jsonb,
  'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',  -- Substitua pela URL do Passo 2
  'EW96u6Ji0AqtS7up',  -- Substitua pelo ID do workflow (opcional)
  true,  -- Ativa
  false  -- Não pausada
);
```

### 4.3 Se JÁ existir, atualizar URL

Execute no **Supabase SQL Editor**:

```sql
-- Atualizar URL do webhook (substitua pela URL do Passo 2)
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';  -- Substitua pelo ID da sua automação
```

### ✅ Resultado esperado:
- Automação criada/atualizada no banco
- `is_active = true` e `is_paused = false`
- URL do webhook n8n configurada

---

## 📝 PASSO 5: Configurar Bot Token do Telegram

### O que fazer:

1. **No Telegram**, procure por **@BotFather**
2. **Envie o comando**: `/mybots`
3. **Selecione seu bot**
4. **Clique em "API Token"**
5. **Copie o token** (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Configurar no Controlia:

1. **No Controlia**, vá em **Configurações > Integrações**
2. **Na seção Telegram**, cole o **Bot Token** no campo "Bot Token"
3. **Clique em "Salvar Configurações"**

### ✅ Resultado esperado:
- Bot Token configurado no Controlia

---

## 📝 PASSO 6: Configurar Webhook do Telegram para Controlia

### O que fazer:

Execute este comando no terminal (substitua `SEU_BOT_TOKEN`):

```bash
curl "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

**Exemplo com seu token:**
```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

### Verificar se foi configurado:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Você deve ver:**
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    ...
  }
}
```

### ✅ Resultado esperado:
- Webhook do Telegram apontando para `https://controliaa.vercel.app/api/webhooks/telegram`
- **NÃO** deve apontar para o n8n

---

## 📝 PASSO 7: Configurar Workflow n8n

### 7.1 Estrutura do Workflow

Seu workflow pode ter duas estruturas:

**Opção 1: Recebendo do Telegram diretamente**
```
[Telegram Trigger] → [AI Agent] → [HTTP Request para Controlia] → [Send Telegram Message]
```

**Opção 2: Recebendo do Controlia (recomendado)**
```
[Webhook] → [AI Agent] → [HTTP Request para Controlia] → [Send Telegram Message]
```

**Opção 3: Ambos (híbrido)**
```
[Telegram Trigger] ──┐
                      ├→ [AI Agent] → [HTTP Request para Controlia] → [Send Telegram Message]
[Webhook] ────────────┘
```

### 7.2 Configurar Telegram Trigger (se usar)

1. **No nó "Telegram Trigger"**:
   - ✅ Updates: **message** (ou conforme necessário)
   - ⚠️ **NÃO tem opção de secret** (isso é normal)
   - Este nó recebe mensagens diretamente do Telegram

### 7.3 Configurar Webhook (para receber do Controlia)

1. **No nó "Webhook"**:
   - ✅ Método: **POST**
   - ✅ Path: `/controlia-messag` (ou o que você configurou)
   - ✅ **Authentication**: Selecione uma das opções:
     - **Header Auth** (recomendado): Configure um header customizado
       - Header Name: `X-Webhook-Secret` (ou `X-n8n-Webhook-Secret`)
       - Header Value: `abc123xyz789` (seu secret)
     - **None**: Sem autenticação (não recomendado para produção)
   - Este nó recebe mensagens do Controlia

**Nota**: O Controlia envia o secret tanto como header HTTP quanto como query parameter, então funciona com ambas as configurações.

### 7.4 Configurar AI Agent

1. Configure seu AI Agent (OpenAI, Anthropic, etc.)
2. Use `{{ $json.message?.text || $json.text || $('Telegram Trigger').first()?.json?.message?.text || '' }}` como input
   - Isso funciona tanto para mensagens do Telegram Trigger quanto do Webhook
3. Configure o prompt/instruções da IA

### 7.5 Configurar HTTP Request para Controlia

1. **Adicione um nó "HTTP Request"**
2. **Configure:**
   - **Method**: `POST`
   - **URL**: `{{ $json.controlia.callback_url }}`
   - **Authentication**: None
   - **Body Content Type**: JSON
   - **JSON Body** (cole exatamente como está abaixo):

```json
{
  "output": "={{ $json.output }}",
  "controlia": {
    "company_id": "{{ $json.controlia?.company_id }}",
    "contact_id": "{{ $json.controlia?.contact_id }}",
    "conversation_id": "{{ $json.controlia?.conversation_id }}",
    "message_id": "{{ $json.controlia?.message_id }}",
    "channel": "{{ $json.controlia?.channel || 'telegram' }}",
    "channel_id": "{{ $json.message?.chat?.id || $json.controlia?.channel_id }}"
  },
  "message": {
    "from": "{{ $json.message?.from || $('Telegram Trigger').first()?.json?.message?.from }}",
    "chat": "{{ $json.message?.chat || $('Telegram Trigger').first()?.json?.message?.chat }}"
  }
}
```

### 7.6 Salvar e Ativar

1. **Clique em "Save"** para salvar o workflow
2. **Ative o workflow** (toggle no canto superior direito)

### ✅ Resultado esperado:
- Workflow n8n configurado e ativo
- Webhook configurado com secret (se usar)
- HTTP Request apontando para `controlia.callback_url`

---

## 📝 PASSO 8: Testar a Integração

### 8.1 Teste Completo

1. **Envie uma mensagem no Telegram** para seu bot
   - Exemplo: "Olá, como posso ajudar?"

2. **Verifique no Controlia:**
   - Acesse **Conversas**
   - A mensagem do lead deve aparecer
   - A resposta da IA deve aparecer automaticamente

3. **Verifique os logs da Vercel:**
   - Functions > `/api/webhooks/telegram` > Logs
   - Deve aparecer:
     - `📥 Webhook Telegram recebido`
     - `✅ Mensagem criada com sucesso`
     - `📤 Enviando para n8n`
     - `✅ Mensagem enviada para n8n com sucesso`
   - **NÃO** deve aparecer:
     - `❌ Erro ao enviar para n8n: {"message":"Provided secret is not valid"}`

4. **Verifique no Telegram:**
   - Você deve receber a resposta da IA

### 8.2 Verificar no Banco de Dados

Execute no **Supabase SQL Editor**:

```sql
-- Verificar mensagens recentes
SELECT 
  m.id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;
```

**Você deve ver:**
- Mensagens `direction = 'inbound'` e `sender_type = 'human'` (do lead)
- Mensagens `direction = 'outbound'` e `sender_type = 'ai'` (da IA)

### ✅ Resultado esperado:
- ✅ Mensagem do lead aparece no Controlia
- ✅ Mensagem é enviada para n8n
- ✅ IA processa e responde
- ✅ Resposta aparece no Controlia
- ✅ Resposta é enviada para o Telegram
- ✅ Lead recebe resposta no Telegram

---

## 🔧 Troubleshooting

### ❌ Erro: "Provided secret is not valid"

**Causa:** Secret não está sendo enviado ou está incorreto

**Solução:**
1. Verifique se o secret está configurado no Controlia (Passo 3)
2. Verifique se o secret no n8n é o mesmo
3. Verifique os logs da Vercel - deve aparecer `🔐 Secret adicionado à URL do webhook`
4. Se não aparecer, o secret não está configurado nas settings

### ❌ Mensagens não aparecem no Controlia

**Causa:** Webhook do Telegram não está apontando para Controlia

**Solução:**
1. Execute: `curl "https://api.telegram.org/botSEU_TOKEN/getWebhookInfo"`
2. Verifique se a URL é `https://controliaa.vercel.app/api/webhooks/telegram`
3. Se não for, execute o Passo 6 novamente

### ❌ Mensagens não são enviadas para n8n

**Causa:** Automação não configurada ou inativa

**Solução:**
1. Execute o script `supabase/check-automations.sql`
2. Verifique se há automação com `is_active = true`
3. Verifique se a URL do webhook está correta
4. Verifique os logs da Vercel - deve aparecer `🔍 Automações encontradas: 1`

### ❌ IA não responde

**Causa:** Workflow n8n não está processando ou HTTP Request está incorreto

**Solução:**
1. Verifique se o workflow está ativo no n8n
2. Verifique se o HTTP Request está usando `{{ $json.controlia.callback_url }}`
3. Verifique os logs do n8n para erros
4. Teste o workflow manualmente no n8n

---

## ✅ Checklist Final

Antes de considerar completo, verifique:

- [ ] **Passo 1**: Secret do n8n obtido e anotado
- [ ] **Passo 2**: URL do webhook n8n obtida
- [ ] **Passo 3**: Secret configurado no Controlia (Configurações > Integrações > n8n)
- [ ] **Passo 4**: Automação criada/atualizada no banco (`is_active = true`)
- [ ] **Passo 5**: Bot Token configurado no Controlia
- [ ] **Passo 6**: Webhook do Telegram apontando para Controlia (verificado com `getWebhookInfo`)
- [ ] **Passo 7**: Workflow n8n configurado e ativo
- [ ] **Passo 8**: Teste completo funcionando

---

## 🎉 Pronto!

Após seguir todos os passos, sua integração está completa e funcionando! 🚀

Todas as mensagens (lead e IA) ficam registradas no Controlia para histórico completo.

