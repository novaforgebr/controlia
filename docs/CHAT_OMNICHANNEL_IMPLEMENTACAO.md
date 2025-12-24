# Implementação do Módulo de Chat Omnichannel

Este documento descreve a implementação completa do módulo de Chat Omnichannel com Toggle de IA e Sistema de Autoconexão de Canais.

## 📋 Resumo das Funcionalidades

### ✅ Funcionalidade 1: Toggle "IA Ativa/Inativa"

- **Banco de Dados:** Campo `ai_assistant_enabled` na tabela `conversations` (já existia)
- **Frontend:** Componente `Switch` customizado com Tailwind CSS
- **Componente:** `ChatWindow` otimizado com:
  - Optimistic Updates para feedback instantâneo
  - Supabase Realtime para sincronização em tempo real
  - Agrupamento de mensagens por data
  - Performance otimizada com `useMemo` e `useCallback`

### ✅ Funcionalidade 2: Integração Facilitada (Self-Service Integration)

- **Página:** `/integrations` - Dashboard de conexões
- **Componentes:**
  - `IntegrationsDashboard` - Lista de canais disponíveis e integrações
  - `IntegrationCard` - Card individual para cada canal
  - `QRCodeModal` - Modal para exibir QR Code durante conexão
- **Server Actions:** `connectChannel`, `disconnectChannel`, `checkConnectionStatus`
- **API Routes:** `/api/webhooks/integrations` - Webhook para atualizações do n8n

### ✅ Funcionalidade 3: Auto-desativar IA ao Enviar Mensagem Humana

- **Trigger SQL:** `auto_disable_ai_on_human_message()` - Desativa automaticamente a IA quando uma mensagem humana é enviada
- **Configurável:** Pode ser desabilitado via `settings_ai_auto_disable_on_human_message` na tabela `companies`

## 📁 Estrutura de Arquivos Criados

```
supabase/
  migrations/
    001_optimize_chat_performance.sql    # Migração com otimizações e nova tabela

components/
  ui/
    Switch.tsx                           # Componente Switch/Toggle
  conversations/
    ChatWindow.tsx                        # Componente principal de chat otimizado
    ConversationDetailView.tsx           # Re-export do ChatWindow (compatibilidade)
  integrations/
    IntegrationsDashboard.tsx             # Dashboard de integrações
    IntegrationCard.tsx                   # Card de integração individual
    QRCodeModal.tsx                       # Modal de QR Code

app/
  integrations/
    page.tsx                              # Página de integrações
  actions/
    integrations.ts                       # Server Actions para integrações
  api/
    webhooks/
      integrations/
        route.ts                          # Webhook para atualizações do n8n

docs/
  FLUXOS_N8N_CHAT_OMNICHANNEL.md         # Documentação completa dos fluxos n8n
  CHAT_OMNICHANNEL_IMPLEMENTACAO.md      # Este arquivo
```

## 🗄️ Estrutura do Banco de Dados

### Nova Tabela: `channel_integrations`

```sql
CREATE TABLE channel_integrations (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,              -- whatsapp, telegram, etc
    channel_name VARCHAR(255),                  -- Nome amigável
    status VARCHAR(50) DEFAULT 'disconnected',  -- disconnected, connecting, connected, error
    connection_data JSONB,                      -- Dados da conexão
    n8n_instance_id VARCHAR(255),               -- ID da instância no n8n
    n8n_webhook_url TEXT,                       -- Webhook para eventos
    qr_code_base64 TEXT,                        -- QR Code temporário
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    total_messages INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    auto_reply_enabled BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Otimizações de Performance

- Índices compostos adicionados para queries frequentes
- Trigger para auto-desativar IA quando humano envia mensagem
- Índices em `conversations` e `messages` para melhor performance

## 🔧 Configuração Necessária

### Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# n8n
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_SECRET=seu-secret-aqui
```

### Executar Migração SQL

Execute a migração no Supabase:

```sql
-- Executar o arquivo:
supabase/migrations/001_optimize_chat_performance.sql
```

## 🚀 Como Usar

### 1. Conectar um Canal (WhatsApp/Telegram)

1. Acesse `/integrations` no dashboard
2. Clique em "Conectar" no canal desejado
3. Escaneie o QR Code exibido no modal
4. Aguarde a confirmação de conexão (atualização automática via Realtime)

### 2. Gerenciar Toggle de IA

1. Abra uma conversa
2. Use o Switch "IA Ativa" no cabeçalho da conversa
3. O estado é atualizado instantaneamente (optimistic update)
4. A IA só responderá se o toggle estiver ativo

### 3. Enviar Mensagem (Auto-desativa IA)

Quando um humano envia uma mensagem:
- O trigger SQL verifica a configuração da empresa
- Se `settings_ai_auto_disable_on_human_message` for `true`, a IA é desativada automaticamente
- Isso evita que a IA interrompa o raciocínio do atendente

## 📡 Integração com n8n

Consulte `docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md` para:
- Estrutura completa dos workflows
- Configuração de webhooks
- Exemplos de código para cada workflow
- Variáveis de ambiente necessárias

### Workflows Principais

1. **Verificar IA Ativa** - Verifica `ai_assistant_enabled` antes de responder
2. **Conectar Canal** - Cria instância e retorna QR Code
3. **Receber Mensagens** - Processa mensagens inbound dos canais
4. **Enviar Mensagens** - Envia mensagens outbound para os canais

## 🎨 Componentes Principais

### ChatWindow

Componente otimizado para exibição de conversas com:
- Realtime via Supabase
- Agrupamento de mensagens por data
- Optimistic updates no toggle de IA
- Performance otimizada com memoização

### IntegrationCard

Card para gerenciar conexões de canais com:
- Status em tempo real
- Botões de conectar/desconectar
- Exibição de estatísticas
- Modal de QR Code integrado

## 🔒 Segurança

- Validação de `X-N8N-Secret` em todos os webhooks
- RLS (Row Level Security) habilitado na nova tabela
- Isolamento por `company_id` em todas as queries

## 📊 Performance

### Otimizações Implementadas

1. **Índices Compostos:**
   - `idx_conversations_company_status_ai` - Para filtrar conversas ativas com IA
   - `idx_messages_conversation_created_sender` - Para ordenar mensagens

2. **Memoização:**
   - `useMemo` para agrupamento de mensagens
   - `useCallback` para funções de scroll e carregamento

3. **Realtime Eficiente:**
   - Canais específicos por conversa
   - Limpeza automática de subscriptions

## 🐛 Troubleshooting

### QR Code não aparece

- Verifique se `N8N_WEBHOOK_URL` está configurado corretamente
- Verifique se o workflow de conexão está ativo no n8n
- Verifique logs do n8n para erros

### IA não desativa automaticamente

- Verifique se o trigger está ativo no Supabase
- Verifique a configuração `settings_ai_auto_disable_on_human_message` na tabela `companies`

### Mensagens não aparecem em tempo real

- Verifique se o Supabase Realtime está habilitado
- Verifique se as subscriptions estão sendo criadas corretamente
- Verifique console do navegador para erros

## 📝 Próximos Passos

1. Implementar testes unitários para os componentes
2. Adicionar suporte para mais canais (Instagram, Facebook Messenger)
3. Implementar notificações push quando há novas mensagens
4. Adicionar métricas e analytics de uso dos canais
5. Implementar filas de atendimento por canal

## 📚 Referências

- [Documentação Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentação n8n](https://docs.n8n.io/)
- [Evolution API (WhatsApp)](https://doc.evolution-api.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

