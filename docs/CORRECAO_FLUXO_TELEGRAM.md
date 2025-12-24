# Correção Crítica: Fluxo Telegram → Controlia → n8n → Controlia → Telegram

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Webhook Telegram (`app/api/webhooks/telegram/route.ts`)**

#### ✅ Validação Crítica Após Salvar Mensagem
- **Adicionada validação** para garantir que mensagens recebidas sejam SEMPRE:
  - `direction = 'inbound'`
  - `sender_type = 'human'`
- Se detectar valores incorretos, **tenta corrigir automaticamente no banco**
- **Loga erro crítico** para monitoramento

```typescript
// ✅ VALIDAÇÃO CRÍTICA: Garantir que mensagem recebida seja SEMPRE 'inbound' e 'human'
if (newMessage.direction !== 'inbound') {
  console.error('❌ ERRO CRÍTICO: Mensagem recebida salva como outbound!')
  // Tenta corrigir no banco...
}

if (newMessage.sender_type !== 'human') {
  console.error('❌ ERRO CRÍTICO: Mensagem humana salva com sender_type incorreto!')
  // Tenta corrigir no banco...
}
```

#### ✅ Garantia de Busca de Automações
- **Sempre busca automações** após salvar mensagem
- **Loga erro crítico** se não encontrar (mas não falha o webhook)
- Busca TODAS as automações da empresa para debug se não encontrar nenhuma ativa

```typescript
// ✅ VALIDAÇÃO CRÍTICA: Logar ERRO CRÍTICO se não encontrar automações
if (!automations || automations.length === 0) {
  console.error('❌ CRÍTICO: Nenhuma automação encontrada!')
  // Loga detalhes para debug...
  // NÃO falhar o webhook, mas logar o erro crítico
}
```

#### ✅ Garantia de Envio para n8n
- **Sempre tenta enviar para n8n** se houver automação com URL configurada
- **Valida URL** antes de enviar
- **Registra log de erro** se automação não tiver URL configurada
- **Tratamento robusto de erros** (não falha webhook se n8n falhar)

```typescript
if (!automation.n8n_webhook_url) {
  console.error('❌ CRÍTICO: Automação sem n8n_webhook_url!')
  // Registra log de erro...
} else {
  // ✅ SEMPRE tentar enviar para n8n se houver URL
  try {
    // Envia para n8n...
  } catch (n8nError) {
    // Registra erro mas não falha webhook...
  }
}
```

### 2. **Webhook n8n Channel Response (`app/api/webhooks/n8n/channel-response/route.ts`)**

#### ✅ Validação Crítica Após Salvar Mensagem IA
- **Adicionada validação** para garantir que respostas da IA sejam SEMPRE:
  - `direction = 'outbound'`
  - `sender_type = 'ai'`
- Se detectar valores incorretos, **tenta corrigir automaticamente no banco**
- **Loga erro crítico** para monitoramento

```typescript
// ✅ VALIDAÇÃO CRÍTICA: Garantir que resposta IA seja SEMPRE 'outbound' e 'ai'
if (messageResult.direction !== 'outbound') {
  console.error('❌ ERRO CRÍTICO: Resposta IA salva como inbound!')
  // Tenta corrigir no banco...
}

if (messageResult.sender_type !== 'ai') {
  console.error('❌ ERRO CRÍTICO: Resposta IA salva com sender_type incorreto!')
  // Tenta corrigir no banco...
}
```

### 3. **Script SQL de Correção (`supabase/fix-message-directions.sql`)**

#### ✅ Script para Corrigir Dados Históricos Incorretos
- Corrige mensagens humanas do Telegram marcadas como `outbound` → `inbound`
- Corrige mensagens IA marcadas como `inbound` → `outbound`
- Corrige `sender_type` incorretos
- **Apenas corrige últimos 7 dias** (segurança)
- **Relatório de distribuição** após correção

```sql
-- CORRIGIR: Mensagens humanas marcadas como outbound
UPDATE messages m
SET direction = 'inbound'
WHERE m.direction = 'outbound'
  AND m.sender_type = 'human'
  AND EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = m.conversation_id AND c.channel = 'telegram'
  )
  AND m.created_at >= NOW() - INTERVAL '7 days';

-- CORRIGIR: Mensagens IA marcadas como inbound
UPDATE messages m
SET direction = 'outbound'
WHERE m.direction = 'inbound'
  AND m.sender_type = 'ai'
  -- ...
```

## 🔄 FLUXO CORRETO IMPLEMENTADO

```
1. Usuário envia mensagem no Telegram
   ↓
2. Telegram → Controlia (/api/webhooks/telegram)
   ↓
3. Controlia salva mensagem:
   ✅ direction: 'inbound'
   ✅ sender_type: 'human'
   ✅ channel: 'telegram'
   ↓
4. ✅ VALIDAÇÃO: Verifica se direction/sender_type estão corretos
   ✅ Se incorretos, corrige automaticamente
   ↓
5. Controlia busca automação ativa:
   ✅ trigger_event = 'new_message'
   ✅ is_active = true
   ✅ is_paused = false
   ↓
6. ✅ VALIDAÇÃO: Loga erro crítico se não encontrar
   ↓
7. Controlia envia para n8n:
   ✅ POST para n8n_webhook_url
   ✅ Secret na URL ou header
   ✅ Registra log de automação (sucesso/erro)
   ↓
8. n8n processa com IA
   ↓
9. n8n retorna para Controlia:
   ✅ POST /api/webhooks/n8n/channel-response
   ↓
10. Controlia salva resposta:
    ✅ direction: 'outbound'
    ✅ sender_type: 'ai'
    ↓
11. ✅ VALIDAÇÃO: Verifica se direction/sender_type estão corretos
    ✅ Se incorretos, corrige automaticamente
    ↓
12. Controlia envia para Telegram via API
```

## 🧪 VALIDAÇÕES OBRIGATÓRIAS

Após implementação, validar:

1. ✅ Mensagem recebida do Telegram → `direction = 'inbound'`, `sender_type = 'human'`
2. ✅ Automação é sempre buscada após salvar mensagem
3. ✅ n8n sempre recebe a mensagem se automação existir
4. ✅ Resposta do n8n → `direction = 'outbound'`, `sender_type = 'ai'`
5. ✅ Resposta sempre é enviada para Telegram
6. ✅ Erros são sempre logados em `automation_logs`

## 📊 TESTES NECESSÁRIOS

### Teste 1: Enviar mensagem do Telegram
- ✅ Verificar se aparece no Controlia
- ✅ Verificar `direction = 'inbound'`
- ✅ Verificar `sender_type = 'human'`
- ✅ Verificar se automação foi executada (logs em `automation_logs`)

### Teste 2: Verificar envio para n8n
- ✅ Verificar logs de automação
- ✅ Verificar se n8n recebeu (logs do n8n)

### Teste 3: Simular resposta do n8n
- ✅ POST para `/api/webhooks/n8n/channel-response`
- ✅ Verificar se aparece no Controlia
- ✅ Verificar `direction = 'outbound'`
- ✅ Verificar `sender_type = 'ai'`
- ✅ Verificar se foi enviada para Telegram

## 📝 PRÓXIMOS PASSOS

1. **Executar script SQL** para corrigir dados históricos:
   ```bash
   psql -d your_database -f supabase/fix-message-directions.sql
   ```

2. **Monitorar logs** após deploy:
   - Verificar se não há mais erros de direção incorreta
   - Verificar se automações estão sendo executadas
   - Verificar se logs estão sendo criados

3. **Testar fluxo completo**:
   - Enviar mensagem do Telegram
   - Verificar se aparece no Controlia com direção correta
   - Verificar se n8n recebeu
   - Verificar se resposta foi enviada de volta

## ⚠️ NOTAS IMPORTANTES

- **As validações corrigem automaticamente** valores incorretos no banco
- **Erros são sempre logados** mas não falham o webhook (para não perder mensagens)
- **Script SQL corrige apenas últimos 7 dias** por segurança
- **Logs detalhados** foram adicionados para facilitar debug

