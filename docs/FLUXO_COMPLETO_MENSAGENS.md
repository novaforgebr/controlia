# Fluxo Completo de Mensagens - Telegram ↔ Controlia ↔ n8n

## 📋 Resumo do Fluxo

### 1. Mensagem Recebida do Telegram → Controlia → n8n

```
Telegram → Controlia (salva no banco) → n8n (processa) → Controlia (salva resposta) → Telegram
```

**Passos detalhados:**

1. **Telegram envia mensagem** para `https://controliaa.vercel.app/api/webhooks/telegram`
2. **Controlia salva mensagem no banco** (PASSO 1)
   - `direction = 'inbound'`
   - `sender_type = 'human'`
   - Mensagem **JÁ APARECE** na interface do Controlia
3. **Controlia busca automações ativas** (PASSO 2)
   - `trigger_event = 'new_message'`
   - `is_active = true`
   - `is_paused = false`
   - Prioriza: "Atendimento com IA - Mensagens Recebidas"
4. **Controlia envia para n8n** (PASSO 3)
   - URL: `https://controlia.up.railway.app/webhook/.../webhook?secret=...`
   - Header: `X-Webhook-Secret: N0v4F0rg3@2025`
   - Payload inclui: `controlia.callback_url` para resposta

### 2. Resposta do n8n → Controlia → Telegram

```
n8n (processa) → Controlia (salva no banco) → Telegram (envia mensagem)
```

**Passos detalhados:**

1. **n8n processa mensagem** com IA Agent
2. **n8n chama callback** `https://controliaa.vercel.app/api/webhooks/n8n/channel-response`
3. **Controlia salva resposta no banco** (PASSO 1)
   - `direction = 'outbound'`
   - `sender_type = 'ai'`
   - Mensagem **JÁ APARECE** na interface do Controlia
4. **Controlia envia ao Telegram** (PASSO 2)
   - Usa `channel_thread_id` da conversa
   - Atualiza `channel_message_id` após envio

## ✅ Garantias Implementadas

### Mensagens Recebidas (Telegram → Controlia)
- ✅ Sempre salvas com `direction = 'inbound'` e `sender_type = 'human'`
- ✅ Validação automática e correção se necessário
- ✅ Mensagem aparece na interface ANTES de enviar ao n8n
- ✅ Se n8n falhar, mensagem ainda está no Controlia

### Mensagens Enviadas (n8n → Controlia → Telegram)
- ✅ Sempre salvas com `direction = 'outbound'` e `sender_type = 'ai'`
- ✅ Mensagem salva no banco ANTES de enviar ao Telegram
- ✅ Se Telegram falhar, mensagem ainda está no Controlia
- ✅ `channel_message_id` atualizado após envio bem-sucedido

## 🔧 Configurações Necessárias

### 1. Automações no Banco de Dados

Execute o script `supabase/verificar-e-corrigir-automacoes.sql` para garantir:

- ✅ "Atendimento com IA - Mensagens Recebidas" está ativa
  - `trigger_event = 'new_message'`
  - `is_active = true`
  - `is_paused = false`
  - `n8n_webhook_url` com secret na URL

- ⏸️ "Envia Mensagens do App" está pausada
  - Não deve processar mensagens recebidas do Telegram

### 2. Configurações do Telegram

- ✅ Bot Token configurado em `companies.settings.telegram_bot_token`
- ✅ Webhook URL: `https://controliaa.vercel.app/api/webhooks/telegram`
- ✅ Webhook Secret configurado (opcional, para validação)

### 3. Configurações do n8n

- ✅ Webhook Secret: `N0v4F0rg3@2025`
- ✅ Authentication: Header Auth
- ✅ Header Name: `X-Webhook-Secret`
- ✅ Workflow deve estar **ATIVO** no n8n

## 📊 Logs e Debug

### Logs do Webhook Telegram
- `📥 Webhook Telegram recebido`
- `✅ Mensagem criada com sucesso`
- `✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia`
- `📤 PASSO 3: PREPARANDO envio para n8n`
- `✅ Mensagem enviada para n8n com sucesso`

### Logs do Webhook n8n
- `💾 PASSO 1: Salvando resposta da IA no Controlia`
- `✅ Mensagem da IA salva no Controlia`
- `💾 PASSO 3: Atualizando mensagem com channel_message_id`

## 🐛 Troubleshooting

### Mensagens não aparecem na interface
1. Verificar RLS policies no Supabase
2. Verificar `company_id` nas mensagens
3. Verificar logs do console do navegador
4. Executar `supabase/testar-mensagens-conversa.sql`

### Mensagens não são enviadas ao n8n
1. Verificar se automação está ativa (`is_active = true`)
2. Verificar se automação não está pausada (`is_paused = false`)
3. Verificar `n8n_webhook_url` configurada
4. Verificar logs do webhook Telegram

### Respostas do n8n não aparecem
1. Verificar se n8n está chamando o callback
2. Verificar logs do webhook n8n
3. Verificar se `controlia.callback_url` está no payload
4. Verificar se workflow do n8n está ativo

## 📝 Scripts SQL Úteis

- `supabase/verificar-e-corrigir-automacoes.sql` - Verificar e corrigir automações
- `supabase/testar-mensagens-conversa.sql` - Testar mensagens de uma conversa
- `supabase/corrigir-visibilidade-mensagens.sql` - Corrigir problemas de RLS


