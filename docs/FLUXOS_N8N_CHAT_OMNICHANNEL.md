# Fluxos n8n para Chat Omnichannel

Este documento descreve os workflows do n8n necessários para suportar o módulo de Chat Omnichannel com toggle de IA e sistema de autoconexão de canais.

## Índice

1. [Workflow: Verificar IA Ativa antes de Responder](#workflow-verificar-ia-ativa)
2. [Workflow: Conectar Canal WhatsApp/Telegram](#workflow-conectar-canal)
3. [Workflow: Receber Mensagens Inbound](#workflow-receber-mensagens)
4. [Workflow: Enviar Mensagens Outbound](#workflow-enviar-mensagens)
5. [Webhooks e Endpoints](#webhooks-e-endpoints)

---

## Workflow: Verificar IA Ativa antes de Responder

**Objetivo:** Verificar se `ai_assistant_enabled` está ativo antes de gerar resposta automática.

### Estrutura do Workflow

```
1. Webhook Trigger (recebe nova mensagem inbound)
   ↓
2. Supabase Query - Buscar conversa
   SELECT * FROM conversations WHERE id = {{$json.conversation_id}}
   ↓
3. IF Node - Verificar ai_assistant_enabled
   IF {{$json.ai_assistant_enabled}} === true
   ↓
4. [SIM] Continuar para gerar resposta IA
   ↓
5. [NÃO] Stop and Error - Encerrar workflow
   "IA desativada para esta conversa"
```

### Configuração do Nó Supabase Query

```json
{
  "operation": "select",
  "table": "conversations",
  "filters": {
    "id": "={{$json.conversation_id}}"
  },
  "fields": ["id", "ai_assistant_enabled", "company_id", "contact_id"]
}
```

### Configuração do IF Node

```
Condition: Boolean
Value 1: {{$json.ai_assistant_enabled}}
Operation: equals
Value 2: true
```

**Importante:** Se `ai_assistant_enabled` for `false`, o workflow deve encerrar imediatamente sem gerar resposta, permitindo que apenas o humano escreva.

---

## Workflow: Conectar Canal WhatsApp/Telegram

**Objetivo:** Criar instância de conexão e retornar QR Code para o usuário escanear.

### Estrutura do Workflow

```
1. Webhook Trigger
   URL: /connect-channel
   Method: POST
   Headers: X-N8N-Secret (validação)
   Body: { company_id, channel }
   ↓
2. HTTP Request - Evolution API (WhatsApp) ou Telegram Bot API
   Para WhatsApp:
   POST {{EVOLUTION_API_URL}}/instance/create
   Headers: { apikey: {{EVOLUTION_API_KEY}} }
   Body: { instanceName: "{{company_id}}_{{channel}}", token: "..." }
   ↓
3. HTTP Request - Obter QR Code
   GET {{EVOLUTION_API_URL}}/instance/connect/{{instanceName}}
   ↓
4. Function Node - Processar QR Code
   const qrCode = $input.item.json.base64;
   const instanceId = $input.item.json.instance.key;
   ↓
5. HTTP Request - Notificar Frontend (opcional)
   POST {{FRONTEND_WEBHOOK}}/api/webhooks/integrations
   Body: {
     event: "channel.qr_code",
     data: {
       instance_id: instanceId,
       qr_code: qrCode,
       company_id: company_id
     }
   }
   ↓
6. Respond to Webhook
   {
     success: true,
     qr_code: qrCode,
     instance_id: instanceId,
     channel_name: "WhatsApp Principal"
   }
```

### Exemplo de Configuração - Evolution API (WhatsApp)

**Nó 1: Criar Instância**
```json
{
  "method": "POST",
  "url": "https://api.evolutionapi.com/instance/create",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{$env.EVOLUTION_API_KEY}}"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "instanceName",
        "value": "={{$json.company_id}}_whatsapp"
      },
      {
        "name": "token",
        "value": "={{$json.company_id}}_token"
      }
    ]
  }
}
```

**Nó 2: Obter QR Code**
```json
{
  "method": "GET",
  "url": "https://api.evolutionapi.com/instance/connect/{{$json.instanceName}}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{$env.EVOLUTION_API_KEY}}"
      }
    ]
  }
}
```

### Exemplo de Configuração - Telegram Bot

**Nó 1: Criar Bot (se necessário)**
```json
{
  "method": "POST",
  "url": "https://api.telegram.org/bot{{$env.TELEGRAM_BOT_TOKEN}}/getMe"
}
```

**Nó 2: Configurar Webhook do Telegram**
```json
{
  "method": "POST",
  "url": "https://api.telegram.org/bot{{$env.TELEGRAM_BOT_TOKEN}}/setWebhook",
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "url",
        "value": "{{$env.N8N_WEBHOOK_URL}}/telegram-webhook"
      }
    ]
  }
}
```

---

## Workflow: Receber Mensagens Inbound

**Objetivo:** Receber mensagens dos canais externos e salvar no Supabase.

### Estrutura do Workflow

```
1. Webhook Trigger (do canal externo)
   WhatsApp: Evolution API webhook
   Telegram: Telegram Bot webhook
   ↓
2. Function Node - Normalizar dados
   const message = {
     content: $input.item.json.text || $input.item.json.message,
     channel_message_id: $input.item.json.id,
     channel_timestamp: $input.item.json.timestamp,
     from: $input.item.json.from,
     channel: "whatsapp" ou "telegram"
   }
   ↓
3. Supabase Query - Buscar/Criar contato
   SELECT * FROM contacts 
   WHERE company_id = ? AND whatsapp = ? (ou phone = ?)
   ↓
4. IF Node - Contato existe?
   ↓
5. [NÃO] Supabase Insert - Criar contato
   ↓
6. Supabase Query - Buscar/Criar conversa
   SELECT * FROM conversations 
   WHERE company_id = ? AND channel_thread_id = ?
   ↓
7. IF Node - Conversa existe?
   ↓
8. [NÃO] Supabase Insert - Criar conversa
   ↓
9. Supabase Query - Verificar ai_assistant_enabled
   SELECT ai_assistant_enabled FROM conversations WHERE id = ?
   ↓
10. Supabase Insert - Inserir mensagem
    {
      conversation_id,
      contact_id,
      content,
      sender_type: "human",
      direction: "inbound",
      channel_message_id,
      channel_timestamp
    }
    ↓
11. IF Node - ai_assistant_enabled === true?
    ↓
12. [SIM] Chamar Workflow de Resposta IA
    ↓
13. [NÃO] Stop - Aguardar resposta humana
```

### Exemplo de Function Node - Normalizar WhatsApp

```javascript
const data = $input.item.json;

// Evolution API format
const message = {
  content: data.text?.message || data.text || '',
  channel_message_id: data.key?.id || data.id,
  channel_timestamp: new Date(data.timestamp * 1000).toISOString(),
  from: data.key?.remoteJid?.replace('@s.whatsapp.net', '') || data.from,
  channel: 'whatsapp',
  company_id: data.instanceName.split('_')[0] // Extrair company_id do instanceName
};

return { json: message };
```

### Exemplo de Function Node - Normalizar Telegram

```javascript
const data = $input.item.json;

const message = {
  content: data.message?.text || '',
  channel_message_id: data.message?.message_id?.toString(),
  channel_timestamp: new Date(data.message?.date * 1000).toISOString(),
  from: data.message?.from?.id?.toString(),
  channel: 'telegram',
  chat_id: data.message?.chat?.id?.toString()
};

return { json: message };
```

---

## Workflow: Enviar Mensagens Outbound

**Objetivo:** Enviar mensagens do CRM para os canais externos.

### Estrutura do Workflow

```
1. Webhook Trigger (chamado pelo CRM)
   Body: { conversation_id, content, channel }
   ↓
2. Supabase Query - Buscar conversa e canal
   SELECT channel, channel_thread_id FROM conversations WHERE id = ?
   ↓
3. IF Node - Qual canal?
   ↓
4. [WhatsApp] HTTP Request - Evolution API
   POST {{EVOLUTION_API_URL}}/message/sendText/{{instanceName}}
   Body: {
     number: channel_thread_id,
     text: content
   }
   ↓
5. [Telegram] HTTP Request - Telegram Bot API
   POST https://api.telegram.org/bot{{TOKEN}}/sendMessage
   Body: {
     chat_id: channel_thread_id,
     text: content
   }
   ↓
6. Supabase Update - Atualizar channel_message_id na mensagem
```

---

## Webhooks e Endpoints

### Endpoints que o n8n deve expor:

#### 1. `/connect-channel` (POST)
**Headers:**
- `X-N8N-Secret`: Secret para autenticação

**Body:**
```json
{
  "company_id": "uuid",
  "channel": "whatsapp" | "telegram"
}
```

**Response:**
```json
{
  "success": true,
  "qr_code": "base64_string",
  "instance_id": "string",
  "channel_name": "string",
  "webhook_url": "string",
  "connection_data": {}
}
```

#### 2. `/disconnect-channel` (POST)
**Body:**
```json
{
  "instance_id": "string",
  "company_id": "uuid"
}
```

#### 3. `/check-status` (POST)
**Body:**
```json
{
  "instance_id": "string",
  "company_id": "uuid"
}
```

**Response:**
```json
{
  "status": "connected" | "connecting" | "disconnected" | "error",
  "error": "string (opcional)"
}
```

#### 4. `/telegram-webhook` (POST)
Webhook recebido do Telegram quando há nova mensagem.

#### 5. Webhook do Evolution API (WhatsApp)
Configurar no Evolution API para chamar o workflow de receber mensagens.

---

## Variáveis de Ambiente Necessárias

```env
# n8n
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_SECRET=seu-secret-aqui

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://api.evolutionapi.com
EVOLUTION_API_KEY=sua-api-key

# Telegram
TELEGRAM_BOT_TOKEN=seu-bot-token

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
```

---

## Fluxo Completo de Conexão

1. **Usuário clica em "Conectar WhatsApp" no CRM**
2. **Frontend chama Server Action** `connectChannel('whatsapp')`
3. **Server Action chama n8n** `/connect-channel`
4. **n8n cria instância** na Evolution API
5. **n8n obtém QR Code** da Evolution API
6. **n8n retorna QR Code** para o Server Action
7. **Server Action salva** no Supabase (`channel_integrations`)
8. **Frontend exibe QR Code** em modal
9. **Frontend faz polling** de status a cada 3 segundos
10. **Usuário escaneia QR Code** no WhatsApp
11. **Evolution API notifica n8n** que conexão foi estabelecida
12. **n8n atualiza Supabase** via webhook `/api/webhooks/integrations`
13. **Frontend detecta mudança** via Realtime e atualiza UI

---

## Notas Importantes

1. **Segurança:** Sempre validar `X-N8N-Secret` nos webhooks
2. **Idempotência:** Verificar se instância já existe antes de criar
3. **Timeout:** QR Code expira após alguns minutos - implementar renovação
4. **Error Handling:** Sempre tratar erros e atualizar status no Supabase
5. **Logs:** Registrar todas as operações para debugging

---

## Exemplo de Workflow Completo (n8n JSON)

Para importar no n8n, você pode criar workflows baseados nas estruturas acima. Cada workflow deve ser configurado com os nós apropriados e as credenciais necessárias.

