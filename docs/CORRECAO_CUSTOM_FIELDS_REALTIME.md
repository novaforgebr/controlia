# Correção: Custom Fields e Realtime

Este documento explica as correções implementadas e os passos necessários para resolver os problemas.

## 🔧 Problemas Identificados

1. **Custom_fields não aparecem após atualização via n8n**
2. **Erro CHANNEL_ERROR no Realtime**
3. **Novos contatos não aparecem sem recarregar a página**

## ✅ Correções Implementadas

### 1. Suporte para field_id (UUID) e field_key
- O sistema agora aceita tanto `field_id` (UUID) quanto `field_key` como chave nos `custom_fields`
- Mapeamento automático de `field_id` → `field_key` antes de salvar

### 2. Subscription Realtime no ContactDetailsModal
- Adicionada subscription Realtime para escutar mudanças no contato
- Os custom_fields são atualizados automaticamente quando alterados via webhook

### 3. Melhorias no tratamento de erros do Realtime
- Logs mais detalhados sobre erros de Realtime
- Mensagens informativas sobre como resolver problemas

## 📋 Passos Necessários

### Passo 1: Habilitar Realtime no Banco de Dados

Execute o script SQL no Supabase:

```sql
-- Arquivo: supabase/enable-realtime-all.sql
```

Este script habilita o Realtime para as tabelas:
- `messages` (mensagens)
- `conversations` (conversas)
- `contacts` (contatos - para atualizar custom_fields)

**Como executar:**
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `supabase/enable-realtime-all.sql`
4. Execute o script

### Passo 2: Verificar se o Realtime está habilitado

Execute esta query para verificar:

```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename IN ('messages', 'conversations', 'contacts')
ORDER BY tablename;
```

**Resultado esperado:** 3 linhas (uma para cada tabela)

Se não retornar todas as linhas, execute o script novamente.

### Passo 3: Verificar Políticas RLS

Certifique-se de que as políticas RLS permitem leitura das tabelas:

```sql
-- Verificar políticas para messages
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Verificar políticas para conversations
SELECT * FROM pg_policies WHERE tablename = 'conversations';

-- Verificar políticas para contacts
SELECT * FROM pg_policies WHERE tablename = 'contacts';
```

## 🧪 Teste

### Teste 1: Custom Fields via n8n

1. Envie uma mensagem pelo Telegram
2. No n8n, envie uma resposta com `custom_fields`:

```javascript
{
  output: "Resposta da IA",
  controlia: {
    company_id: "...",
    contact_id: "...",
    conversation_id: "...",
    message_id: "...",
    channel: "telegram",
    channel_id: "..."
  },
  custom_fields: {
    "bf042502-2b5c-4aea-9d46-e26db2223a83": "valor", // field_id (UUID)
    interesse: "alto", // field_key
    historico_tratamento: "não identificado"
  }
}
```

3. Abra o modal de informações do contato
4. Verifique se os campos foram atualizados (sem recarregar a página)

### Teste 2: Novas Conversas

1. Envie uma mensagem de um novo contato pelo Telegram
2. Verifique se a conversa aparece na lista sem recarregar a página

### Teste 3: Mensagens em Tempo Real

1. Envie uma mensagem pelo Telegram
2. Verifique se a mensagem aparece na conversa sem recarregar a página

## 🔍 Debug

### Verificar Logs do Servidor

Os logs do servidor mostrarão:
- Campos recebidos do n8n
- Mapeamento field_id → field_key
- Campos validados
- Resultado da atualização

### Verificar Logs do Navegador

Os logs do navegador mostrarão:
- Status da subscription Realtime
- Mensagens recebidas via Realtime
- Erros de conexão (se houver)

## ⚠️ Problemas Comuns

### Erro: CHANNEL_ERROR

**Causa:** Realtime não habilitado para a tabela

**Solução:** Execute o script `supabase/enable-realtime-all.sql`

### Custom Fields não aparecem

**Causa 1:** Modal não está escutando mudanças
**Solução:** Feche e abra o modal novamente (a subscription Realtime foi adicionada)

**Causa 2:** Campos não foram atualizados no banco
**Solução:** Verifique os logs do servidor para ver se houve erro na atualização

### Novas conversas não aparecem

**Causa:** Realtime não habilitado para `conversations`
**Solução:** Execute o script `supabase/enable-realtime-all.sql`

## 📝 Notas Importantes

1. O sistema aceita tanto `field_id` (UUID) quanto `field_key` como chave
2. O mapeamento é automático - você pode misturar ambos no mesmo payload
3. Os campos são sempre salvos usando `field_key` no banco de dados
4. O Realtime é necessário para atualizações em tempo real
5. Se o Realtime falhar, o sistema usa fallback (recarregamento periódico)

