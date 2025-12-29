# Resolução: Erro CHANNEL_ERROR no Realtime

## ✅ Status Atual

Você executou o script `enable-realtime-all.sql` e recebeu:
```
Success. No rows returned
```

**Isso é NORMAL!** Scripts DDL (Data Definition Language) como `ALTER PUBLICATION` e `ALTER TABLE` não retornam linhas quando executados com sucesso.

---

## 🔍 Verificação

Execute o script de verificação para confirmar que o Realtime está habilitado:

```sql
-- Arquivo: supabase/verificar-realtime.sql
```

Ou execute manualmente:

```sql
-- Verificar se as tabelas estão na publicação
SELECT 
  pubname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations', 'contacts')
ORDER BY tablename;
```

**Resultado esperado**: 3 linhas (uma para cada tabela)

---

## 📋 Sobre os Triggers

Os 4 triggers encontrados na tabela `messages` são **normais** e **não interferem** no Realtime:

1. `trigger_auto_disable_ai_on_human_message` - Desabilita IA quando humano responde
2. `trigger_update_channel_stats` - Atualiza estatísticas do canal
3. `update_contact_interaction` - Atualiza última interação do contato
4. `update_conversation_message` - Atualiza última mensagem da conversa

**Por que não interferem?**
- Triggers são executados no servidor PostgreSQL
- Realtime captura eventos do WAL (Write-Ahead Log)
- Ambos funcionam independentemente

---

## 🚀 Próximos Passos

### 1. Verificar se está habilitado

Execute:
```sql
SELECT 
  pubname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';
```

Se retornar 1 linha → ✅ Realtime está habilitado
Se não retornar nada → ❌ Execute novamente `enable-realtime-all.sql`

---

### 2. Verificar REPLICA IDENTITY

Execute:
```sql
SELECT 
  n.nspname as schema,
  c.relname as tabela,
  CASE c.relreplident
    WHEN 'f' THEN 'FULL ✅'
    ELSE 'NÃO É FULL ❌'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'messages' 
  AND n.nspname = 'public';
```

Deve retornar: `FULL ✅`

---

### 3. Verificar no Dashboard do Supabase

1. Acesse o **Dashboard do Supabase**
2. Vá em **Settings > API**
3. Verifique se **Realtime** está habilitado
4. Se não estiver, **habilite** e salve

---

### 4. Testar no Navegador

1. Abra o **Console do Navegador** (F12)
2. Abra uma conversa
3. Envie uma mensagem
4. Procure por:
   - ✅ `📡 Status da subscription Realtime: SUBSCRIBED`
   - ✅ `✅ Realtime: Subscription ativa para conversa: [id]`

Se aparecer `CHANNEL_ERROR`, continue para a próxima seção.

---

## 🔧 Se Ainda Estiver com CHANNEL_ERROR

### Solução 1: Verificar RLS (Row Level Security)

O Realtime respeita as políticas RLS. Verifique se o usuário tem permissão SELECT:

```sql
-- Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'messages';
```

Se não houver políticas permissivas, crie uma:

```sql
-- Permitir que usuários autenticados vejam mensagens de suas empresas
CREATE POLICY "Users can view messages from their company"
ON messages
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);
```

---

### Solução 2: Verificar Conectividade WebSocket

O Realtime usa WebSocket (WSS). Verifique:

1. **Console do navegador**: Procure por erros de WebSocket
2. **Firewall**: Permite conexões WSS?
3. **Proxy**: Não está bloqueando?

---

### Solução 3: Usar Fallback (Já Ativo)

O sistema já possui fallback automático:
- Tenta reconectar até 5 vezes
- Se falhar, ativa polling (recarrega a cada 3 segundos)
- Continua funcionando normalmente

**Você verá no console**:
```
❌ Máximo de tentativas de reconexão atingido. Usando fallback de polling...
📡 Ativando fallback: recarregando mensagens a cada 3 segundos
```

Isso significa que o sistema está funcionando, apenas sem atualizações instantâneas.

---

## 📊 Checklist Completo

Execute este checklist para diagnosticar:

- [ ] Script `enable-realtime-all.sql` executado com sucesso
- [ ] Verificação mostra 3 tabelas na publicação
- [ ] REPLICA IDENTITY está FULL para todas as tabelas
- [ ] Realtime habilitado no Dashboard do Supabase
- [ ] Políticas RLS permitem SELECT na tabela messages
- [ ] Console do navegador não mostra erros de WebSocket
- [ ] Teste: Enviar mensagem e verificar se aparece em tempo real

---

## 🎯 Resultado Esperado

Após seguir todos os passos:

1. **Console do navegador** mostra:
   ```
   ✅ Realtime: Subscription ativa para conversa: [id]
   ```

2. **Mensagens aparecem instantaneamente** sem recarregar a página

3. **Sem erros** `CHANNEL_ERROR` no console

---

## ⚠️ Se Nada Funcionar

1. **Use o fallback**: O sistema já está usando polling automaticamente
2. **Verifique logs**: Console do navegador e logs do Supabase Dashboard
3. **Contate suporte**: Forneça:
   - Resultado de `verificar-realtime.sql`
   - Logs do console do navegador
   - Versão do Supabase
   - Configurações de RLS

---

**Última atualização**: 29/12/2025

