# Configuração do Realtime para Mensagens

## Problema
As mensagens não apareciam em tempo real na página de conversas, sendo necessário recarregar a página para visualizar novas mensagens.

## Solução

### 1. Habilitar Realtime no Supabase

O Supabase Realtime precisa estar habilitado para a tabela `messages`. Execute o script SQL abaixo no Supabase SQL Editor:

```sql
-- Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Configurar REPLICA IDENTITY FULL para garantir replicação completa
ALTER TABLE messages REPLICA IDENTITY FULL;
```

**Arquivo:** `supabase/enable-realtime-messages.sql`

### 2. Verificar Configuração

Para verificar se o Realtime está habilitado, execute:

```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'messages';
```

Se retornar uma linha com `pubname = 'supabase_realtime'`, o Realtime está habilitado corretamente.

### 3. Melhorias no Código

O código do `ChatWindow.tsx` foi melhorado para:

- ✅ Usar dados do payload Realtime diretamente (mais rápido)
- ✅ Adicionar reconexão automática em caso de falha
- ✅ Melhor tratamento de erros e logging
- ✅ Fallback para recarregar mensagens se a subscription falhar
- ✅ Evitar duplicatas de mensagens

## Como Executar

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/enable-realtime-messages.sql`
4. Execute o script
5. Verifique se não há erros

### Opção 2: Via CLI (se configurado)

```bash
# Se você tem o Supabase CLI configurado
supabase db execute -f supabase/enable-realtime-messages.sql
```

## Verificação Pós-Configuração

Após executar o script:

1. **Teste enviando uma mensagem** em uma conversa
2. **Verifique o console do navegador** - deve aparecer:
   - `📡 Status da subscription Realtime: SUBSCRIBED`
   - `🆕 Realtime: Nova mensagem recebida:`
   - `✅ Realtime: Mensagem adicionada. Total: X`

3. **A mensagem deve aparecer automaticamente** sem recarregar a página

## Troubleshooting

### Mensagens ainda não aparecem em tempo real

1. **Verifique se o Realtime está habilitado:**
   ```sql
   SELECT * FROM pg_publication_tables WHERE tablename = 'messages';
   ```

2. **Verifique o console do navegador** para erros de subscription

3. **Verifique se há políticas RLS bloqueando:**
   - As políticas RLS devem permitir SELECT na tabela messages
   - O usuário deve ter acesso à empresa (company_id)

4. **Verifique a conexão WebSocket:**
   - Abra o DevTools → Network → WS (WebSocket)
   - Deve haver uma conexão ativa com o Supabase

### Erro: "relation does not exist" ou "permission denied"

- Certifique-se de estar executando o script como superuser ou com permissões adequadas
- Verifique se a tabela `messages` existe

### Subscription não conecta

- Verifique se o Supabase Realtime está habilitado no projeto
- Verifique as configurações de Realtime no Supabase Dashboard
- Verifique se há problemas de firewall bloqueando WebSockets

## Notas Importantes

- O Realtime funciona através de PostgreSQL Logical Replication
- As políticas RLS continuam funcionando normalmente
- O REPLICA IDENTITY FULL garante que todas as colunas sejam replicadas
- A subscription é específica por conversa (filtro por `conversation_id`)
- O código inclui reconexão automática em caso de falha

## Arquivos Modificados

- `supabase/enable-realtime-messages.sql` - Script SQL para habilitar Realtime
- `components/conversations/ChatWindow.tsx` - Melhorias na subscription Realtime


