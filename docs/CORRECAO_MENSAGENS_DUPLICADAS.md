# Correção: Mensagens Duplicadas do Telegram

## Problema

Quando um contato envia uma mensagem única via Telegram (ex: "Gostaria de agendar uma reunião"), o sistema estava processando a mesma mensagem múltiplas vezes, criando duplicatas tanto no Controlia quanto no n8n.

## Causas Identificadas

1. **Falta de Idempotência**: O webhook do Telegram não verificava se a mensagem já havia sido processada antes de criar uma nova
2. **Múltiplas Chamadas do Telegram**: O Telegram pode reenviar o mesmo webhook se não receber resposta 200 rapidamente
3. **Race Conditions**: Em casos raros, o mesmo webhook pode ser processado simultaneamente
4. **Sem Constraint Única no Banco**: Não havia uma constraint UNIQUE para prevenir duplicatas no nível do banco de dados

## Correções Aplicadas

### 1. Verificação de Idempotência Antes de Criar Mensagem

Adicionada verificação ANTES de criar a mensagem no banco:

```typescript
// ✅ Verificar se mensagem já foi processada
const { data: existingMessage } = await serviceClient
  .from('messages')
  .select('id, created_at, direction, sender_type, content')
  .eq('company_id', contact.company_id)
  .eq('conversation_id', conversation.id)
  .eq('channel_message_id', channelMessageId)
  .maybeSingle()

if (existingMessage) {
  // Retornar sucesso SEM criar duplicata e SEM enviar para n8n
  return NextResponse.json({
    success: true,
    message_id: existingMessage.id,
    already_processed: true,
    duplicate_prevented: true,
  })
}
```

### 2. Tratamento de Erros de Duplicação

Adicionado tratamento específico para erros de duplicação (código 23505 do PostgreSQL):

```typescript
if (msgError.code === '23505' || msgError.message?.includes('duplicate')) {
  // Buscar mensagem duplicada e retornar sucesso
  const { data: duplicateMessage } = await serviceClient
    .from('messages')
    .select('id, created_at, direction, sender_type')
    .eq('company_id', contact.company_id)
    .eq('conversation_id', conversation.id)
    .eq('channel_message_id', channelMessageId)
    .maybeSingle()
  
  if (duplicateMessage) {
    return NextResponse.json({
      success: true,
      message_id: duplicateMessage.id,
      already_processed: true,
    })
  }
}
```

### 3. Constraint UNIQUE no Banco de Dados

Criado script SQL para adicionar índice único composto:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_channel_conversation 
ON messages(company_id, conversation_id, channel_message_id) 
WHERE channel_message_id IS NOT NULL;
```

**Arquivo**: `supabase/prevent-duplicate-messages.sql`

### 4. Processamento de Apenas Uma Automação

Garantido que apenas UMA automação seja processada por mensagem:

```typescript
// ✅ IMPORTANTE: Processar apenas UMA automação para evitar duplicações
let automation = automations.find(...) || automations[0]

if (automations.length > 1) {
  console.warn('⚠️ Múltiplas automações encontradas - processando apenas uma')
}
```

### 5. Validação Adicional Antes de Enviar para n8n

Adicionada verificação final antes de enviar para o n8n para garantir que a mensagem ainda existe:

```typescript
// ✅ Verificar novamente antes de enviar para n8n (pode haver race condition)
const { data: verifyNewMessage } = await serviceClient
  .from('messages')
  .select('id')
  .eq('id', newMessage.id)
  .single()

if (!verifyNewMessage) {
  return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 500 })
}
```

## Arquivos Modificados

1. **`app/api/webhooks/telegram/route.ts`**:
   - Adicionada verificação de idempotência antes de criar mensagem
   - Adicionado tratamento de erros de duplicação
   - Adicionada validação antes de enviar para n8n
   - Melhorado logging para debug

2. **`supabase/prevent-duplicate-messages.sql`** (NOVO):
   - Script para criar índice único composto no banco de dados

## Como Aplicar as Correções

### 1. Aplicar Script SQL no Supabase

Execute o script `supabase/prevent-duplicate-messages.sql` no Supabase SQL Editor:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_channel_conversation 
ON messages(company_id, conversation_id, channel_message_id) 
WHERE channel_message_id IS NOT NULL;
```

### 2. Deploy do Código

O código já está corrigido em `app/api/webhooks/telegram/route.ts`. Faça deploy do código atualizado.

### 3. Verificar Automações

Verifique se há múltiplas automações configuradas para o evento `new_message`:

```sql
SELECT id, name, n8n_webhook_url, is_active, is_paused, trigger_event
FROM automations
WHERE company_id = 'SEU_COMPANY_ID'
  AND trigger_event = 'new_message'
  AND is_active = true
  AND is_paused = false;
```

Se houver múltiplas, considere:
- Desativar as automações duplicadas
- Ou configurar apenas uma automação principal que roteia para outros workflows no n8n

## Fluxo de Proteção Contra Duplicatas

1. **Webhook Recebido do Telegram**
   ↓
2. **Verificação de Idempotência** (BUSCA mensagem existente por `channel_message_id` + `conversation_id`)
   ↓
3. **Se já existe**: Retorna sucesso SEM criar e SEM enviar para n8n
   ↓
4. **Se não existe**: Cria mensagem no banco
   ↓
5. **Se erro de duplicação** (race condition): Busca mensagem existente e retorna sucesso
   ↓
6. **Verificação Final**: Confirma que mensagem foi criada antes de enviar para n8n
   ↓
7. **Envio para n8n**: Apenas UMA automação é processada por mensagem

## Testes Recomendados

1. **Teste 1 - Mensagem Simples**:
   - Envie uma mensagem via Telegram
   - Verifique se apenas UMA mensagem foi criada no Controlia
   - Verifique se o n8n recebeu apenas UMA requisição

2. **Teste 2 - Reenvio do Telegram**:
   - Simule reenvio do mesmo webhook (mesmo `update_id` e `message_id`)
   - Verifique se a segunda requisição retorna `already_processed: true`
   - Verifique se NÃO foi criada duplicata

3. **Teste 3 - Race Condition**:
   - Envie a mesma mensagem simultaneamente (simular múltiplas requisições)
   - Verifique se apenas UMA mensagem foi criada (constraint UNIQUE previne)

## Logs para Debug

O código agora inclui logs detalhados:

- `🔍 Verificando se mensagem já foi processada (idempotência)...`
- `✅ Mensagem já foi processada anteriormente (idempotência)`
- `🚫 DUPLICAÇÃO PREVENIDA - Mensagem já existe`
- `⚠️ Múltiplas automações encontradas - processando apenas uma`

## Resultado Esperado

Após as correções:
- ✅ Uma mensagem do Telegram cria apenas UMA entrada no Controlia
- ✅ Uma mensagem do Telegram envia apenas UMA requisição para o n8n
- ✅ Reenvios do Telegram não criam duplicatas
- ✅ Race conditions são tratadas corretamente
- ✅ Constraint UNIQUE no banco previne duplicatas mesmo em casos extremos

## Próximos Passos

Se ainda houver duplicatas após as correções:

1. Verifique os logs do Vercel para identificar padrões
2. Verifique se há múltiplas automações ativas
3. Verifique se o índice UNIQUE foi criado corretamente no banco
4. Verifique se há múltiplos webhooks do Telegram configurados (pode causar múltiplos recebimentos)

