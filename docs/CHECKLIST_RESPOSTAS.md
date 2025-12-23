# 📝 Checklist de Respostas - Preencha com suas informações

Use este documento para preencher todas as informações necessárias. Copie e cole suas respostas aqui.

> **✅ Informações já extraídas automaticamente estão marcadas com ✅**

## 1. TELEGRAM

### 1.1 Configuração do Bot
- ✅ **Bot Token:** `8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg` (extraído do histórico)
- [ ] **Bot Username:** `@_____________________________` (preencher)
- ✅ **Webhook URL atual:** `https://controliaa.vercel.app/api/webhooks/telegram` (confirmado)
- ✅ **Método de configuração:** Via API (setWebhook)
- [ ] **Certificado SSL:** `_____________________________` (preencher se usar)
- ✅ **Allowed Updates:** `["message"]` (padrão do Telegram)

### 1.2 Webhook do Telegram
- ✅ **URL do webhook Controlia:** `https://controliaa.vercel.app/api/webhooks/telegram`
- ✅ **Método HTTP:** POST (também suporta GET para verificação)
- ✅ **Formato do payload:** JSON (estrutura padrão do Telegram)
- ✅ **Validação de origem:** Nenhuma (aceita qualquer requisição POST)
- ✅ **Retry policy:** Telegram reenvia automaticamente se receber status 500

---

## 2. N8N

### 2.1 Configuração do Workflow
- ✅ **Workflow ID:** `EW96u6Ji0AqtS7up` (extraído do histórico)
- [ ] **Nome do workflow:** `_____________________________` (preencher)
- [ ] **Status:** `_____________________________` (preencher: Ativo/Pausado)
- ✅ **Versão do n8n:** `2.1.2 Self-Hosted` (extraído do histórico)

### 2.2 Webhook de Entrada
- ✅ **Tipo de webhook:** HTTP Request (Webhook node)
- ✅ **URL do webhook n8n:** `https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`
- ✅ **Método HTTP:** POST
- ✅ **Path do webhook:** `/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`
- ✅ **Autenticação:**
  - ✅ Tipo: Header Auth
  - ✅ Nome do header: `X-Webhook-Secret`
  - ✅ Valor do secret: `N0v4F0rg3@2025`

### 2.3 Estrutura do Payload Esperado
✅ **Payload enviado pelo Controlia:**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 7772641515,
      "first_name": "Jailton",
      "last_name": "Silva",
      "is_bot": false,
      "username": "jailton_silva"
    },
    "chat": {
      "id": 7772641515,
      "type": "private"
    },
    "date": 1766506324,
    "text": "Mensagem do usuário"
  },
  "controlia": {
    "company_id": "cae292bd-2cc7-42b9-9254-779ed011989e",
    "contact_id": "493fcd71-78e2-44d2-82aa-f2a8b13f4566",
    "conversation_id": "dd17b2bf-6c3f-42b8-bb81-1c85dac8829c",
    "message_id": "7798c86b-cab4-4116-8b4b-4f6af7a67d46",
    "channel": "telegram",
    "callback_url": "https://controliaa.vercel.app/api/webhooks/n8n/channel-response"
  }
}
```

### 2.4 Processamento de IA
- [ ] **Nó de IA usado:** `_____________________________` (preencher: AI Agent, OpenAI, Anthropic?)
- [ ] **Modelo:** `_____________________________` (preencher: gpt-4, claude, etc.)
- [ ] **Configurações:** `_____________________________` (preencher: temperature, max_tokens, etc.)

### 2.5 Webhook de Saída
- ✅ **URL do callback:** `https://controliaa.vercel.app/api/webhooks/n8n/channel-response`
- ✅ **Método HTTP:** POST
- ✅ **Autenticação:** Nenhuma (endpoint público)

---

## 3. BACKEND

### 3.1 Endpoints
- ✅ **Rota webhook Telegram:** `/api/webhooks/telegram` (POST, GET)
- ✅ **Rota webhook n8n:** `/api/webhooks/n8n/channel-response` (POST)

### 3.2 Real-time
- ✅ **Tecnologia:** Supabase Realtime (WebSockets)
- ✅ **Canais:** `conversation-{conversation_id}`
- ✅ **Eventos:** `postgres_changes` na tabela `messages` com filtro `conversation_id`

---

## 4. BANCO DE DADOS

### 4.1 Estrutura Atual
✅ **Estrutura confirmada via schema.sql:**
- ✅ **companies:** `id, name, settings (JSONB), created_at, updated_at`
- ✅ **contacts:** `id, company_id (NULLABLE), name, custom_fields (JSONB com telegram_id), created_at, updated_at`
- ✅ **conversations:** `id, company_id (NULLABLE), contact_id, channel, channel_thread_id, status, ai_assistant_enabled, created_at, updated_at`
- ✅ **messages:** `id, company_id (NULLABLE), conversation_id, contact_id, content, direction, sender_type, channel_message_id, created_at`
- ✅ **automations:** `id, company_id, name, trigger_event, n8n_webhook_url, n8n_workflow_id, is_active, is_paused`

### 4.2 RLS
- ✅ **Políticas messages:**
  - SELECT: "Users can view messages of their companies or without company"
  - INSERT: "Service role can insert messages" (bypass RLS)
  - UPDATE: "Users can update messages of their companies"
  - DELETE: "Users can delete messages of their companies"
- ✅ **Service role funciona:** Sim, implementado em `lib/supabase/server.ts` com `createServiceRoleClient()`

---

## 5. VERCEL

### 5.1 Variáveis de Ambiente
- [ ] **NEXT_PUBLIC_SUPABASE_URL:** `_____________________________` (preencher - CRÍTICO)
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY:** `_____________________________` (preencher - CRÍTICO)
- [ ] **SUPABASE_SERVICE_ROLE_KEY:** `_____________________________` (preencher - CRÍTICO para webhooks)
- ✅ **TELEGRAM_BOT_TOKEN:** `8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg` (opcional, pode estar no banco)
- ✅ **NEXT_PUBLIC_APP_URL:** `https://controliaa.vercel.app` (default, pode ser configurado)

### 5.2 Rotas de API
- [ ] **Timeout configurado:** `_____________________________` (preencher: padrão 10s Hobby, 60s Pro)
- [ ] **Região de deploy:** `_____________________________` (preencher: us-east-1, us-west-1, etc.)

---

## 6. INFORMAÇÕES ADICIONAIS

### Problemas Conhecidos
Liste aqui problemas que você já identificou:
- ✅ **Mensagens do lead não aparecem na conversa** (já identificado)
- ✅ **Mensagens não são enviadas para n8n** (já identificado - erro 403 "Provided secret is not valid")
- ✅ **AI não responde** (já identificado - relacionado ao problema acima)
- [ ] `_____________________________` (adicionar outros problemas)

### Requisitos Especiais
Liste aqui requisitos especiais ou limitações:
- ✅ **company_id não é obrigatório** (já implementado via migração)
- ✅ **Service role para bypass RLS** (já implementado)
- [ ] `_____________________________` (adicionar outros requisitos)

---

## 📋 RESUMO: O QUE AINDA PRECISA SER PREENCHIDO

### Informações Críticas que Preciso:
1. **n8n:**
   - [ ] Qual nó de IA está sendo usado? (AI Agent, OpenAI, Anthropic?)
   - [ ] Qual modelo? (gpt-4, claude-3, etc.)
   - [ ] Configurações da IA (temperature, max_tokens, etc.)
   - [ ] Estrutura exata do payload que o n8n envia de volta (confirmar formato)

2. **Variáveis de Ambiente Vercel:**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` (CRÍTICO)

3. **Configurações Vercel:**
   - [ ] Timeout das funções serverless
   - [ ] Região de deploy

4. **Telegram:**
   - [ ] Bot Username (@username)

### Informações Já Extraídas (✅):
- ✅ Estrutura completa do banco de dados
- ✅ Fluxo completo de mensagens (inbound e outbound)
- ✅ Configuração do webhook Telegram
- ✅ Configuração do webhook n8n (URL, autenticação)
- ✅ Estrutura do payload enviado para n8n
- ✅ Estrutura do payload recebido do n8n
- ✅ Real-time (Supabase Realtime)
- ✅ RLS policies
- ✅ Service role implementation

