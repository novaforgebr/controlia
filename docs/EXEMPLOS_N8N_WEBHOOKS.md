# Exemplos Práticos: Integração n8n com Controlia

Este documento contém exemplos práticos de código JavaScript para usar nos workflows do n8n.

---

## Exemplo 1: Processar Resposta da IA e Enviar ao Controlia

### Node: HTTP Request (Enviar Resposta)

**URL**: `https://seu-dominio.com/api/webhooks/n8n/channel-response`

**Method**: `POST`

**Body (JSON)**:

```javascript
// Código JavaScript para o n8n
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;

// Extrair dados do Controlia
const controlia = webhookData.controlia || {};
const message = webhookData.message || {};

// Obter resposta da IA (ajustar conforme seu workflow)
const aiResponse = $('Agent').first().json.output || 
                   $('Agent').first().json.text || 
                   $('Agent').first().json.response ||
                   'Resposta padrão';

return {
  output: aiResponse,
  controlia: {
    company_id: controlia.company_id,
    contact_id: controlia.contact_id,
    conversation_id: controlia.conversation_id,
    message_id: controlia.message_id,
    channel: controlia.channel || 'telegram',
    channel_id: controlia.channel_id || message.chat?.id?.toString()
  },
  message: {
    from: message.from || controlia.message?.from,
    chat: message.chat || controlia.message?.chat
  }
};
```

---

## Exemplo 2: Atualizar Contato Após Processamento

### Node: HTTP Request (Atualizar Contato no Supabase)

**URL**: `https://<seu-projeto>.supabase.co/rest/v1/contacts?id=eq.{{ $json.controlia.contact_id }}`

**Method**: `PATCH`

**Headers**:
- `apikey`: `<SUPABASE_SERVICE_ROLE_KEY>`
- `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- `Content-Type`: `application/json`
- `Prefer`: `return=representation`

**Body (JSON)**:

```javascript
// Código JavaScript para o n8n
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};

// Calcular novo score baseado na análise da IA
const aiAnalysis = $('Agent').first().json.analysis || {};
let newScore = 0;

if (aiAnalysis.sentiment === 'positive') {
  newScore = 85;
} else if (aiAnalysis.sentiment === 'neutral') {
  newScore = 50;
} else {
  newScore = 30;
}

// Determinar novo status
let newStatus = 'lead';
if (newScore >= 80) {
  newStatus = 'client';
} else if (newScore >= 50) {
  newStatus = 'prospect';
}

return {
  score: newScore,
  status: newStatus,
  custom_fields: {
    ultima_interacao: new Date().toISOString(),
    sentimento_ia: aiAnalysis.sentiment,
    confianca_ia: aiAnalysis.confidence || 0
  }
};
```

---

## Exemplo 3: Atualizar Conversa com Prioridade

### Node: HTTP Request (Atualizar Conversa)

**URL**: `https://<seu-projeto>.supabase.co/rest/v1/conversations?id=eq.{{ $json.controlia.conversation_id }}`

**Method**: `PATCH`

**Headers**: (mesmos do exemplo anterior)

**Body (JSON)**:

```javascript
// Código JavaScript para o n8n
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const messageText = webhookData.message?.text || webhookData.text || '';

// Detectar palavras-chave para definir prioridade
let priority = 'normal';
let status = 'open';

const urgentKeywords = ['urgente', 'emergência', 'problema crítico', 'não funciona'];
const highKeywords = ['importante', 'preciso', 'ajuda', 'dúvida'];

const lowerText = messageText.toLowerCase();

if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
  priority = 'urgent';
} else if (highKeywords.some(keyword => lowerText.includes(keyword))) {
  priority = 'high';
}

// Detectar se mensagem indica fechamento
if (lowerText.includes('obrigado') || lowerText.includes('resolvido') || lowerText.includes('ok')) {
  status = 'closed';
}

return {
  priority: priority,
  status: status,
  subject: messageText.substring(0, 100) // Primeiros 100 caracteres como assunto
};
```

---

## Exemplo 4: Workflow Completo - Processar Mensagem e Atualizar Dados

### Estrutura do Workflow

1. **Webhook Trigger** (recebe dados do Controlia)
2. **IF Node** (verifica se IA está habilitada)
3. **Agent Node** (processa com IA)
4. **HTTP Request** (envia resposta ao Controlia)
5. **HTTP Request** (atualiza contato)
6. **HTTP Request** (atualiza conversa)

### Código para cada Node

#### Node 1: Webhook Trigger
```javascript
// Dados recebidos automaticamente do Controlia
// Estrutura:
// {
//   controlia: { company_id, contact_id, conversation_id, ... },
//   message: { from, chat, text, ... }
// }
```

#### Node 2: IF Node (Verificar IA Habilitada)
```javascript
// Verificar se deve processar com IA
const webhookData = $input.item.json.body || $input.item.json;
const controlia = webhookData.controlia || {};

// Se não houver conversation_id, processar
// (assumindo que se conversation_id existe, IA está habilitada)
return controlia.conversation_id ? true : false;
```

#### Node 3: Agent Node
```javascript
// Configurar prompt para o Agent
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const messageText = webhookData.message?.text || webhookData.text || '';

return {
  prompt: `Analise a seguinte mensagem do cliente e responda de forma profissional e útil:\n\n${messageText}\n\nTambém analise o sentimento (positive, neutral, negative) e forneça um score de confiança (0-100).`
};
```

#### Node 4: HTTP Request (Enviar Resposta)
```javascript
// Código do Exemplo 1
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};
const message = webhookData.message || {};
const aiResponse = $('Agent').first().json.output || $('Agent').first().json.text || '';

return {
  output: aiResponse,
  controlia: {
    company_id: controlia.company_id,
    contact_id: controlia.contact_id,
    conversation_id: controlia.conversation_id,
    message_id: controlia.message_id,
    channel: controlia.channel || 'telegram',
    channel_id: controlia.channel_id || message.chat?.id?.toString()
  },
  message: {
    from: message.from || controlia.message?.from,
    chat: message.chat || controlia.message?.chat
  }
};
```

#### Node 5: HTTP Request (Atualizar Contato)
```javascript
// Código do Exemplo 2
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};
const aiAnalysis = $('Agent').first().json.analysis || {};

let newScore = 0;
if (aiAnalysis.sentiment === 'positive') {
  newScore = 85;
} else if (aiAnalysis.sentiment === 'neutral') {
  newScore = 50;
} else {
  newScore = 30;
}

let newStatus = 'lead';
if (newScore >= 80) {
  newStatus = 'client';
} else if (newScore >= 50) {
  newStatus = 'prospect';
}

return {
  score: newScore,
  status: newStatus,
  custom_fields: {
    ultima_interacao: new Date().toISOString(),
    sentimento_ia: aiAnalysis.sentiment,
    confianca_ia: aiAnalysis.confidence || 0
  }
};
```

#### Node 6: HTTP Request (Atualizar Conversa)
```javascript
// Código do Exemplo 3
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const messageText = webhookData.message?.text || webhookData.text || '';

let priority = 'normal';
const lowerText = messageText.toLowerCase();

if (lowerText.includes('urgente') || lowerText.includes('emergência')) {
  priority = 'urgent';
} else if (lowerText.includes('importante') || lowerText.includes('preciso')) {
  priority = 'high';
}

return {
  priority: priority,
  subject: messageText.substring(0, 100)
};
```

---

## Exemplo 5: Extrair Dados do Webhook do Controlia

### Código para Extrair Dados Corretamente

```javascript
// Método 1: Se webhook vem como body
const webhookBody = $input.item.json.body || $input.item.json;

// Método 2: Se webhook vem direto
const webhookData = $input.item.json;

// Extrair dados do Controlia
const controlia = webhookBody.controlia || webhookData.controlia || {};
const message = webhookBody.message || webhookData.message || {};

// IDs importantes
const companyId = controlia.company_id;
const contactId = controlia.contact_id;
const conversationId = controlia.conversation_id;
const messageId = controlia.message_id;
const channel = controlia.channel || 'telegram';
const channelId = controlia.channel_id || message.chat?.id?.toString();

// Dados da mensagem
const messageText = message.text || webhookBody.text || '';
const fromId = message.from?.id;
const fromName = `${message.from?.first_name || ''} ${message.from?.last_name || ''}`.trim();
const fromUsername = message.from?.username;

// Retornar objeto estruturado
return {
  company_id: companyId,
  contact_id: contactId,
  conversation_id: conversationId,
  message_id: messageId,
  channel: channel,
  channel_id: channelId,
  message_text: messageText,
  from_id: fromId,
  from_name: fromName,
  from_username: fromUsername
};
```

---

## Exemplo 6: Criar Mensagem no Controlia

### Node: HTTP Request (Criar Mensagem)

**URL**: `https://<seu-projeto>.supabase.co/rest/v1/messages`

**Method**: `POST`

**Headers**: (mesmos dos exemplos anteriores)

**Body (JSON)**:

```javascript
// Código JavaScript para o n8n
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};
const message = webhookData.message || {};

return {
  company_id: controlia.company_id,
  conversation_id: controlia.conversation_id,
  contact_id: controlia.contact_id,
  content: message.text || '',
  sender_type: 'human', // ou 'ai' se for resposta da IA
  direction: 'inbound', // ou 'outbound' se for resposta
  status: 'sent',
  channel_message_id: message.message_id?.toString()
};
```

---

## Exemplo 7: Buscar Dados do Contato

### Node: HTTP Request (Buscar Contato)

**URL**: `https://<seu-projeto>.supabase.co/rest/v1/contacts?id=eq.{{ $json.contact_id }}&select=*`

**Method**: `GET`

**Headers**:
- `apikey`: `<SUPABASE_SERVICE_ROLE_KEY>`
- `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>`

**Código para Processar Resposta**:

```javascript
// Após buscar contato, processar dados
const contact = $input.item.json[0] || $input.item.json;

return {
  contact_id: contact.id,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  status: contact.status,
  score: contact.score,
  custom_fields: contact.custom_fields || {},
  ai_enabled: contact.ai_enabled
};
```

---

## Exemplo 8: Atualizar Campos Customizados

### Node: HTTP Request (Atualizar Campos Customizados)

**URL**: `https://<seu-projeto>.supabase.co/rest/v1/contacts?id=eq.{{ $json.contact_id }}`

**Method**: `PATCH`

**Body (JSON)**:

```javascript
// Código JavaScript para o n8n
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};

// Buscar contato atual primeiro (usar node anterior)
const currentContact = $('Buscar Contato').first().json[0] || $('Buscar Contato').first().json;
const existingCustomFields = currentContact.custom_fields || {};

// Mesclar campos customizados
const newCustomFields = {
  ...existingCustomFields,
  ultima_interacao: new Date().toISOString(),
  total_mensagens: (existingCustomFields.total_mensagens || 0) + 1,
  ultima_resposta_ia: new Date().toISOString()
};

return {
  custom_fields: newCustomFields
};
```

---

## Dicas Importantes

### 1. Sempre Valide Dados Antes de Usar

```javascript
// Verificar se dados existem antes de usar
const controlia = $input.item.json.controlia || {};
if (!controlia.contact_id) {
  throw new Error('contact_id é obrigatório');
}
```

### 2. Use Try-Catch para Tratamento de Erros

```javascript
try {
  const data = $input.item.json;
  // processar dados
  return data;
} catch (error) {
  console.error('Erro ao processar:', error);
  return { error: error.message };
}
```

### 3. Logs para Debug

```javascript
// Adicionar logs para debug
console.log('Dados recebidos:', JSON.stringify($input.item.json, null, 2));
console.log('Contact ID:', $input.item.json.controlia?.contact_id);
```

### 4. Validação de Tipos

```javascript
// Validar tipos antes de usar
const contactId = $input.item.json.controlia?.contact_id;
if (typeof contactId !== 'string' || contactId.length === 0) {
  throw new Error('contact_id inválido');
}
```

---

## Variáveis de Ambiente no n8n

Configure as seguintes variáveis de ambiente no n8n:

- `CONTROLIA_BASE_URL`: URL base do Controlia (ex: `https://seu-dominio.com`)
- `SUPABASE_URL`: URL do Supabase (ex: `https://<projeto>.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase

Use no código:

```javascript
const baseUrl = $env.CONTROLIA_BASE_URL || 'https://seu-dominio.com';
const supabaseUrl = $env.SUPABASE_URL;
const supabaseKey = $env.SUPABASE_SERVICE_ROLE_KEY;
```

---

**Última atualização**: Janeiro 2024

