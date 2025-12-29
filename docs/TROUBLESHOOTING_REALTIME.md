# Troubleshooting: Erro CHANNEL_ERROR no Realtime

## 🔴 Erro

```
❌ Erro na subscription Realtime: "CHANNEL_ERROR"
```

Este erro ocorre quando a subscription Realtime do Supabase falha ao se conectar ou manter a conexão com a tabela `messages`.

---

## 🔍 Diagnóstico

### Passo 1: Verificar se Realtime está habilitado

Execute o script de diagnóstico:

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: supabase/diagnose-realtime.sql
```

Ou execute manualmente:

```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'messages';
```

**Resultado esperado**: Deve retornar 1 linha com `tablename = 'messages'`

**Se não retornar nada**: O Realtime não está habilitado. Continue para o Passo 2.

---

### Passo 2: Habilitar Realtime

Execute o script de habilitação:

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: supabase/enable-realtime-all.sql
```

Ou execute manualmente:

```sql
-- Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Configurar REPLICA IDENTITY FULL
ALTER TABLE messages REPLICA IDENTITY FULL;
```

---

### Passo 3: Verificar configuração do Supabase

1. Acesse o **Dashboard do Supabase**
2. Vá em **Settings > API**
3. Verifique se **Realtime** está habilitado
4. Anote a **URL do Realtime** (formato: `wss://[project].supabase.co/realtime/v1`)

---

### Passo 4: Verificar RLS (Row Level Security)

O Realtime respeita as políticas RLS. Verifique se o usuário tem permissão SELECT:

```sql
-- Verificar políticas RLS na tabela messages
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'messages';
```

**Importante**: O usuário autenticado precisa ter permissão `SELECT` na tabela `messages` para receber eventos Realtime.

---

### Passo 5: Verificar conectividade WebSocket

O Realtime usa WebSocket (WSS). Verifique:

1. **Firewall**: Permite conexões WebSocket?
2. **Proxy**: Não está bloqueando WSS?
3. **Navegador**: Console do navegador mostra erros de WebSocket?

No console do navegador, procure por:
- `WebSocket connection failed`
- `Failed to connect to Realtime`
- Erros de CORS

---

## ✅ Solução Rápida

Se você acabou de configurar o projeto, execute:

```sql
-- 1. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. Verificar
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
```

Depois, **recarregue a página** no navegador.

---

## 🔄 Fallback Automático

O sistema possui um **fallback automático** que:

1. Tenta reconectar automaticamente (até 5 tentativas)
2. Se falhar, ativa **polling** (recarrega mensagens a cada 3 segundos)
3. Continua funcionando mesmo sem Realtime

**Você verá no console**:
```
❌ Máximo de tentativas de reconexão atingido. Usando fallback de polling...
📡 Ativando fallback: recarregando mensagens a cada 3 segundos
```

Isso significa que o sistema está funcionando, mas sem atualizações em tempo real.

---

## 🛠️ Soluções por Problema

### Problema 1: Realtime não habilitado no projeto

**Sintoma**: `CHANNEL_ERROR` imediatamente

**Solução**:
1. Dashboard Supabase > Settings > API
2. Habilite "Realtime"
3. Execute `supabase/enable-realtime-all.sql`

---

### Problema 2: Tabela não está na publicação

**Sintoma**: `CHANNEL_ERROR` após alguns segundos

**Solução**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER TABLE messages REPLICA IDENTITY FULL;
```

---

### Problema 3: REPLICA IDENTITY incorreto

**Sintoma**: Realtime conecta mas não recebe eventos

**Solução**:
```sql
ALTER TABLE messages REPLICA IDENTITY FULL;
```

Verificar:
```sql
SELECT relreplident 
FROM pg_class 
WHERE relname = 'messages';
-- Deve retornar 'f' (FULL)
```

---

### Problema 4: RLS bloqueando

**Sintoma**: Realtime conecta mas não recebe eventos específicos

**Solução**: Verifique as políticas RLS:

```sql
-- Ver todas as políticas
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Criar política permissiva se necessário
CREATE POLICY "Allow users to receive realtime updates"
ON messages
FOR SELECT
USING (true); -- Ajuste conforme suas regras de negócio
```

---

### Problema 5: Problemas de rede

**Sintoma**: `TIMED_OUT` ou conexão instável

**Soluções**:
1. Verifique firewall/proxy
2. Teste em outra rede
3. Verifique logs do Supabase Dashboard
4. Use o fallback de polling (já ativado automaticamente)

---

## 📊 Verificação Completa

Execute este script completo para verificar tudo:

```sql
-- 1. Verificar publicação
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('messages', 'conversations', 'contacts');

-- 2. Verificar REPLICA IDENTITY
SELECT 
  c.relname as table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('messages', 'conversations', 'contacts')
  AND n.nspname = 'public';

-- 3. Verificar políticas RLS
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('messages', 'conversations', 'contacts')
GROUP BY tablename;
```

**Resultado esperado**:
- 3 tabelas na publicação
- Todas com `replica_identity = 'FULL'`
- Políticas RLS configuradas

---

## 🚨 Se Nada Funcionar

1. **Use o fallback**: O sistema já ativa polling automaticamente
2. **Verifique logs**: Console do navegador e logs do Supabase
3. **Contate suporte**: Forneça:
   - Resultado do `diagnose-realtime.sql`
   - Logs do console do navegador
   - Versão do Supabase
   - Configurações de RLS

---

## 📝 Notas Importantes

1. **Realtime é opcional**: O sistema funciona sem ele (usa polling)
2. **Performance**: Realtime é mais eficiente que polling
3. **RLS**: Sempre respeitado, mesmo com Realtime
4. **Reconexão**: Automática até 5 tentativas
5. **Fallback**: Ativado automaticamente após falhas

---

**Última atualização**: 29/12/2025

