# Resumo das Correções: Mensagens Duplicadas

## ✅ Correções Aplicadas

### 1. Verificação de Idempotência
- **Arquivo**: `app/api/webhooks/telegram/route.ts`
- **Linha**: ~495-520
- **O que faz**: Verifica se mensagem com o mesmo `channel_message_id` já existe ANTES de criar
- **Resultado**: Se já existe, retorna sucesso SEM criar duplicata e SEM enviar para n8n

### 2. Tratamento de Erros de Duplicação
- **Arquivo**: `app/api/webhooks/telegram/route.ts`
- **Linha**: ~536-571
- **O que faz**: Trata erro 23505 (unique constraint violation) e busca mensagem existente
- **Resultado**: Em caso de race condition, retorna mensagem existente ao invés de falhar

### 3. Índice Único no Banco
- **Arquivo**: `supabase/prevent-duplicate-messages.sql` (NOVO)
- **O que faz**: Cria índice UNIQUE composto `(company_id, conversation_id, channel_message_id)`
- **Resultado**: Previne duplicatas mesmo em casos extremos de race conditions

### 4. Processamento de Uma Automação
- **Arquivo**: `app/api/webhooks/telegram/route.ts`
- **Linha**: ~794-815
- **O que faz**: Processa apenas UMA automação por mensagem, mesmo se houver múltiplas ativas
- **Resultado**: Evita enviar a mesma mensagem múltiplas vezes para o n8n

### 5. Validações Adicionais
- **Arquivo**: `app/api/webhooks/telegram/route.ts`
- **Linha**: ~847-862, ~1040-1055
- **O que faz**: Verifica mensagem antes de enviar para n8n e valida payload
- **Resultado**: Garante que apenas mensagens válidas são processadas

## 📋 Checklist de Aplicação

- [x] Código atualizado em `app/api/webhooks/telegram/route.ts`
- [ ] **AÇÃO NECESSÁRIA**: Executar script SQL no Supabase (`supabase/prevent-duplicate-messages.sql`)
- [x] Documentação criada (`docs/CORRECAO_MENSAGENS_DUPLICADAS.md`)
- [x] Pacote `openai` adicionado ao `package.json`

## 🚀 Próximos Passos

1. **Execute o script SQL no Supabase**:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_channel_conversation 
   ON messages(company_id, conversation_id, channel_message_id) 
   WHERE channel_message_id IS NOT NULL;
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Faça deploy** do código atualizado

4. **Teste enviando uma mensagem** via Telegram e verifique:
   - Apenas UMA mensagem criada no Controlia
   - Apenas UMA requisição enviada para o n8n
   - Logs indicando `duplicate_prevented: true` se tentar duplicar

## 🔍 Como Verificar se Está Funcionando

1. **Verifique os logs do Vercel** quando enviar uma mensagem:
   - Deve aparecer: `🔍 Verificando se mensagem já foi processada (idempotência)...`
   - Se duplicada: `🚫 DUPLICAÇÃO PREVENIDA - Mensagem já existe`

2. **Verifique no n8n**:
   - Execute o workflow uma vez
   - Verifique os logs de execução - deve aparecer apenas UMA execução por mensagem

3. **Verifique no Controlia**:
   - Apenas UMA mensagem deve aparecer na conversa
   - Não devem haver mensagens duplicadas

## ⚠️ Problemas Conhecidos e Soluções

### Problema: Ainda aparecem duplicatas
**Solução**: 
- Verifique se o índice UNIQUE foi criado no banco
- Verifique se há múltiplas automações ativas para `new_message`
- Verifique logs do Vercel para ver se a verificação de idempotência está sendo executada

### Problema: Build falhando com erro "Module not found: Can't resolve 'openai'"
**Solução**: Execute `npm install` para instalar o pacote `openai` que foi adicionado ao `package.json`

