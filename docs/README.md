# Documentação Controlia CRM

Bem-vindo à documentação completa do Controlia CRM.

## Documentos Disponíveis

### 1. [API - Atualizações e Webhooks](./API_ATUALIZACOES_WEBHOOKS.md)
Documentação completa sobre:
- Endpoints de atualização
- Estrutura de dados JSON
- Webhooks disponíveis (n8n, Telegram, WhatsApp)
- Exemplos de requisições HTTP
- Tratamento de erros
- Boas práticas

### 2. [Exemplos Práticos - n8n](./EXEMPLOS_N8N_WEBHOOKS.md)
Exemplos práticos de código JavaScript para workflows n8n:
- Processar respostas da IA
- Atualizar contatos e conversas
- Workflows completos
- Extração de dados
- Tratamento de erros

## Início Rápido

### Atualizar um Contato

```bash
curl -X PATCH "https://<projeto>.supabase.co/rest/v1/contacts?id=eq.<contact_id>" \
  -H "apikey: <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "status": "client"
  }'
```

### Enviar Resposta da IA via Webhook

```bash
curl -X POST "https://seu-dominio.com/api/webhooks/n8n/channel-response" \
  -H "Content-Type: application/json" \
  -d '{
    "output": "Olá! Como posso ajudar?",
    "controlia": {
      "company_id": "<uuid>",
      "contact_id": "<uuid>",
      "conversation_id": "<uuid>",
      "channel": "telegram",
      "channel_id": "123456789"
    }
  }'
```

## Estrutura de URLs

### Webhooks
- `/api/webhooks/n8n/channel-response` - Recebe resposta do n8n
- `/api/webhooks/telegram` - Recebe mensagens do Telegram
- `/api/webhooks/whatsapp` - Recebe mensagens do WhatsApp

### API REST (Supabase)
- `https://<projeto>.supabase.co/rest/v1/contacts` - Contatos
- `https://<projeto>.supabase.co/rest/v1/conversations` - Conversas
- `https://<projeto>.supabase.co/rest/v1/messages` - Mensagens

## Campos Principais

### Contato
- `name`, `email`, `phone`, `whatsapp`, `document`
- `status`: `lead`, `prospect`, `client`, `inactive`
- `score`: 0-100
- `custom_fields`: Objeto JSON com campos customizados
- `pipeline_id`, `pipeline_stage_id`: IDs do CRM

### Conversa
- `status`: `open`, `closed`, `transferred`, `waiting`
- `priority`: `low`, `normal`, `high`, `urgent`
- `ai_assistant_enabled`: boolean
- `assigned_to`: UUID do usuário

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação específica
2. Verifique os logs do servidor
3. Consulte a documentação do Supabase

---

**Última atualização**: Janeiro 2024

