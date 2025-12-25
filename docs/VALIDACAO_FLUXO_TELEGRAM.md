# Validação do Fluxo Telegram → Controlia → n8n → Controlia → Telegram

## ✅ Status Atual

### Dados Corrigidos
- **40 mensagens humanas**: `direction = 'inbound'`, `sender_type = 'human'` ✅
- **52 mensagens IA**: `direction = 'outbound'`, `sender_type = 'ai'` ✅

**Todas as mensagens estão com direções corretas!**

## 🧪 Próximos Passos - Testes e Validação

### 1. ✅ Testar Fluxo Completo - Enviar Mensagem do Telegram

1. **Enviar uma nova mensagem do Telegram para o bot**
2. **Verificar no Controlia** (`/conversations` ou página de contatos):
   - ✅ Mensagem aparece na lista de conversas?
   - ✅ Mensagem tem `direction = 'inbound'`?
   - ✅ Mensagem tem `sender_type = 'human'`?

3. **Verificar no Banco de Dados** (SQL Editor do Supabase):
   ```sql
   -- Verificar última mensagem recebida
   SELECT 
     m.id,
     m.content,
     m.direction,
     m.sender_type,
     m.created_at,
     c.channel
   FROM messages m
   JOIN conversations c ON c.id = m.conversation_id
   WHERE c.channel = 'telegram'
   ORDER BY m.created_at DESC
   LIMIT 5;
   ```

4. **Verificar Logs de Automação**:
   ```sql
   -- Verificar se automação foi executada
   SELECT 
     al.id,
     al.automation_id,
     a.name as automation_name,
     al.status,
     al.error_message,
     al.started_at,
     al.completed_at
   FROM automation_logs al
   JOIN automations a ON a.id = al.automation_id
   WHERE al.trigger_event = 'new_message'
   ORDER BY al.created_at DESC
   LIMIT 10;
   ```

### 2. ✅ Verificar se n8n Recebeu a Mensagem

1. **No n8n Dashboard**:
   - ✅ Verificar se o workflow foi executado
   - ✅ Verificar logs do workflow
   - ✅ Verificar se recebeu os dados corretos

2. **No Controlia - Logs**:
   - Verificar console do servidor (logs do webhook Telegram)
   - Verificar se há erros relacionados ao n8n

### 3. ✅ Verificar se Resposta foi Enviada

1. **No Telegram**:
   - ✅ Verificar se recebeu resposta da IA
   - ✅ Verificar se resposta está correta

2. **No Controlia**:
   - ✅ Verificar se resposta aparece na conversa
   - ✅ Verificar se tem `direction = 'outbound'`
   - ✅ Verificar se tem `sender_type = 'ai'`

3. **No Banco de Dados**:
   ```sql
   -- Verificar última mensagem enviada (IA)
   SELECT 
     m.id,
     m.content,
     m.direction,
     m.sender_type,
     m.created_at,
     m.channel_message_id
   FROM messages m
   JOIN conversations c ON c.id = m.conversation_id
   WHERE c.channel = 'telegram'
     AND m.sender_type = 'ai'
   ORDER BY m.created_at DESC
   LIMIT 5;
   ```

### 4. ✅ Monitorar Logs do Servidor

**Verificar se as validações críticas estão funcionando:**

Procurar nos logs por:
- ✅ `✅ Mensagem criada com sucesso` - Mensagem salva
- ✅ `✅ VALIDAÇÃO CRÍTICA` - Validações executadas
- ✅ `❌ ERRO CRÍTICO` - Se houver, investigar
- ✅ `🔍 Buscando automações` - Busca de automações
- ✅ `📤 ENVIANDO para n8n` - Envio para n8n
- ✅ `✅ Mensagem enviada para n8n com sucesso` - Sucesso no envio

### 5. ✅ Verificar Automação Está Configurada Corretamente

```sql
-- Verificar automação
SELECT 
  id,
  name,
  trigger_event,
  is_active,
  is_paused,
  n8n_webhook_url,
  execution_count,
  last_executed_at
FROM automations
WHERE trigger_event = 'new_message'
  AND is_active = true
  AND is_paused = false;
```

**Verificar:**
- ✅ `is_active = true`
- ✅ `is_paused = false`
- ✅ `n8n_webhook_url` não é NULL
- ✅ `n8n_webhook_url` tem secret na URL (se necessário)

### 6. ✅ Verificar Configurações da Empresa

```sql
-- Verificar settings da empresa
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as n8n_secret,
  settings->>'telegram_bot_token' as telegram_token
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e'; -- ID da NovaForge
```

## 🔍 Troubleshooting

### Se Mensagens Não Aparecem no Controlia:

1. **Verificar logs do webhook Telegram**:
   - Procurar por erros 400/500
   - Verificar se mensagem foi salva

2. **Verificar se contato existe**:
   ```sql
   SELECT id, name, custom_fields->>'telegram_id' as telegram_id
   FROM contacts
   WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
     AND custom_fields->>'telegram_id' = '7772641515';
   ```

### Se Automação Não é Executada:

1. **Verificar se automação existe e está ativa**
2. **Verificar logs de automação** (query acima)
3. **Verificar se n8n_webhook_url está configurada**
4. **Verificar logs do servidor para ver se busca encontrou automação**

### Se n8n Não Recebe:

1. **Verificar URL do webhook**:
   - Está correta?
   - Tem secret na URL?

2. **Verificar logs do servidor**:
   - Status HTTP da resposta do n8n
   - Mensagem de erro (se houver)

3. **Verificar n8n**:
   - Webhook está ativo?
   - Authentication está configurada corretamente?

### Se Resposta IA Não É Enviada:

1. **Verificar se n8n está chamando callback**:
   - `POST /api/webhooks/n8n/channel-response`
   - Verificar logs do n8n

2. **Verificar logs do webhook channel-response**:
   - Mensagem foi salva?
   - Foi enviada para Telegram?
   - Qualquer erro?

3. **Verificar bot token do Telegram**:
   - Está configurado?
   - Está correto?

## ✅ Checklist de Validação Completa

- [ ] Script SQL executado com sucesso
- [ ] Mensagens históricas corrigidas (verificado no relatório)
- [ ] Nova mensagem do Telegram salva como `inbound` + `human`
- [ ] Automação encontrada e executada
- [ ] Log de automação criado em `automation_logs`
- [ ] n8n recebeu a mensagem
- [ ] n8n processou e retornou resposta
- [ ] Resposta salva como `outbound` + `ai`
- [ ] Resposta enviada para Telegram
- [ ] Resposta apareceu no Telegram
- [ ] Nenhum erro crítico nos logs

## 📊 Monitoramento Contínuo

Após validar tudo, recomenda-se:

1. **Monitorar logs diariamente** por alguns dias
2. **Verificar periodicamente** se há mensagens incorretas:
   ```sql
   -- Verificar mensagens incorretas (não deveria encontrar nenhuma)
   SELECT 
     m.id,
     m.direction,
     m.sender_type,
     m.created_at,
     c.channel
   FROM messages m
   JOIN conversations c ON c.id = m.conversation_id
   WHERE c.channel = 'telegram'
     AND (
       (m.direction = 'outbound' AND m.sender_type = 'human') OR
       (m.direction = 'inbound' AND m.sender_type = 'ai')
     )
   ORDER BY m.created_at DESC;
   ```

3. **Verificar contadores de automação**:
   ```sql
   SELECT 
     name,
     execution_count,
     last_executed_at,
     error_count
   FROM automations
   WHERE trigger_event = 'new_message'
   ORDER BY last_executed_at DESC;
   ```

## 🎉 Resultado Esperado

Após seguir todos os passos, você deve ter:

✅ **Fluxo completo funcionando:**
1. Mensagem do Telegram → Controlia (inbound + human)
2. Controlia → n8n (webhook executado)
3. n8n → Controlia (callback com resposta)
4. Controlia → Telegram (outbound + ai)

✅ **Dados corretos no banco:**
- Todas as mensagens com direction/sender_type corretos
- Logs de automação sendo criados
- Contadores de execução atualizados

✅ **Sem erros nos logs:**
- Nenhum erro crítico de direção incorreta
- Automações sendo encontradas e executadas
- n8n recebendo e processando corretamente

