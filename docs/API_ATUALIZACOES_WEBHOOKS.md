# Documentação Completa: Atualizações e Webhooks - Controlia CRM

## Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Segurança](#autenticação-e-segurança)
3. [Endpoints de Atualização](#endpoints-de-atualização)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Webhooks](#webhooks)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## Visão Geral

O Controlia CRM oferece múltiplas formas de atualizar dados na plataforma:

- **Server Actions**: Atualizações via formulários HTML (uso interno)
- **API REST**: Endpoints HTTP para integrações externas
- **Webhooks**: Recebimento de dados de sistemas externos (n8n, Telegram, WhatsApp)

Esta documentação foca em **atualizações via HTTP Request** e **integração com webhooks**.

---

## Autenticação e Segurança

### Para Requisições HTTP Diretas

As atualizações via Server Actions requerem autenticação de usuário. Para integrações externas, use:

1. **Service Role Key** (Supabase): Para bypass de RLS em webhooks
2. **API Keys**: Se configuradas na empresa
3. **Webhook Secrets**: Para validação de origem

### Headers Obrigatórios

```http
Content-Type: application/json
Authorization: Bearer <token> (se aplicável)
```

---

## Endpoints de Atualização

### Base URL

```
https://seu-dominio.com/api
```

### 1. Atualizar Contato

**Endpoint**: `PATCH /api/contacts/{contact_id}` (via Server Action)

**Nota**: Não há endpoint REST direto. Use Server Actions ou atualize via Supabase diretamente.

**Método Alternativo**: Atualizar diretamente no Supabase usando Service Role Client.

**Estrutura do Body JSON**:

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999",
  "whatsapp": "+5511999999999",
  "document": "12345678900",
  "status": "client",
  "source": "website",
  "score": 85,
  "notes": "Cliente preferencial",
  "tags": ["vip", "premium"],
  "ai_enabled": true,
  "pipeline_id": "uuid-do-pipeline",
  "pipeline_stage_id": "uuid-do-estagio",
  "custom_fields": {
    "telegram_id": "123456789",
    "telegram_username": "joao_silva",
    "data_nascimento": "1990-01-15",
    "empresa": "Empresa XYZ"
  }
}
```

**Campos Disponíveis**:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|--------------|-----------|
| `name` | string | Sim | Nome do contato (máx. 255 caracteres) |
| `email` | string | Não | Email válido |
| `phone` | string | Não | Telefone |
| `whatsapp` | string | Não | WhatsApp |
| `document` | string | Não | CPF/CNPJ |
| `status` | enum | Não | `lead`, `prospect`, `client`, `inactive` |
| `source` | string | Não | Origem do contato (máx. 100 caracteres) |
| `score` | number | Não | Score de 0 a 100 |
| `notes` | string | Não | Notas sobre o contato |
| `tags` | array | Não | Array de strings |
| `ai_enabled` | boolean | Não | Se IA está habilitada (padrão: `true`) |
| `pipeline_id` | uuid | Não | ID do pipeline CRM |
| `pipeline_stage_id` | uuid | Não | ID do estágio do pipeline |
| `custom_fields` | object | Não | Campos customizados (chave-valor) |

**Exemplo de Requisição**:

```bash
curl -X PATCH "https://seu-dominio.com/api/contacts/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "status": "client",
    "score": 85
  }'
```

---

### 2. Atualizar Conversa

**Endpoint**: `PATCH /api/conversations/{conversation_id}` (via Server Action)

**Estrutura do Body JSON**:

```json
{
  "status": "open",
  "priority": "high",
  "subject": "Dúvida sobre produto",
  "assigned_to": "uuid-do-usuario",
  "ai_assistant_enabled": true
}
```

**Campos Disponíveis**:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|--------------|-----------|
| `status` | enum | Não | `open`, `closed`, `transferred`, `waiting` |
| `priority` | enum | Não | `low`, `normal`, `high`, `urgent` |
| `subject` | string | Não | Assunto (máx. 500 caracteres) |
| `assigned_to` | uuid | Não | ID do usuário responsável |
| `ai_assistant_enabled` | boolean | Não | Se assistente IA está habilitado |

**Exemplo de Requisição**:

```bash
curl -X PATCH "https://seu-dominio.com/api/conversations/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed",
    "priority": "normal"
  }'
```

---

## Webhooks

### 1. Webhook n8n - Channel Response

**URL**: `POST /api/webhooks/n8n/channel-response`

**Descrição**: Recebe respostas do n8n após processamento de mensagens pela IA e envia aos canais (Telegram, WhatsApp).

**Estrutura do Body JSON**:

```json
{
  "output": "Resposta da IA aqui",
  "controlia": {
    "company_id": "uuid-da-empresa",
    "contact_id": "uuid-do-contato",
    "conversation_id": "uuid-da-conversa",
    "message_id": "uuid-da-mensagem-original",
    "channel": "telegram",
    "channel_id": "123456789"
  },
  "message": {
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "João",
      "last_name": "Silva",
      "username": "joao_silva"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    }
  }
}
```

**Campos Obrigatórios**:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `output` | string | **OBRIGATÓRIO** - Resposta da IA ou texto a enviar |
| `controlia.company_id` | uuid | ID da empresa (opcional, usa fallback se não fornecido) |
| `controlia.contact_id` | uuid | ID do contato (opcional, cria novo se não fornecido) |
| `controlia.conversation_id` | uuid | ID da conversa (opcional, busca/cria se não fornecido) |
| `controlia.channel` | string | Canal: `telegram`, `whatsapp`, etc. |
| `controlia.channel_id` | string | ID do chat no canal (obrigatório se não houver `message.chat.id`) |

**Campos Opcionais**:

- `controlia.message_id`: ID da mensagem original
- `message.from`: Dados do remetente (usado para criar contato se não houver `contact_id`)
- `message.chat`: Dados do chat (usado para obter `channel_id`)

**Exemplo de Requisição**:

```bash
curl -X POST "https://seu-dominio.com/api/webhooks/n8n/channel-response" \
  -H "Content-Type: application/json" \
  -d '{
    "output": "Olá! Como posso ajudar você hoje?",
    "controlia": {
      "company_id": "123e4567-e89b-12d3-a456-426614174000",
      "contact_id": "223e4567-e89b-12d3-a456-426614174000",
      "conversation_id": "323e4567-e89b-12d3-a456-426614174000",
      "channel": "telegram",
      "channel_id": "123456789"
    }
  }'
```

**Resposta de Sucesso**:

```json
{
  "success": true,
  "message_id": "uuid-da-mensagem-criada",
  "channel_message_id": "123"
}
```

**Resposta de Erro**:

```json
{
  "error": "Mensagem de erro descritiva",
  "details": "Detalhes adicionais (se aplicável)"
}
```

**Fluxo de Processamento**:

1. Recebe `output` (resposta da IA)
2. Busca ou cria empresa (usa `company_id` ou primeira empresa como fallback)
3. Busca ou cria contato (usa `contact_id` ou dados de `message.from`)
4. Busca ou cria conversa (usa `conversation_id` ou busca por `channel_thread_id`)
5. Cria mensagem no banco com `sender_type: 'ai'` e `direction: 'outbound'`
6. Envia mensagem ao canal (Telegram/WhatsApp)
7. Atualiza mensagem com `channel_message_id` e `status: 'sent'`

---

### 2. Webhook Telegram

**URL**: `POST /api/webhooks/telegram`

**Descrição**: Recebe mensagens do Telegram Bot API e processa no Controlia.

**Estrutura do Body JSON** (formato Telegram):

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "João",
      "last_name": "Silva",
      "username": "joao_silva"
    },
    "chat": {
      "id": 123456789,
      "first_name": "João",
      "username": "joao_silva",
      "type": "private"
    },
    "date": 1234567890,
    "text": "Olá!"
  }
}
```

**Processamento Automático**:

1. Ignora mensagens de bots
2. Busca empresa pelo bot token configurado
3. Busca ou cria contato baseado em `message.from.id`
4. Busca ou cria conversa baseada em `chat.id`
5. Cria mensagem no banco
6. Se IA estiver habilitada (`ai_assistant_enabled: true` e `ai_enabled: true`), envia para n8n

**Configuração do Webhook no Telegram**:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-dominio.com/api/webhooks/telegram"
  }'
```

---

### 3. Webhook WhatsApp

**URL**: `POST /api/webhooks/whatsapp`

**Descrição**: Recebe mensagens do WhatsApp Business API.

**Estrutura**: Depende do provedor (Meta, Twilio, etc.)

---

## Exemplos Práticos

### Exemplo 1: Atualizar Contato via n8n

**Cenário**: Após processar uma mensagem no n8n, atualizar o score do contato.

**Workflow n8n**:

1. **Webhook Trigger**: Recebe dados do Controlia
2. **Processar com IA**: Gera resposta
3. **HTTP Request** (enviar resposta):
   - URL: `https://seu-dominio.com/api/webhooks/n8n/channel-response`
   - Method: `POST`
   - Body:
   ```json
   {
     "output": "{{ $json.ai_response }}",
     "controlia": {
       "company_id": "{{ $json.controlia.company_id }}",
       "contact_id": "{{ $json.controlia.contact_id }}",
       "conversation_id": "{{ $json.controlia.conversation_id }}",
       "channel": "{{ $json.controlia.channel }}",
       "channel_id": "{{ $json.controlia.channel_id }}"
     }
   }
   ```
4. **HTTP Request** (atualizar contato):
   - URL: `https://seu-dominio.supabase.co/rest/v1/contacts?id=eq.{{ $json.controlia.contact_id }}`
   - Method: `PATCH`
   - Headers:
     - `apikey: <SUPABASE_SERVICE_ROLE_KEY>`
     - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
     - `Content-Type: application/json`
     - `Prefer: return=representation`
   - Body:
   ```json
   {
     "score": 90,
     "status": "client"
   }
   ```

---

### Exemplo 2: Atualizar Conversa após Resposta da IA

**Cenário**: Fechar conversa automaticamente após resposta da IA.

**Workflow n8n**:

1. **Webhook Trigger**: Recebe dados do Controlia
2. **Processar com IA**: Gera resposta
3. **HTTP Request** (enviar resposta):
   - URL: `https://seu-dominio.com/api/webhooks/n8n/channel-response`
   - Body: (mesmo do exemplo anterior)
4. **IF Node**: Verifica se resposta indica fechamento
5. **HTTP Request** (fechar conversa):
   - URL: `https://seu-dominio.supabase.co/rest/v1/conversations?id=eq.{{ $json.controlia.conversation_id }}`
   - Method: `PATCH`
   - Headers: (mesmos do exemplo anterior)
   - Body:
   ```json
   {
     "status": "closed",
     "closed_at": "{{ $now }}"
   }
   ```

---

### Exemplo 3: Atualizar Campos Customizados

**Cenário**: Atualizar campo customizado `ultima_compra` após processar pedido.

**Via Supabase REST API**:

```bash
curl -X PATCH "https://seu-dominio.supabase.co/rest/v1/contacts?id=eq.uuid-do-contato" \
  -H "apikey: <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "custom_fields": {
      "ultima_compra": "2024-01-15",
      "valor_total": 1500.00,
      "produtos_comprados": ["produto1", "produto2"]
    }
  }'
```

**Importante**: Campos customizados são mesclados com os existentes. Para substituir completamente, primeiro busque o contato, depois atualize.

---

### Exemplo 4: Criar/Atualizar Contato via Webhook n8n

**Cenário**: Criar ou atualizar contato quando receber dados de formulário externo.

**Estrutura do Body**:

```json
{
  "output": "Contato processado com sucesso",
  "controlia": {
    "company_id": "uuid-da-empresa",
    "channel": "telegram",
    "channel_id": "123456789"
  },
  "message": {
    "from": {
      "id": 123456789,
      "first_name": "Maria",
      "last_name": "Santos",
      "username": "maria_santos"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    }
  },
  "contact_data": {
    "email": "maria@example.com",
    "phone": "+5511999999999",
    "status": "lead",
    "source": "formulario_web"
  }
}
```

**Nota**: O webhook `channel-response` não atualiza contatos diretamente. Para isso, use Supabase REST API após receber o `contact_id` na resposta.

---

## Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Ação Recomendada |
|--------|-------------|------------------|
| `200` | Sucesso | Processar resposta |
| `400` | Dados inválidos | Verificar estrutura do JSON |
| `404` | Recurso não encontrado | Verificar IDs fornecidos |
| `500` | Erro interno | Verificar logs do servidor |

### Estrutura de Erro

```json
{
  "error": "Mensagem de erro descritiva",
  "details": "Detalhes adicionais (opcional)"
}
```

### Erros Comuns

#### 1. `contact_id não foi fornecido e não foi possível criar um novo contato`

**Causa**: Não há `contact_id` nem dados de `message.from`.

**Solução**: Forneça `controlia.contact_id` ou `message.from.id`.

#### 2. `Bot Token do Telegram não configurado`

**Causa**: Token não encontrado em variáveis de ambiente ou configurações da empresa.

**Solução**: Configure `TELEGRAM_BOT_TOKEN` ou adicione em `companies.settings.telegram_bot_token`.

#### 3. `Chat ID do Telegram não encontrado`

**Causa**: Não há `channel_id`, `conversation.channel_thread_id` nem `message.chat.id`.

**Solução**: Forneça `controlia.channel_id` ou `message.chat.id`.

#### 4. `Dados inválidos` (ZodError)

**Causa**: Campos com formato incorreto (ex: email inválido, status não permitido).

**Solução**: Verificar schema de validação e corrigir dados.

---

## Boas Práticas

### 1. Sempre Forneça `company_id`

Embora o sistema tenha fallback, é recomendado sempre fornecer `company_id` para garantir que os dados sejam associados à empresa correta.

### 2. Use `contact_id` Quando Possível

Se você já tem o `contact_id`, forneça-o. Isso evita buscas desnecessárias e garante que a atualização seja feita no contato correto.

### 3. Valide Dados Antes de Enviar

Verifique tipos de dados, formatos (emails, UUIDs) e valores permitidos (status, priority) antes de enviar.

### 4. Trate Respostas Assíncronas

Alguns processos podem ser assíncronos. Implemente retry logic e timeouts apropriados.

### 5. Use Service Role Key com Cuidado

A Service Role Key bypassa RLS. Use apenas em webhooks confiáveis e com validação de origem.

### 6. Logs e Monitoramento

Monitore logs do servidor e implemente alertas para erros frequentes.

---

## URLs e Endpoints Resumidos

### Webhooks

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/webhooks/n8n/channel-response` | POST | Recebe resposta do n8n e envia aos canais |
| `/api/webhooks/telegram` | POST | Recebe mensagens do Telegram |
| `/api/webhooks/whatsapp` | POST | Recebe mensagens do WhatsApp |

### API REST (Supabase)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `https://<projeto>.supabase.co/rest/v1/contacts` | GET/PATCH | Listar/Atualizar contatos |
| `https://<projeto>.supabase.co/rest/v1/conversations` | GET/PATCH | Listar/Atualizar conversas |
| `https://<projeto>.supabase.co/rest/v1/messages` | GET/POST | Listar/Criar mensagens |

### Server Actions (Interno)

| Ação | Descrição |
|------|-----------|
| `updateContact(contactId, formData)` | Atualizar contato |
| `updateConversation(conversationId, formData)` | Atualizar conversa |
| `createMessage(formData)` | Criar mensagem |

---

## Suporte e Contato

Para dúvidas ou problemas:

1. Verifique os logs do servidor
2. Consulte a documentação do Supabase
3. Verifique os schemas de validação em `lib/validations/`

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0.0

