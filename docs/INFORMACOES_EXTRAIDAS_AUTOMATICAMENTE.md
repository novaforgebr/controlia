# 📊 Informações Extraídas Automaticamente do Código

## ✅ 1. TELEGRAM

### 1.1 Configuração do Bot
- ✅ **Endpoint webhook:** `/api/webhooks/telegram` (POST)
- ✅ **Método HTTP:** POST
- ✅ **Formato do payload:** JSON (estrutura padrão do Telegram)
- ✅ **Validação:** Ignora mensagens de bots (`message.from.is_bot === true`)
- ✅ **Tipos de mídia suportados:** text, photo, document, audio, video, voice
- ✅ **Allowed Updates:** `["message"]` (confirmado via getWebhookInfo)

### 1.2 Webhook do Telegram
- ✅ **URL atual:** `https://controliaa.vercel.app/api/webhooks/telegram` (confirmado)
- ✅ **Método:** POST
- ✅ **Validação de origem:** Não há validação específica (aceita qualquer requisição POST)
- ✅ **Retry policy:** Telegram reenvia automaticamente se receber status 500

### 1.3 Processamento
- ✅ **Busca contato por:** `custom_fields.telegram_id` ou `custom_fields.telegram_username`
- ✅ **Cria contato se não existir:** Sim, automaticamente
- ✅ **Busca conversa por:** `company_id` + `contact_id` + `channel` + `channel_thread_id` + `status = 'open'`
- ✅ **Cria conversa se não existir:** Sim, automaticamente
- ✅ **Salva mensagem:** Sim, usando `service_role` para bypass RLS

---

## ✅ 2. N8N (Self-Hosted)

### 2.1 Configuração do Workflow
- ✅ **Workflow ID conhecido:** `EW96u6Ji0AqtS7up`
- ✅ **URL do webhook n8n:** `https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`
- ✅ **Path:** `/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`
- ✅ **Autenticação:** Header Auth (configurado no n8n)
- ✅ **Header Name:** `X-Webhook-Secret`
- ✅ **Header Value:** `N0v4F0rg3@2025`

### 2.2 Webhook de Entrada (n8n)
- ✅ **Tipo:** HTTP Request (Webhook node)
- ✅ **Método HTTP:** POST
- ✅ **Autenticação:** Header Auth
- ✅ **Response Mode:** "When Last Node Finishes" (inferido)
- ✅ **Response Data:** "First Entry JSON" (inferido)

### 2.3 Payload Enviado pelo Controlia para n8n
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
      "username": "jailton_silva",
      "language_code": "pt-br"
    },
    "chat": {
      "id": 7772641515,
      "first_name": "Jailton",
      "last_name": "Silva",
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

### 2.4 Webhook de Saída (n8n → Controlia)
- ✅ **URL do callback:** `https://controliaa.vercel.app/api/webhooks/n8n/channel-response`
- ✅ **Método HTTP:** POST
- ✅ **Autenticação:** Nenhuma (endpoint público)
- ✅ **Formato esperado:**
```json
{
  "output": "Resposta da IA",
  "controlia": {
    "company_id": "...",
    "contact_id": "...",
    "conversation_id": "...",
    "channel": "telegram",
    "channel_id": "7772641515"
  },
  "message": {
    "from": { ... },
    "chat": { ... }
  }
}
```

---

## ✅ 3. BACKEND DA PLATAFORMA (Controlia)

### 3.1 Endpoint: Receber Webhook do Telegram
- ✅ **Rota:** `/api/webhooks/telegram`
- ✅ **Método:** POST (também suporta GET para verificação)
- ✅ **Autenticação:** Nenhuma (endpoint público)
- ✅ **Validação:** Ignora mensagens de bots
- ✅ **Rate limiting:** Não configurado explicitamente

### 3.2 Endpoint: Receber Resposta do n8n
- ✅ **Rota:** `/api/webhooks/n8n/channel-response`
- ✅ **Método:** POST
- ✅ **Autenticação:** Nenhuma (endpoint público)
- ✅ **Validação:** Verifica se `output` está presente

### 3.3 Processamento de Mensagens Inbound (Telegram → Controlia)
**Fluxo atual:**
1. ✅ Recebe webhook do Telegram
2. ✅ Valida e ignora mensagens de bots
3. ✅ Busca/cria contato por `telegram_id` ou `telegram_username`
4. ✅ Busca/cria conversa por `channel_thread_id` + `status = 'open'`
5. ✅ Salva mensagem no banco (direction: 'inbound', sender_type: 'human')
6. ✅ Busca automações ativas (`trigger_event = 'new_message'`)
7. ✅ Envia para n8n se automação encontrada
8. ✅ Registra log de automação (sucesso ou erro)

**Tratamento de duplicidade:**
- ✅ Usa `channel_message_id` para identificar mensagens
- ⚠️ **NÃO verifica duplicidade antes de inserir** (pode criar duplicatas)

**Tratamento de erros:**
- ✅ Retry: Tenta inserir sem `created_at` se primeira tentativa falhar
- ✅ Retorna 500 para Telegram reenviar se falha crítica
- ✅ Registra erros em `automation_logs`

### 3.4 Processamento de Mensagens Outbound (n8n → Controlia → Telegram)
**Fluxo atual:**
1. ✅ Recebe resposta do n8n
2. ✅ Busca/cria contato e conversa (se necessário)
3. ✅ Salva mensagem da IA no banco (direction: 'outbound', sender_type: 'ai')
4. ✅ Envia para Telegram via Bot API
5. ✅ Atualiza `channel_message_id` com ID retornado pelo Telegram

**Tratamento de erros:**
- ✅ Retorna erro 400 se dados incompletos
- ✅ Não falha se mensagem não for salva (já foi enviada ao canal)

### 3.5 Real-time (Supabase Realtime)
- ✅ **Tecnologia:** Supabase Realtime (WebSockets)
- ✅ **Canais:** `conversation-{conversation_id}`
- ✅ **Eventos:** `postgres_changes` na tabela `messages`
- ✅ **Filtros:** `conversation_id=eq.{conversation_id}` + `event=INSERT`
- ✅ **Atualização:** Frontend recebe payload e atualiza UI automaticamente

---

## ✅ 4. BANCO DE DADOS (Supabase PostgreSQL)

### 4.1 Estrutura de Tabelas

#### 4.1.1 Tabela: `companies`
```sql
- id (UUID, PK)
- name (VARCHAR)
- settings (JSONB) - Contém: telegram_bot_token, n8n_webhook_secret, etc.
- created_at, updated_at
```

#### 4.1.2 Tabela: `contacts`
```sql
- id (UUID, PK)
- company_id (UUID, FK, NULLABLE após migração)
- name (VARCHAR)
- email, phone, whatsapp (VARCHAR, nullable)
- custom_fields (JSONB) - Contém: telegram_id, telegram_username
- status, source, score
- ai_enabled (BOOLEAN)
- created_at, updated_at, last_interaction_at
```

**Índices:**
- `idx_contacts_company` em `company_id`
- `idx_contacts_status` em `(company_id, status)`
- `idx_contacts_whatsapp` em `(company_id, whatsapp)`
- `idx_contacts_email` em `(company_id, email)`

#### 4.1.3 Tabela: `conversations`
```sql
- id (UUID, PK)
- company_id (UUID, FK, NULLABLE após migração)
- contact_id (UUID, FK)
- channel (VARCHAR) - 'telegram', 'whatsapp', etc.
- channel_thread_id (VARCHAR, nullable) - ID do chat no Telegram
- status (VARCHAR) - 'open', 'closed', etc.
- priority (VARCHAR) - 'low', 'normal', 'high', 'urgent'
- ai_assistant_enabled (BOOLEAN)
- opened_at, closed_at, last_message_at, created_at, updated_at
```

**Índices:**
- `idx_conversations_company` em `company_id`
- `idx_conversations_contact` em `contact_id`
- `idx_conversations_channel` em `(company_id, channel, channel_thread_id)`
- `idx_conversations_active` em `(company_id, status)` WHERE `status = 'open'`
- `idx_conversations_no_company` em `(contact_id, channel, status)` WHERE `company_id IS NULL`

**Unique constraint:** NÃO há constraint único explícito

#### 4.1.4 Tabela: `messages`
```sql
- id (UUID, PK)
- company_id (UUID, FK, NULLABLE após migração)
- conversation_id (UUID, FK)
- contact_id (UUID, FK)
- content (TEXT)
- content_type (VARCHAR) - 'text', 'image', 'audio', 'video', 'document'
- media_url (TEXT, nullable)
- direction (VARCHAR) - 'inbound', 'outbound'
- sender_type (VARCHAR) - 'human', 'ai', 'system'
- sender_id (UUID, nullable) - Se sender_type = 'human'
- ai_agent_id (UUID, nullable) - Se sender_type = 'ai'
- channel_message_id (VARCHAR, nullable) - ID da mensagem no Telegram
- channel_timestamp (TIMESTAMPTZ, nullable)
- status (VARCHAR) - 'sent', 'delivered', 'read', 'failed'
- read_at (TIMESTAMPTZ, nullable)
- ai_context (JSONB, nullable)
- ai_prompt_version_id (UUID, nullable)
- created_at (TIMESTAMPTZ)
```

**Índices:**
- `idx_messages_company` em `company_id`
- `idx_messages_conversation` em `(conversation_id, created_at DESC)`
- `idx_messages_contact` em `contact_id`
- `idx_messages_sender` em `(company_id, sender_type)`
- `idx_messages_ai` em `(company_id, sender_type)` WHERE `sender_type = 'ai'`
- `idx_messages_channel_id` em `(company_id, channel_message_id)`
- `idx_messages_no_company` em `(conversation_id, created_at DESC)` WHERE `company_id IS NULL`

**Triggers:**
- ✅ `update_contact_last_interaction` - Atualiza `last_interaction_at` do contato
- ✅ `update_conversation_last_message` - Atualiza `last_message_at` da conversa

#### 4.1.5 Tabela: `automations`
```sql
- id (UUID, PK)
- company_id (UUID, FK)
- name (VARCHAR)
- description (TEXT, nullable)
- trigger_event (VARCHAR) - 'new_message', etc.
- n8n_webhook_url (TEXT, nullable)
- n8n_workflow_id (VARCHAR, nullable)
- is_active (BOOLEAN)
- is_paused (BOOLEAN)
- last_executed_at, execution_count, error_count
- created_at, updated_at
```

**Índices:**
- Em `company_id`, `trigger_event`, `is_active`

#### 4.1.6 Tabela: `automation_logs`
```sql
- id (UUID, PK)
- automation_id (UUID, FK)
- company_id (UUID, FK)
- trigger_event (VARCHAR)
- status (VARCHAR) - 'success', 'error', 'pending'
- error_message (TEXT, nullable)
- trigger_data (JSONB)
- started_at, completed_at
```

### 4.2 Relacionamentos
- ✅ `companies → contacts`: 1:N
- ✅ `companies → conversations`: 1:N
- ✅ `companies → messages`: 1:N
- ✅ `contacts → conversations`: 1:N
- ✅ `contacts → messages`: 1:N
- ✅ `conversations → messages`: 1:N
- ✅ `companies → automations`: 1:N
- ✅ `automations → automation_logs`: 1:N

### 4.3 Row Level Security (RLS)

#### Políticas para `messages`:
1. ✅ **SELECT:** "Users can view messages of their companies or without company"
   - Permite ler quando `company_id IS NULL` OU `user_belongs_to_company(company_id)`
   - Role: `authenticated`

2. ✅ **INSERT:** "Service role can insert messages"
   - Permite service_role inserir (bypass RLS)
   - Role: `service_role`

3. ✅ **UPDATE:** "Users can update messages of their companies"
   - Permite atualizar quando `company_id IS NULL` OU `user_belongs_to_company(company_id)`
   - Role: `authenticated`

4. ✅ **DELETE:** "Users can delete messages of their companies"
   - Permite deletar quando `company_id IS NULL` OU `user_belongs_to_company(company_id)`
   - Role: `authenticated`

#### Função Helper:
- ✅ `user_belongs_to_company(company_id)` - Verifica se usuário pertence à empresa
- ✅ Service role bypassa RLS automaticamente

### 4.4 Migrações Aplicadas
- ✅ `company_id` é NULLABLE em `contacts`, `conversations`, `messages`
- ✅ Índices parciais criados para `company_id IS NULL`
- ✅ Políticas RLS ajustadas para permitir operações quando `company_id IS NULL`

---

## ✅ 5. VERCEL (Deploy e Configuração)

### 5.1 Variáveis de Ambiente Necessárias
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key do Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - **CRÍTICO** para webhooks (bypass RLS)
- ✅ `TELEGRAM_BOT_TOKEN` - Token do bot (opcional, pode estar no banco)
- ✅ `NEXT_PUBLIC_APP_URL` - URL da aplicação (para callbacks) - Default: `https://controliaa.vercel.app`

### 5.2 Rotas de API (Serverless Functions)
- ✅ `/api/webhooks/telegram` (POST, GET)
- ✅ `/api/webhooks/n8n/channel-response` (POST)
- ✅ Timeout: Padrão Vercel (10s para Hobby, 60s para Pro)
- ✅ Região: Configurável na Vercel

### 5.3 Configurações de Performance
- ⚠️ **Cold start:** Não há estratégia específica implementada
- ⚠️ **Timeout:** Pode precisar aumentar se n8n demorar muito
- ⚠️ **Memory:** Padrão Vercel

---

## ✅ 6. FLUXO ARQUITETURAL COMPLETO

### 6.1 Fluxo: Mensagem Inbound (Usuário → Telegram → Controlia → n8n)

```
1. Usuário envia mensagem no Telegram
   ↓
2. Telegram → POST https://controliaa.vercel.app/api/webhooks/telegram
   Payload: { update_id, message: { message_id, from, chat, text, date } }
   ↓
3. Controlia recebe webhook
   - Valida: Ignora se message.from.is_bot === true
   - Extrai: telegramUserId, telegramUsername, text, date
   ↓
4. Controlia busca/cria contato
   - Busca: custom_fields.telegram_id === telegramUserId
   - Se não existe: Cria novo contato com company_id da primeira empresa
   ↓
5. Controlia busca/cria conversa
   - Busca: company_id + contact_id + channel='telegram' + channel_thread_id + status='open'
   - Se não existe: Cria nova conversa com ai_assistant_enabled=true
   ↓
6. Controlia salva mensagem no banco
   - INSERT INTO messages
   - direction: 'inbound'
   - sender_type: 'human'
   - company_id: do contato
   - Usa service_role para bypass RLS
   ↓
7. Controlia verifica automações ativas
   - SELECT FROM automations
   - WHERE company_id = X AND trigger_event = 'new_message' AND is_active = true AND is_paused = false
   ↓
8. Controlia envia para n8n (se automação encontrada)
   - POST para n8n_webhook_url
   - Headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': secret }
   - Payload: { update_id, message: {...}, controlia: { company_id, contact_id, conversation_id, callback_url } }
   ↓
9. n8n recebe e processa
   - Valida Header Auth (X-Webhook-Secret)
   - Processa workflow
   - Aciona IA (Agent node)
   ↓
10. n8n envia resposta para Controlia
    - POST para callback_url (/api/webhooks/n8n/channel-response)
    - Payload: { output: "resposta da IA", controlia: {...} }
```

### 6.2 Fluxo: Mensagem Outbound (n8n → Controlia → Telegram)

```
1. n8n processa mensagem com IA
   ↓
2. n8n → POST https://controliaa.vercel.app/api/webhooks/n8n/channel-response
   Payload: { output: "resposta", controlia: { company_id, contact_id, conversation_id, channel_id } }
   ↓
3. Controlia recebe resposta do n8n
   - Valida: Verifica se output está presente
   - Extrai: output, controlia data
   ↓
4. Controlia busca/cria contato e conversa (se necessário)
   - Usa company_id do payload ou primeira empresa
   - Busca contato por contact_id ou cria novo
   - Busca conversa por conversation_id ou cria nova
   ↓
5. Controlia salva mensagem da IA no banco
   - INSERT INTO messages
   - direction: 'outbound'
   - sender_type: 'ai'
   - ai_agent_id: null (por enquanto)
   - Usa service_role para bypass RLS
   ↓
6. Controlia envia mensagem para Telegram
   - POST https://api.telegram.org/bot{token}/sendMessage
   - chat_id: channel_thread_id da conversa
   - text: output do n8n
   ↓
7. Controlia atualiza status da mensagem
   - UPDATE messages SET channel_message_id = X, status = 'sent'
   ↓
8. Telegram entrega mensagem ao usuário
   ↓
9. Supabase Realtime notifica frontend
   - Evento INSERT na tabela messages
   - Frontend atualiza UI automaticamente
```

### 6.3 Fluxo: Real-time no Frontend

```
1. Frontend carrega conversa
   - SELECT FROM messages WHERE conversation_id = X ORDER BY created_at
   ↓
2. Frontend subscreve canal Supabase Realtime
   - Channel: conversation-{conversation_id}
   - Event: postgres_changes
   - Filter: INSERT na tabela messages WHERE conversation_id = X
   ↓
3. Quando nova mensagem é inserida
   - Supabase Realtime dispara evento
   - Frontend recebe payload.new
   - Frontend busca dados completos da mensagem (com user_profiles)
   - Frontend atualiza UI automaticamente
   - Scroll automático para última mensagem
```

---

## ⚠️ PROBLEMAS IDENTIFICADOS NO CÓDIGO

### 7.1 Duplicidade de Mensagens
- ❌ **NÃO há verificação de duplicidade** antes de inserir mensagem
- ⚠️ **Risco:** Mensagens duplicadas se Telegram reenviar
- 💡 **Solução:** Verificar `channel_message_id` antes de inserir

### 7.2 Falha ao Salvar no Banco
- ✅ **Retry implementado:** Tenta sem `created_at` se primeira tentativa falhar
- ✅ **Retorna 500:** Para Telegram reenviar em caso de falha crítica
- ⚠️ **Logs:** Muito detalhados (bom para debug)

### 7.3 Falha ao Enviar para n8n
- ⚠️ **Retry:** NÃO implementado (falha silenciosa)
- ✅ **Log:** Registra erro em `automation_logs`
- ⚠️ **Não bloqueia:** Continua mesmo se n8n falhar

### 7.4 Falha ao Receber Resposta do n8n
- ⚠️ **Timeout:** NÃO configurado (pode esperar indefinidamente)
- ⚠️ **Retry:** NÃO implementado
- ⚠️ **Fallback:** NÃO há fallback se resposta nunca chegar

### 7.5 Concorrência
- ⚠️ **Múltiplas mensagens simultâneas:** Pode criar múltiplas conversas
- ⚠️ **Race conditions:** Não há locks ou transações para evitar condições de corrida

---

## 📋 INFORMAÇÕES QUE AINDA PRECISAM SER CONFIRMADAS

### 8.1 Telegram
- [ ] **Bot Token completo:** (já temos: `8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg`)
- [ ] **Bot Username:** @?
- [ ] **Certificado SSL:** Usa certificado customizado?

### 8.2 n8n
- [ ] **Versão exata do n8n:** (já sabemos: 2.1.2 Self-Hosted)
- [ ] **Nó de IA usado:** Qual nó específico? (AI Agent, OpenAI, Anthropic?)
- [ ] **Modelo da IA:** Qual modelo?
- [ ] **Configurações da IA:** Temperature, max_tokens, etc.
- [ ] **Estrutura exata do payload esperado:** Confirmar se está correto
- [ ] **Estrutura exata do payload de resposta:** Confirmar formato

### 8.3 Banco de Dados
- [ ] **Service role key configurada:** Está na Vercel?
- [ ] **Políticas RLS atuais:** Confirmar se estão como esperado
- [ ] **Dados existentes:** Há dados que precisam migração?

### 8.4 Vercel
- [ ] **Todas as variáveis de ambiente:** Confirmar valores
- [ ] **Timeout configurado:** Qual o timeout atual?
- [ ] **Região de deploy:** Qual região?

---

## 🎯 PRÓXIMOS PASSOS

Com base nas informações extraídas, preciso que você confirme:

1. **n8n:**
   - Qual nó de IA está sendo usado?
   - Qual modelo?
   - Estrutura exata do payload que o n8n espera receber
   - Estrutura exata do payload que o n8n envia de volta

2. **Variáveis de Ambiente:**
   - Confirmar se `SUPABASE_SERVICE_ROLE_KEY` está configurada na Vercel
   - Confirmar se `NEXT_PUBLIC_APP_URL` está configurada

3. **Problemas Conhecidos:**
   - Listar problemas que você já identificou
   - Priorizar quais problemas resolver primeiro

Após essas confirmações, vou criar a solução definitiva!

