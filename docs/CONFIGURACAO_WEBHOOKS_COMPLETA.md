# Configuração Completa de Webhooks

## 🎯 Objetivo

Configurar todas as integrações de webhook para garantir o fluxo completo:
- Telegram → Controlia → n8n → Controlia → Telegram

## 📋 Pré-requisitos

1. Bot Token do Telegram configurado
2. Secret do n8n configurado
3. Workflows do n8n criados e ativos
4. URLs dos webhooks do n8n

## 🚀 Passo a Passo

### 1. Configurar Webhook do Telegram

O webhook do Telegram deve apontar para:
```
https://controliaa.vercel.app/api/webhooks/telegram
```

#### Opção A: Via Script Automático
```bash
npx tsx scripts/configurar-webhooks-completo.ts
```

#### Opção B: Via Interface
1. Acesse: **Configurações > Integrações > Telegram**
2. Insira o **Bot Token**
3. O webhook será configurado automaticamente ao salvar

#### Opção C: Via API do Telegram (Manual)
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://controliaa.vercel.app/api/webhooks/telegram"}'
```

### 2. Configurar Automações no Banco de Dados

Execute o script SQL no Supabase SQL Editor:
```sql
-- Arquivo: supabase/verificar-e-corrigir-automacoes.sql
```

Este script irá:
- ✅ Verificar todas as automações
- ✅ Ativar "Atendimento com IA - Mensagens Recebidas"
- ✅ Pausar "Envia Mensagens do App" (não processa mensagens recebidas)
- ✅ Configurar URLs e Workflow IDs

### 3. Configurar Secret do n8n

1. Acesse: **Configurações > Integrações > n8n**
2. Insira o **Webhook Secret do n8n**: `N0v4F0rg3@2025`
3. Salve as configurações

### 4. Verificar Automações n8n

#### Automação: "Atendimento com IA - Mensagens Recebidas"
- ✅ **Trigger Event**: `new_message`
- ✅ **Status**: Ativa (`is_active = true`)
- ✅ **Pausada**: Não (`is_paused = false`)
- ✅ **Webhook URL**: `https://controlia.up.railway.app/webhook/.../webhook?secret=...`
- ✅ **Workflow ID**: `EW96u6Ji0AqtS7up`

#### Automação: "Envia Mensagens do App"
- ⏸️ **Status**: Pausada (`is_paused = true`)
- ℹ️ Esta automação é apenas para mensagens enviadas pelo app, não recebidas

### 5. Configurar Workflow no n8n

#### 5.1. Webhook Trigger (n8n)
1. Acesse o workflow no n8n
2. Configure o nó **Webhook**:
   - **Authentication**: Header Auth
   - **Header Name**: `X-Webhook-Secret`
   - **Header Value**: `N0v4F0rg3@2025`
   - **HTTP Method**: POST
   - **Path**: `/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`

#### 5.2. HTTP Request (Callback)
Configure o nó **HTTP Request** para enviar resposta:
- **Method**: POST
- **URL**: `https://controliaa.vercel.app/api/webhooks/n8n/channel-response`
- **Body**: JSON com:
  ```json
  {
    "output": "{{ $json.ai_response }}",
    "controlia": {
      "company_id": "{{ $json.controlia.company_id }}",
      "contact_id": "{{ $json.controlia.contact_id }}",
      "conversation_id": "{{ $json.controlia.conversation_id }}",
      "channel": "telegram",
      "channel_id": "{{ $json.message.chat.id }}"
    }
  }
  ```

#### 5.3. Ativar Workflow
⚠️ **IMPORTANTE**: O workflow deve estar **ATIVO** no n8n!
- Clique no toggle no canto superior direito do editor
- O workflow deve estar verde (ativo)

## ✅ Validação

### 1. Verificar Webhook do Telegram
```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

Deve retornar:
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    "pending_update_count": 0
  }
}
```

### 2. Testar Fluxo Completo

1. **Envie uma mensagem pelo Telegram**
2. **Verifique os logs**:
   - Vercel: Logs do webhook do Telegram
   - n8n: Execuções do workflow
   - Vercel: Logs do webhook do n8n
3. **Verifique na interface**:
   - Mensagem recebida aparece na conversa
   - Resposta da IA aparece na conversa
   - Resposta é enviada ao Telegram

### 3. Executar Script de Validação
```bash
npx tsx scripts/configurar-webhooks-completo.ts
```

O script irá:
- ✅ Verificar status do webhook do Telegram
- ✅ Verificar configurações das automações
- ✅ Mostrar relatório completo

## 🐛 Troubleshooting

### Webhook do Telegram não recebe mensagens
1. Verifique se o webhook está configurado:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Verifique se a URL está correta
3. Verifique se há erros pendentes no webhook

### Mensagens não são enviadas ao n8n
1. Verifique se a automação está ativa (`is_active = true`)
2. Verifique se a automação não está pausada (`is_paused = false`)
3. Verifique se `n8n_webhook_url` está configurada
4. Verifique os logs do webhook do Telegram

### Respostas do n8n não aparecem
1. Verifique se o workflow está ativo no n8n
2. Verifique se o callback está sendo chamado
3. Verifique os logs do webhook do n8n
4. Verifique se `controlia.callback_url` está no payload

### Erro 403 do n8n
1. Verifique se o secret está correto
2. Verifique se o secret está sendo enviado como header `X-Webhook-Secret`
3. Verifique se o secret na URL está codificado corretamente (`@` → `%40`)

## 📝 Checklist Final

- [ ] Webhook do Telegram configurado e apontando para Controlia
- [ ] Secret do n8n configurado nas settings da empresa
- [ ] Automação "Atendimento com IA - Mensagens Recebidas" ativa
- [ ] Automação "Envia Mensagens do App" pausada
- [ ] Workflow do n8n ativo
- [ ] Webhook do n8n configurado com Header Auth
- [ ] Callback do n8n configurado para enviar respostas
- [ ] Teste completo realizado com sucesso

## 🔗 URLs Importantes

- **Webhook Telegram**: `https://controliaa.vercel.app/api/webhooks/telegram`
- **Callback n8n**: `https://controliaa.vercel.app/api/webhooks/n8n/channel-response`
- **Webhook n8n**: `https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook`

## 📚 Documentação Adicional

- [Fluxo Completo de Mensagens](./FLUXO_COMPLETO_MENSAGENS.md)
- [Script SQL de Automações](../supabase/verificar-e-corrigir-automacoes.sql)
- [Script de Configuração](../scripts/configurar-webhooks-completo.ts)


