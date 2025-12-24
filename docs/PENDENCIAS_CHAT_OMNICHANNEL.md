# Pendências - Chat Omnichannel

Este documento lista o que ainda precisa ser desenvolvido ou configurado para o módulo de Chat Omnichannel estar 100% funcional.

## ✅ O que já está implementado

### Frontend
- ✅ Componente `ChatWindow` otimizado com toggle de IA
- ✅ Componente `Switch` para toggle de IA
- ✅ Página `/integrations` com dashboard de conexões
- ✅ Componentes `IntegrationCard` e `QRCodeModal`
- ✅ Sincronização em tempo real via Supabase Realtime
- ✅ Optimistic updates no toggle de IA
- ✅ Agrupamento de mensagens por data
- ✅ Altura completa do chat ajustada

### Backend
- ✅ Server Actions para integrações (`connectChannel`, `disconnectChannel`, `checkConnectionStatus`)
- ✅ API route `/api/webhooks/integrations` para receber atualizações do n8n
- ✅ Trigger SQL para auto-desativar IA quando humano envia mensagem
- ✅ Tabela `channel_integrations` criada na migração

### Banco de Dados
- ✅ Migração SQL criada (`001_optimize_chat_performance.sql`)
- ✅ Índices de performance adicionados
- ✅ Trigger `auto_disable_ai_on_human_message()` implementado

### Documentação
- ✅ Documentação completa dos fluxos n8n (`FLUXOS_N8N_CHAT_OMNICHANNEL.md`)
- ✅ Guia de implementação (`CHAT_OMNICHANNEL_IMPLEMENTACAO.md`)

---

## ❌ O que ainda falta implementar

### 1. Executar Migração SQL no Supabase ⚠️ **CRÍTICO**

**Status:** Pendente  
**Prioridade:** Alta

A migração SQL precisa ser executada no Supabase para criar a tabela `channel_integrations` e os triggers.

**Ação necessária:**
```sql
-- Executar o arquivo no Supabase SQL Editor:
supabase/migrations/001_optimize_chat_performance.sql
```

**Verificar após execução:**
- Tabela `channel_integrations` existe
- Trigger `auto_disable_ai_on_human_message` está ativo
- Índices foram criados
- RLS policies foram aplicadas

---

### 2. Configurar Variáveis de Ambiente ⚠️ **CRÍTICO**

**Status:** Pendente  
**Prioridade:** Alta

**Ação necessária:**
Adicionar ao `.env.local`:
```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_SECRET=seu-secret-aqui
```

**Verificar:**
- Variáveis estão configuradas
- `N8N_WEBHOOK_URL` aponta para o n8n correto
- `N8N_SECRET` está configurado e é o mesmo no n8n

---

### 3. Criar Workflows no n8n ⚠️ **CRÍTICO**

**Status:** Pendente  
**Prioridade:** Alta

Os workflows do n8n foram documentados mas **não foram criados**. É necessário criar 4 workflows principais:

#### 3.1. Workflow: Verificar IA Ativa
- **Objetivo:** Verificar `ai_assistant_enabled` antes de responder
- **Documentação:** `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md#workflow-verificar-ia-ativa`
- **Status:** ❌ Não criado

#### 3.2. Workflow: Conectar Canal (WhatsApp/Telegram)
- **Objetivo:** Criar instância e retornar QR Code
- **Documentação:** `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md#workflow-conectar-canal`
- **Status:** ❌ Não criado
- **Dependências:**
  - Evolution API configurada (para WhatsApp)
  - Telegram Bot Token (para Telegram)

#### 3.3. Workflow: Receber Mensagens Inbound
- **Objetivo:** Processar mensagens recebidas dos canais
- **Documentação:** `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md#workflow-receber-mensagens`
- **Status:** ❌ Não criado
- **Dependências:**
  - Webhooks configurados no Evolution API/Telegram
  - Conexão com Supabase configurada no n8n

#### 3.4. Workflow: Enviar Mensagens Outbound
- **Objetivo:** Enviar mensagens do CRM para os canais
- **Documentação:** `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md#workflow-enviar-mensagens`
- **Status:** ❌ Não criado

---

### 4. Configurar Integrações Externas

#### 4.1. Evolution API (WhatsApp) ⚠️ **IMPORTANTE**

**Status:** Pendente  
**Prioridade:** Alta

**Ação necessária:**
1. Instalar/configurar Evolution API
2. Obter API Key
3. Configurar webhooks no Evolution API para apontar para o n8n
4. Adicionar variáveis de ambiente no n8n:
   ```env
   EVOLUTION_API_URL=https://api.evolutionapi.com
   EVOLUTION_API_KEY=sua-api-key
   ```

**Recursos:**
- [Documentação Evolution API](https://doc.evolution-api.com/)
- [Guia de Instalação](https://doc.evolution-api.com/v1.0/docs/getting-started)

#### 4.2. Telegram Bot API ⚠️ **IMPORTANTE**

**Status:** Pendente  
**Prioridade:** Alta

**Ação necessária:**
1. Criar bot no Telegram via [@BotFather](https://t.me/botfather)
2. Obter Bot Token
3. Configurar webhook do Telegram para apontar para o n8n
4. Adicionar variável de ambiente no n8n:
   ```env
   TELEGRAM_BOT_TOKEN=seu-bot-token
   ```

**Recursos:**
- [Documentação Telegram Bot API](https://core.telegram.org/bots/api)
- [Guia de Criação de Bot](https://core.telegram.org/bots/tutorial)

---

### 5. Configurar Supabase no n8n

**Status:** Pendente  
**Prioridade:** Média

**Ação necessária:**
1. Criar credencial do Supabase no n8n
2. Configurar:
   - Supabase URL
   - Service Role Key (para bypass de RLS quando necessário)
3. Testar conexão

**Nota:** Use Service Role Key apenas para operações que precisam bypassar RLS (como inserção de mensagens do n8n).

---

### 6. Implementar Atualização de Estatísticas

**Status:** Pendente  
**Prioridade:** Baixa

**Descrição:** Os campos `total_messages` e `total_conversations` na tabela `channel_integrations` não são atualizados automaticamente.

**Ação necessária:**
- Criar trigger SQL ou função para atualizar contadores
- Ou atualizar via n8n quando mensagens são processadas

**Exemplo de trigger:**
```sql
CREATE OR REPLACE FUNCTION update_channel_integration_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE channel_integrations
  SET 
    total_messages = total_messages + 1,
    last_sync_at = NOW()
  WHERE company_id = NEW.company_id
    AND channel = (
      SELECT channel FROM conversations WHERE id = NEW.conversation_id
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_channel_stats
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_integration_stats();
```

---

### 7. Tratamento de Erros e Retry Logic

**Status:** Pendente  
**Prioridade:** Média

**Melhorias sugeridas:**
- Implementar retry logic nas chamadas ao n8n
- Adicionar tratamento de timeout
- Implementar fila de retry para mensagens falhadas
- Adicionar notificações de erro para o usuário

---

### 8. Testes

**Status:** Pendente  
**Prioridade:** Média

**Testes necessários:**
- [ ] Testes unitários dos componentes React
- [ ] Testes de integração das Server Actions
- [ ] Testes E2E do fluxo completo de conexão
- [ ] Testes de performance do Realtime
- [ ] Testes de carga para múltiplas conversas simultâneas

---

### 9. Melhorias de UX

**Status:** Pendente  
**Prioridade:** Baixa

**Sugestões:**
- [ ] Adicionar loading states mais informativos
- [ ] Implementar notificações toast para ações
- [ ] Adicionar confirmação antes de desconectar canal
- [ ] Mostrar histórico de conexões/desconexões
- [ ] Adicionar filtros avançados na lista de conversas
- [ ] Implementar busca de conversas

---

### 10. Monitoramento e Logs

**Status:** Pendente  
**Prioridade:** Média

**Ações necessárias:**
- [ ] Implementar logging estruturado
- [ ] Adicionar métricas de performance
- [ ] Criar dashboard de monitoramento
- [ ] Implementar alertas para falhas de conexão
- [ ] Adicionar logs de auditoria para ações de integração

---

### 11. Documentação Adicional

**Status:** Pendente  
**Prioridade:** Baixa

**Documentação a criar:**
- [ ] Guia de troubleshooting completo
- [ ] Vídeo tutorial de configuração
- [ ] FAQ de problemas comuns
- [ ] Guia de boas práticas

---

## 📋 Checklist de Implementação

### Fase 1: Configuração Básica (Crítico)
- [ ] Executar migração SQL no Supabase
- [ ] Configurar variáveis de ambiente
- [ ] Configurar Evolution API (WhatsApp)
- [ ] Configurar Telegram Bot (Telegram)
- [ ] Configurar Supabase no n8n

### Fase 2: Workflows n8n (Crítico)
- [ ] Criar workflow "Verificar IA Ativa"
- [ ] Criar workflow "Conectar Canal"
- [ ] Criar workflow "Receber Mensagens"
- [ ] Criar workflow "Enviar Mensagens"
- [ ] Testar todos os workflows

### Fase 3: Melhorias e Otimizações
- [ ] Implementar atualização de estatísticas
- [ ] Adicionar tratamento de erros
- [ ] Implementar testes
- [ ] Adicionar monitoramento

---

## 🚨 Prioridades

### Urgente (Fazer primeiro)
1. Executar migração SQL
2. Configurar variáveis de ambiente
3. Criar workflows básicos no n8n
4. Configurar Evolution API/Telegram

### Importante (Fazer em seguida)
5. Configurar Supabase no n8n
6. Implementar atualização de estatísticas
7. Adicionar tratamento de erros

### Desejável (Melhorias futuras)
8. Implementar testes
9. Melhorias de UX
10. Monitoramento e logs

---

## 📞 Suporte

Se encontrar problemas durante a implementação:
1. Consulte `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md` para detalhes dos workflows
2. Consulte `docs/CHAT_OMNICHANNEL_IMPLEMENTACAO.md` para detalhes da implementação
3. Verifique os logs do n8n e do Supabase
4. Verifique o console do navegador para erros no frontend

