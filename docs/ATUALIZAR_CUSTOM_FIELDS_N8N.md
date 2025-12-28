# Como Atualizar Campos Customizados do Controlia via n8n

Este guia mostra como atualizar `custom_fields` de um contato diretamente no webhook de resposta do n8n.

---

## 🎯 Método Recomendado: Usar o Webhook de Resposta

O endpoint `/api/webhooks/n8n/channel-response` agora suporta atualização automática de `custom_fields`!

### Configuração no n8n

No seu nó **HTTP Request** que envia a resposta ao Controlia:

**URL**: `={{ $json.controlia?.callback_url || 'https://controliaa.vercel.app/api/webhooks/n8n/channel-response' }}`

**Method**: `POST`

**Body (JSON)** - Use este código JavaScript:

```javascript
// Obter dados do webhook original
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const controlia = webhookData.controlia || {};
const message = webhookData.message || {};

// Obter resposta da IA
const agentResponse = $('Agent').first().json;
const output = agentResponse.output || agentResponse.text || agentResponse.response;

// Extrair análise da IA (se disponível)
const analysis = agentResponse.analysis || {};
const metadata = agentResponse.metadata || {};

// Preparar campos customizados para atualizar
const customFields = {
  // Exemplo: Data da última interação com IA
  ultima_interacao_ia: new Date().toISOString(),
  
  // Exemplo: Sentimento detectado pela IA
  sentimento_detectado: analysis.sentiment || 'neutral',
  
  // Exemplo: Confiança da resposta da IA
  confianca_ia: analysis.confidence || 0,
  
  // Exemplo: Intenção detectada
  intencao_detectada: analysis.intent || null,
  
  // Exemplo: Contador de interações (incrementar)
  total_interacoes_ia: (metadata.interaction_count || 0) + 1,
  
  // Exemplo: Resumo da última resposta (primeiros 200 caracteres)
  ultima_resposta_ia: output ? output.substring(0, 200) : null,
  
  // Exemplo: Entidades extraídas (como JSON string)
  entidades_extraidas: analysis.entities ? JSON.stringify(analysis.entities) : null,
  
  // Exemplo: Tópico principal da conversa
  topico_principal: analysis.main_topic || null,
  
  // Exemplo: Se precisa de atenção humana
  precisa_atencao_humana: analysis.needs_human_attention || false,
  
  // Exemplo: Se o problema foi resolvido
  problema_resolvido: analysis.resolved || false
};

// Retornar payload completo
return {
  // Resposta da IA que será enviada ao canal (Telegram, WhatsApp, etc.)
  output: output,
  
  // Dados do Controlia (obrigatórios - já vêm do webhook original)
  controlia: {
    company_id: controlia.company_id,
    contact_id: controlia.contact_id,
    conversation_id: controlia.conversation_id,
    message_id: controlia.message_id,
    channel: controlia.channel || 'telegram',
    channel_id: controlia.channel_id || message.chat?.id?.toString()
  },
  
  // Dados da mensagem original (opcional, mas recomendado)
  message: {
    from: message.from || controlia.message?.from,
    chat: message.chat || controlia.message?.chat
  },
  
  // ✅ NOVO: Campos customizados para atualizar no contato
  custom_fields: customFields
};
```

---

## 📋 Exemplo Simplificado (Baseado no Seu Caso)

Baseado no seu payload atual, aqui está um exemplo simplificado:

```javascript
// Versão simplificada - apenas atualiza campos básicos
return {
  output: $('Agent').first().json.output,
  controlia: $json.controlia,
  message: $json.message,
  custom_fields: {
    ultima_interacao_ia: new Date().toISOString(),
    sentimento: 'positive', // ou extrair da análise da IA
    total_interacoes: 1 // ou incrementar de um valor existente
  }
};
```

---

## 🔧 Como Funciona

1. **Recebimento**: O webhook recebe o payload com `custom_fields`
2. **Mapeamento**: Se as chaves forem UUIDs (field_id), converte para field_key automaticamente
3. **Busca do Contato**: Busca o contato pelo `contact_id` fornecido
4. **Mesclagem**: Mescla os novos campos com os existentes (novos sobrescrevem existentes)
5. **Validação**: Valida os tipos dos campos baseado nas definições em `contact_custom_fields`
6. **Atualização**: Atualiza o contato no banco de dados
7. **Envio**: Envia a resposta da IA ao canal (Telegram, WhatsApp, etc.)

## 🔑 Usando field_id (UUID) ou field_key

O sistema aceita **tanto `field_id` (UUID) quanto `field_key`** como chave nos `custom_fields`:

### Opção 1: Usando field_key (recomendado - mais legível)

```javascript
custom_fields: {
  interesse: "alto",
  historico_tratamento: "não identificado",
  data_agendamento: "2025-01-15"
}
```

### Opção 2: Usando field_id (UUID)

```javascript
custom_fields: {
  "bf042502-2b5c-4aea-9d46-e26db2223a83": "alto",
  "outro-uuid-aqui": "não identificado",
  "mais-um-uuid": "2025-01-15"
}
```

### Opção 3: Misturando field_id e field_key

```javascript
custom_fields: {
  "bf042502-2b5c-4aea-9d46-e26db2223a83": "alto", // field_id (UUID)
  historico_tratamento: "não identificado", // field_key
  data_agendamento: "2025-01-15" // field_key
}
```

**Como funciona:**
- O sistema detecta automaticamente se a chave é um UUID (field_id) ou field_key
- Se for UUID, busca o field_key correspondente na tabela `contact_custom_fields`
- Salva sempre usando o field_key correto no banco de dados
- Logs detalhados são gerados para debug

---

## 📝 Tipos de Campos Suportados

Os campos são automaticamente convertidos baseado no tipo definido em `contact_custom_fields`:

- **text**: String (padrão)
- **number**: Convertido para número
- **boolean**: Convertido para true/false
- **date**: Convertido para ISO string

### Exemplo de Conversão Automática

Se você tem um campo customizado `score_ia` do tipo `number`:

```javascript
custom_fields: {
  score_ia: "85" // String será convertida para número 85
}
```

Se você tem um campo `precisa_atencao` do tipo `boolean`:

```javascript
custom_fields: {
  precisa_atencao: "true" // String será convertida para boolean true
}
```

---

## 🎨 Exemplo Completo com Análise de IA

```javascript
const webhookData = $('Webhook').first().json.body || $('Webhook').first().json;
const agentResponse = $('Agent').first().json;

// Extrair análise completa da IA
const analysis = agentResponse.analysis || {};
const metadata = agentResponse.metadata || {};

// Obter resposta da IA
const output = agentResponse.output || agentResponse.text;

// Preparar todos os campos customizados
const customFields = {
  // Campos de data/hora
  ultima_interacao_ia: new Date().toISOString(),
  data_ultima_resposta: new Date().toISOString(),
  
  // Campos de análise de sentimento
  sentimento: analysis.sentiment || 'neutral',
  confianca_sentimento: analysis.sentiment_confidence || 0,
  
  // Campos de intenção
  intencao: analysis.intent || null,
  confianca_intencao: analysis.intent_confidence || 0,
  
  // Campos numéricos
  total_interacoes: (metadata.interaction_count || 0) + 1,
  score_satisfacao: analysis.satisfaction_score || null,
  tempo_resposta_ms: metadata.response_time || null,
  
  // Campos de texto
  topico_principal: analysis.main_topic || null,
  resumo_conversa: analysis.summary?.substring(0, 500) || null,
  palavras_chave: analysis.keywords?.join(', ') || null,
  
  // Campos booleanos
  precisa_atencao_humana: analysis.needs_human_attention || false,
  resolvido: analysis.resolved || false,
  escalado: analysis.escalated || false,
  
  // Campos complexos (como JSON string)
  entidades: analysis.entities ? JSON.stringify(analysis.entities) : null,
  contexto_completo: analysis.full_context ? JSON.stringify(analysis.full_context) : null
};

return {
  output: output,
  controlia: webhookData.controlia,
  message: webhookData.message,
  custom_fields: customFields
};
```

---

## ⚠️ Observações Importantes

1. **Campos Existentes**: Os novos campos são mesclados com os existentes. Campos novos são adicionados, campos existentes são atualizados.

2. **Validação de Tipos**: O sistema valida automaticamente os tipos baseado nas definições em `contact_custom_fields`. Se um campo não existir na definição, será salvo como está.

3. **Erros Não Bloqueiam**: Se houver erro ao atualizar `custom_fields`, o processo continua e a resposta da IA ainda é enviada ao canal.

4. **Logs**: Verifique os logs do servidor para ver se os campos foram atualizados corretamente.

---

## 🧪 Testando

Para testar, envie uma mensagem pelo Telegram e verifique:

1. A resposta da IA é enviada ao canal ✅
2. Os `custom_fields` são atualizados no contato ✅
3. Os valores aparecem no modal de informações do contato ✅

---

## 📚 Referências

- [Exemplos Completos de Webhooks n8n](./EXEMPLOS_N8N_WEBHOOKS.md)
- [Configuração Completa de Webhooks](./CONFIGURACAO_WEBHOOKS_COMPLETA.md)

