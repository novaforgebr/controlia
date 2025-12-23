# 🏗️ Arquitetura de Integração: Telegram → Controlia → n8n → IA → Telegram

## 📋 Checklist Completo de Informações Necessárias

### 1. TELEGRAM

#### 1.1 Configuração do Bot
- [ ] **Bot Token:** Token completo do bot Telegram
- [ ] **Bot Username:** Nome do bot (@username)
- [ ] **Webhook URL atual:** URL configurada no Telegram
- [ ] **Método de configuração:** setWebhook via API ou BotFather
- [ ] **Certificado SSL:** Se usa certificado customizado
- [ ] **Allowed Updates:** Quais tipos de updates o bot recebe (message, edited_message, callback_query, etc.)

#### 1.2 Webhook do Telegram
- [ ] **URL do webhook Controlia:** URL completa do endpoint que recebe webhooks
- [ ] **Método HTTP:** POST (padrão)
- [ ] **Formato do payload:** Estrutura exata que o Telegram envia
- [ ] **Validação de origem:** Se há validação de IP ou secret do Telegram
- [ ] **Retry policy:** Como o Telegram reenvia mensagens em caso de falha

#### 1.3 Permissões e Limitações
- [ ] **Rate limits:** Limites de requisições por segundo
- [ ] **Tamanho máximo de mensagem:** Limite de caracteres
- [ ] **Tipos de mídia suportados:** Foto, vídeo, áudio, documento, etc.
- [ ] **Grupos vs Privado:** Se o bot funciona em grupos ou apenas privado

---

### 2. N8N (Self-Hosted)

#### 2.1 Configuração do Workflow
- [ ] **Workflow ID:** ID único do workflow
- [ ] **Nome do workflow:** Nome descritivo
- [ ] **Status:** Ativo/Pausado
- [ ] **Versão do n8n:** Versão exata (ex: 2.1.2)

#### 2.2 Webhook de Entrada (n8n)
- [ ] **Tipo de webhook:** HTTP Request, Webhook, ou Telegram Trigger
- [ ] **URL do webhook n8n:** URL completa do webhook no n8n
- [ ] **Método HTTP:** POST, GET, etc.
- [ ] **Path do webhook:** Path específico (ex: `/webhook/xxx/webhook`)
- [ ] **Autenticação:**
  - [ ] Tipo: None, Header Auth, Basic Auth, JWT Auth
  - [ ] Se Header Auth: Nome do header (ex: `X-Webhook-Secret`)
  - [ ] Valor do secret/token
- [ ] **Response Mode:** Quando responde (imediato, quando último nó termina, etc.)
- [ ] **Response Data:** Formato da resposta (First Entry JSON, All Entries, etc.)

#### 2.3 Estrutura do Payload Esperado pelo n8n
- [ ] **Formato:** JSON, Form-Data, etc.
- [ ] **Campos obrigatórios:** Quais campos o n8n espera receber
- [ ] **Campos opcionais:** Campos adicionais que podem ser enviados
- [ ] **Estrutura de exemplo:** JSON de exemplo do payload esperado

#### 2.4 Processamento de IA no n8n
- [ ] **Nó de IA usado:** Qual nó (OpenAI, Anthropic, AI Agent, etc.)
- [ ] **Configuração da IA:**
  - [ ] Modelo usado
  - [ ] Temperature, max_tokens, etc.
  - [ ] System prompt ou instruções
- [ ] **Contexto enviado para IA:**
  - [ ] Histórico de mensagens
  - [ ] Informações do contato
  - [ ] Dados da empresa
- [ ] **Formato da resposta da IA:** Como a resposta é estruturada

#### 2.5 Webhook de Saída (n8n → Controlia)
- [ ] **URL do callback:** URL do endpoint Controlia que recebe resposta do n8n
- [ ] **Método HTTP:** POST (padrão)
- [ ] **Autenticação:** Se há autenticação no callback
- [ ] **Formato do payload de resposta:** Estrutura JSON que o n8n envia de volta
- [ ] **Tratamento de erros:** Como o n8n trata erros e retorna para Controlia

#### 2.6 Configurações de Retry e Fila
- [ ] **Retry policy:** Quantas tentativas em caso de falha
- [ ] **Timeout:** Tempo máximo de execução do workflow
- [ ] **Fila de mensagens:** Se há fila para processar mensagens
- [ ] **Concorrência:** Quantos workflows podem executar simultaneamente

---

### 3. BACKEND DA PLATAFORMA (Controlia)

#### 3.1 Endpoint: Receber Webhook do Telegram
- [ ] **Rota:** `/api/webhooks/telegram` (confirmar)
- [ ] **Método:** POST
- [ ] **Autenticação:** Se há autenticação ou é público
- [ ] **Validação:** Como valida que a requisição veio do Telegram
- [ ] **Rate limiting:** Se há limite de requisições

#### 3.2 Endpoint: Receber Resposta do n8n
- [ ] **Rota:** `/api/webhooks/n8n/channel-response` (confirmar)
- [ ] **Método:** POST
- [ ] **Autenticação:** Tipo e configuração
- [ ] **Validação:** Como valida que veio do n8n

#### 3.3 Processamento de Mensagens Inbound (Telegram → Controlia)
- [ ] **Fluxo atual:**
  - [ ] Recebe webhook do Telegram
  - [ ] Cria/atualiza contato
  - [ ] Cria/atualiza conversa
  - [ ] Salva mensagem no banco
  - [ ] Envia para n8n (se automação ativa)
- [ ] **Tratamento de duplicidade:** Como evita mensagens duplicadas
- [ ] **Tratamento de erros:** O que acontece se falhar em cada etapa

#### 3.4 Processamento de Mensagens Outbound (n8n → Controlia → Telegram)
- [ ] **Fluxo atual:**
  - [ ] Recebe resposta do n8n
  - [ ] Salva mensagem da IA no banco
  - [ ] Envia para Telegram via Bot API
  - [ ] Atualiza status da mensagem
- [ ] **Tratamento de erros:** O que acontece se falhar em cada etapa

#### 3.5 Real-time (WebSockets/SSE)
- [ ] **Tecnologia:** Supabase Realtime, WebSockets, Server-Sent Events
- [ ] **Canais:** Quais canais são usados para atualizações em tempo real
- [ ] **Eventos:** Quais eventos disparam atualizações (INSERT, UPDATE, DELETE)
- [ ] **Filtros:** Como filtra mensagens por conversa/empresa

---

### 4. BANCO DE DADOS (Supabase PostgreSQL)

#### 4.1 Estrutura de Tabelas

##### 4.1.1 Tabela: `companies`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `name` (VARCHAR)
  - [ ] `settings` (JSONB) - Onde está `n8n_webhook_secret`, `telegram_bot_token`, etc.
- [ ] **Índices:** Quais índices existem
- [ ] **RLS:** Políticas de Row Level Security

##### 4.1.2 Tabela: `contacts`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `company_id` (UUID, FK, nullable?)
  - [ ] `name` (VARCHAR)
  - [ ] `email` (VARCHAR, nullable?)
  - [ ] `phone` (VARCHAR, nullable?)
  - [ ] `custom_fields` (JSONB) - Onde está `telegram_id`, `telegram_username`
- [ ] **Índices:** Especialmente em `company_id`, `custom_fields->>'telegram_id'`
- [ ] **RLS:** Políticas de Row Level Security

##### 4.1.3 Tabela: `conversations`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `company_id` (UUID, FK, nullable?)
  - [ ] `contact_id` (UUID, FK)
  - [ ] `channel` (VARCHAR) - 'telegram', 'whatsapp', etc.
  - [ ] `channel_thread_id` (VARCHAR) - ID do chat no Telegram
  - [ ] `status` (VARCHAR) - 'open', 'closed', etc.
  - [ ] `ai_assistant_enabled` (BOOLEAN)
  - [ ] `last_message_at` (TIMESTAMPTZ)
- [ ] **Índices:** Especialmente em `company_id`, `contact_id`, `channel`, `channel_thread_id`
- [ ] **RLS:** Políticas de Row Level Security
- [ ] **Unique constraint:** Se há constraint único em `(company_id, contact_id, channel)` ou similar

##### 4.1.4 Tabela: `messages`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `company_id` (UUID, FK, nullable?)
  - [ ] `conversation_id` (UUID, FK)
  - [ ] `contact_id` (UUID, FK)
  - [ ] `content` (TEXT)
  - [ ] `content_type` (VARCHAR) - 'text', 'image', 'audio', etc.
  - [ ] `media_url` (TEXT, nullable)
  - [ ] `direction` (VARCHAR) - 'inbound', 'outbound'
  - [ ] `sender_type` (VARCHAR) - 'human', 'ai', 'system'
  - [ ] `sender_id` (UUID, nullable) - Se sender_type = 'human'
  - [ ] `ai_agent_id` (UUID, nullable) - Se sender_type = 'ai'
  - [ ] `channel_message_id` (VARCHAR, nullable) - ID da mensagem no Telegram
  - [ ] `status` (VARCHAR) - 'sent', 'delivered', 'read', 'failed'
  - [ ] `created_at` (TIMESTAMPTZ)
- [ ] **Índices:** Especialmente em `conversation_id`, `created_at`, `company_id`, `direction`
- [ ] **RLS:** Políticas de Row Level Security (CRÍTICO para leitura)
- [ ] **Triggers:** Se há triggers que atualizam `last_message_at` da conversa

##### 4.1.5 Tabela: `automations`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `company_id` (UUID, FK)
  - [ ] `name` (VARCHAR)
  - [ ] `trigger_event` (VARCHAR) - 'new_message', etc.
  - [ ] `n8n_webhook_url` (TEXT) - URL do webhook n8n
  - [ ] `n8n_workflow_id` (VARCHAR)
  - [ ] `is_active` (BOOLEAN)
  - [ ] `is_paused` (BOOLEAN)
- [ ] **Índices:** Em `company_id`, `trigger_event`, `is_active`
- [ ] **RLS:** Políticas de Row Level Security

##### 4.1.6 Tabela: `automation_logs`
- [ ] **Campos principais:**
  - [ ] `id` (UUID, PK)
  - [ ] `automation_id` (UUID, FK)
  - [ ] `company_id` (UUID, FK)
  - [ ] `trigger_event` (VARCHAR)
  - [ ] `status` (VARCHAR) - 'success', 'error', 'pending'
  - [ ] `error_message` (TEXT, nullable)
  - [ ] `trigger_data` (JSONB)
  - [ ] `started_at` (TIMESTAMPTZ)
  - [ ] `completed_at` (TIMESTAMPTZ, nullable)
- [ ] **Índices:** Em `automation_id`, `started_at`
- [ ] **RLS:** Políticas de Row Level Security

#### 4.2 Relacionamentos
- [ ] **companies → contacts:** 1:N
- [ ] **companies → conversations:** 1:N
- [ ] **companies → messages:** 1:N
- [ ] **contacts → conversations:** 1:N
- [ ] **contacts → messages:** 1:N
- [ ] **conversations → messages:** 1:N
- [ ] **companies → automations:** 1:N
- [ ] **automations → automation_logs:** 1:N

#### 4.3 Row Level Security (RLS)
- [ ] **Políticas para `messages`:**
  - [ ] SELECT: Usuários podem ler mensagens da sua empresa
  - [ ] INSERT: Service role pode inserir (webhooks)
  - [ ] UPDATE: Usuários podem atualizar mensagens da sua empresa
  - [ ] DELETE: Usuários podem deletar mensagens da sua empresa
- [ ] **Função helper:** `user_belongs_to_company(company_id)` existe e funciona?
- [ ] **Service role:** Service role key está configurada e funciona?

#### 4.4 Migrações Necessárias
- [ ] **company_id nullable:** Se `company_id` pode ser NULL em `messages`, `conversations`, `contacts`
- [ ] **Índices parciais:** Se há índices para `company_id IS NULL`
- [ ] **Campos faltando:** Se há campos que precisam ser adicionados

---

### 5. VERCEL (Deploy e Configuração)

#### 5.1 Variáveis de Ambiente
- [ ] **Supabase:**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (CRÍTICO para webhooks)
- [ ] **Telegram:**
  - [ ] `TELEGRAM_BOT_TOKEN` (opcional, pode estar no banco)
- [ ] **n8n:**
  - [ ] `N8N_WEBHOOK_URL` (opcional, pode estar no banco)
  - [ ] `N8N_WEBHOOK_SECRET` (opcional, pode estar no banco)
- [ ] **Controlia:**
  - [ ] `NEXT_PUBLIC_APP_URL` - URL da aplicação (para callbacks)

#### 5.2 Rotas de API (Serverless Functions)
- [ ] **`/api/webhooks/telegram` (POST):**
  - [ ] Timeout configurado
  - [ ] Região de deploy
  - [ ] Logs habilitados
- [ ] **`/api/webhooks/n8n/channel-response` (POST):**
  - [ ] Timeout configurado
  - [ ] Região de deploy
  - [ ] Logs habilitados

#### 5.3 Configurações de Performance
- [ ] **Cold start:** Estratégia para evitar cold start
- [ ] **Timeout:** Timeout máximo das funções (padrão 10s, pode aumentar)
- [ ] **Memory:** Memória alocada para as funções
- [ ] **Região:** Região de deploy (deve ser próxima do n8n e Supabase)

#### 5.4 Monitoramento e Logs
- [ ] **Vercel Logs:** Acesso aos logs em tempo real
- [ ] **Error tracking:** Se há integração com Sentry ou similar
- [ ] **Métricas:** Métricas de performance das funções

---

### 6. FLUXO ARQUITETURAL COMPLETO

#### 6.1 Fluxo: Mensagem Inbound (Usuário → Telegram → Controlia → n8n)

```
1. Usuário envia mensagem no Telegram
   ↓
2. Telegram envia webhook para Controlia
   Endpoint: POST /api/webhooks/telegram
   Payload: { update_id, message: { message_id, from, chat, text, date } }
   ↓
3. Controlia recebe webhook
   - Valida origem (se necessário)
   - Extrai dados da mensagem
   ↓
4. Controlia busca/cria contato
   - Busca por telegram_id em custom_fields
   - Se não existe, cria novo contato
   - Salva company_id do contato
   ↓
5. Controlia busca/cria conversa
   - Busca conversa aberta para contact_id + channel + channel_thread_id
   - Se não existe, cria nova conversa
   - Garante uma conversa por contato/canal
   ↓
6. Controlia salva mensagem no banco
   - INSERT INTO messages
   - direction: 'inbound'
   - sender_type: 'human'
   - company_id: do contato
   - Usa service_role para bypass RLS
   ↓
7. Controlia verifica automações ativas
   - SELECT FROM automations WHERE company_id = X AND trigger_event = 'new_message' AND is_active = true
   ↓
8. Controlia envia para n8n (se automação encontrada)
   - POST para n8n_webhook_url
   - Headers: X-Webhook-Secret (se Header Auth)
   - Payload: { message, controlia: { company_id, contact_id, conversation_id, callback_url } }
   ↓
9. n8n recebe e processa
   - Valida autenticação
   - Processa workflow
   - Aciona IA
   ↓
10. n8n envia resposta para Controlia
    - POST para callback_url (/api/webhooks/n8n/channel-response)
    - Payload: { output: "resposta da IA", controlia: { ... } }
```

#### 6.2 Fluxo: Mensagem Outbound (n8n → Controlia → Telegram)

```
1. n8n processa mensagem com IA
   ↓
2. n8n envia resposta para Controlia
   Endpoint: POST /api/webhooks/n8n/channel-response
   Payload: { output: "resposta", controlia: { company_id, contact_id, conversation_id } }
   ↓
3. Controlia recebe resposta do n8n
   - Valida origem (se necessário)
   - Extrai dados da resposta
   ↓
4. Controlia busca/cria contato e conversa (se necessário)
   - Usa dados do payload ou cria novos
   ↓
5. Controlia salva mensagem da IA no banco
   - INSERT INTO messages
   - direction: 'outbound'
   - sender_type: 'ai'
   - company_id: do payload ou contato
   - Usa service_role para bypass RLS
   ↓
6. Controlia envia mensagem para Telegram
   - POST https://api.telegram.org/bot{token}/sendMessage
   - chat_id: channel_thread_id da conversa
   - text: output do n8n
   ↓
7. Controlia atualiza status da mensagem
   - UPDATE messages SET status = 'sent', channel_message_id = X
   ↓
8. Telegram entrega mensagem ao usuário
   ↓
9. Supabase Realtime notifica frontend
   - Evento INSERT na tabela messages
   - Frontend atualiza UI em tempo real
```

#### 6.3 Fluxo: Real-time no Frontend

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
   - Frontend recebe payload
   - Frontend atualiza UI automaticamente
```

---

### 7. TRATAMENTO DE ERROS E CASOS ESPECIAIS

#### 7.1 Duplicidade de Mensagens
- [ ] **Como evitar:** Verificar `channel_message_id` antes de inserir
- [ ] **Como detectar:** Query por `channel_message_id` + `conversation_id`
- [ ] **Ação:** Ignorar mensagem duplicada ou atualizar existente

#### 7.2 Falha ao Salvar no Banco
- [ ] **Retry:** Quantas tentativas
- [ ] **Fallback:** O que fazer se todas tentativas falharem
- [ ] **Notificação:** Como notificar sobre falhas

#### 7.3 Falha ao Enviar para n8n
- [ ] **Retry:** Quantas tentativas
- [ ] **Timeout:** Tempo máximo de espera
- [ ] **Fallback:** Continuar sem IA ou notificar usuário

#### 7.4 Falha ao Receber Resposta do n8n
- [ ] **Timeout:** Tempo máximo de espera pela resposta
- [ ] **Retry:** Se n8n deve reenviar
- [ ] **Fallback:** O que fazer se resposta nunca chegar

#### 7.5 Falha ao Enviar para Telegram
- [ ] **Retry:** Quantas tentativas
- [ ] **Status:** Como atualizar status da mensagem (failed)
- [ ] **Notificação:** Como notificar sobre falhas

#### 7.6 Concorrência
- [ ] **Múltiplas mensagens simultâneas:** Como garantir ordem
- [ ] **Múltiplas respostas da IA:** Como evitar respostas duplicadas
- [ ] **Race conditions:** Como evitar condições de corrida

---

### 8. SCRIPTS SQL NECESSÁRIOS

#### 8.1 Estrutura Mínima de Tabelas
- [ ] Script para criar tabelas se não existirem
- [ ] Script para adicionar campos faltando
- [ ] Script para criar índices necessários

#### 8.2 Migrações
- [ ] Tornar `company_id` nullable (se necessário)
- [ ] Adicionar campos de rastreamento
- [ ] Criar índices parciais

#### 8.3 Políticas RLS
- [ ] Script para criar/atualizar políticas RLS
- [ ] Script para garantir service_role pode inserir
- [ ] Script para garantir usuários podem ler mensagens da empresa

#### 8.4 Funções Helper
- [ ] `user_belongs_to_company(company_id)` - Verificar se usuário pertence à empresa
- [ ] Triggers para atualizar `last_message_at`
- [ ] Triggers para atualizar `last_interaction_at` do contato

---

### 9. CONFIGURAÇÕES ESPERADAS DO N8N

#### 9.1 Webhook de Entrada
```json
{
  "authentication": "Header Auth",
  "header_name": "X-Webhook-Secret",
  "header_value": "N0v4F0rg3@2025",
  "method": "POST",
  "path": "/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook",
  "response_mode": "When Last Node Finishes",
  "response_data": "First Entry JSON"
}
```

#### 9.2 Payload Esperado pelo n8n
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 7772641515,
      "first_name": "Jailton",
      "last_name": "Silva"
    },
    "chat": {
      "id": 7772641515,
      "type": "private"
    },
    "text": "Mensagem do usuário",
    "date": 1766506324
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

#### 9.3 Payload de Resposta do n8n
```json
{
  "output": "Resposta da IA aqui",
  "controlia": {
    "company_id": "cae292bd-2cc7-42b9-9254-779ed011989e",
    "contact_id": "493fcd71-78e2-44d2-82aa-f2a8b13f4566",
    "conversation_id": "dd17b2bf-6c3f-42b8-bb81-1c85dac8829c",
    "message_id": "7798c86b-cab4-4116-8b4b-4f6af7a67d46",
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

### 10. CHECKLIST DE IMPLEMENTAÇÃO

#### 10.1 Preparação
- [ ] Todas as informações acima coletadas
- [ ] Acesso ao Supabase (SQL Editor)
- [ ] Acesso ao n8n (workflow editor)
- [ ] Acesso à Vercel (deploy e logs)
- [ ] Acesso ao Telegram Bot (BotFather)

#### 10.2 Banco de Dados
- [ ] Estrutura de tabelas verificada
- [ ] Índices criados
- [ ] RLS configurado corretamente
- [ ] Service role key configurada
- [ ] Funções helper criadas

#### 10.3 Backend
- [ ] Endpoint `/api/webhooks/telegram` funcionando
- [ ] Endpoint `/api/webhooks/n8n/channel-response` funcionando
- [ ] Lógica de criação de contato/conversa funcionando
- [ ] Lógica de envio para n8n funcionando
- [ ] Lógica de envio para Telegram funcionando

#### 10.4 n8n
- [ ] Webhook de entrada configurado
- [ ] Autenticação Header Auth configurada
- [ ] Workflow de IA configurado
- [ ] Webhook de saída (callback) configurado
- [ ] Tratamento de erros configurado

#### 10.5 Telegram
- [ ] Bot criado e token obtido
- [ ] Webhook configurado para Controlia
- [ ] Permissões do bot verificadas

#### 10.6 Frontend
- [ ] Carregamento de mensagens funcionando
- [ ] Supabase Realtime configurado
- [ ] Atualização em tempo real funcionando

#### 10.7 Testes
- [ ] Teste: Mensagem do usuário aparece na plataforma
- [ ] Teste: Mensagem é enviada para n8n
- [ ] Teste: IA responde corretamente
- [ ] Teste: Resposta aparece na plataforma
- [ ] Teste: Resposta é enviada para Telegram
- [ ] Teste: Real-time funciona (mensagens aparecem sem refresh)

---

## 🎯 PRÓXIMOS PASSOS

Após você fornecer todas as informações acima, eu vou:

1. **Analisar a arquitetura atual** e identificar gaps
2. **Criar scripts SQL** necessários para ajustes
3. **Ajustar o código** do backend para garantir fluxo correto
4. **Configurar o workflow n8n** com estrutura correta
5. **Testar ponta a ponta** e corrigir problemas
6. **Documentar** a solução final

**Agora, por favor, responda item por item com as informações reais do seu ambiente.**

