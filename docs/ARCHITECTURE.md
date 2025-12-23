# Arquitetura do Controlia CRM

## Visão Geral

O Controlia CRM é uma plataforma SaaS multi-tenant construída com Next.js 14 (App Router), TypeScript, Supabase e integração com n8n para automações e IA.

## Princípios Arquiteturais

### 1. Multi-Tenancy
- **Isolamento completo**: Cada empresa (tenant) possui dados completamente isolados
- **Row Level Security (RLS)**: Policies do Supabase garantem isolamento no nível do banco
- **Company ID obrigatório**: Todas as tabelas principais incluem `company_id`

### 2. Separação de Responsabilidades
- **Lógica de negócio**: Separada da interface (Server Actions / API Routes)
- **Validação**: Zod para validação de dados em todas as camadas
- **Type Safety**: TypeScript em todo o código com tipos gerados do banco

### 3. Auditoria e Rastreabilidade
- **Logs completos**: Todas as ações importantes são registradas
- **Origem clara**: Identificação de ações humanas vs IA vs sistema
- **Histórico imutável**: Logs não são editados, apenas consultados

### 4. Controle sobre IA
- **IA externa**: Lógica de IA executada no n8n, não no CRM
- **Controle granular**: Ativar/desativar IA globalmente ou por contato/conversa
- **Versionamento**: Prompts versionados e rastreáveis
- **Logs detalhados**: Todas as decisões da IA são registradas

## Estrutura de Pastas

```
CONTROLIA/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Grupo de rotas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Grupo de rotas protegidas
│   │   ├── layout.tsx          # Layout com proteção de autenticação
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── contacts/           # Módulo de contatos
│   │   ├── conversations/      # Módulo de conversas
│   │   ├── ai/                 # Módulo de IA
│   │   └── automations/         # Módulo de automações
│   ├── api/                     # API Routes
│   │   ├── auth/               # Rotas de autenticação
│   │   ├── contacts/           # API de contatos
│   │   ├── conversations/      # API de conversas
│   │   └── webhooks/           # Webhooks (n8n, WhatsApp, etc)
│   └── layout.tsx               # Layout raiz
│
├── components/                   # Componentes React
│   ├── ui/                     # Componentes de UI base (botões, inputs, etc)
│   └── modules/                # Componentes específicos por módulo
│       ├── contacts/
│       ├── conversations/
│       └── ai/
│
├── lib/                         # Lógica de negócio e utilitários
│   ├── supabase/               # Clientes Supabase
│   │   ├── client.ts          # Cliente para Client Components
│   │   ├── server.ts          # Cliente para Server Components/Actions
│   │   └── middleware.ts      # Cliente para Middleware
│   ├── auth/                   # Utilitários de autenticação
│   │   ├── get-session.ts
│   │   └── require-auth.ts
│   ├── types/                  # Tipos TypeScript
│   │   └── database.ts        # Tipos gerados do schema do banco
│   ├── validations/            # Schemas Zod
│   │   ├── contact.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   └── ai-prompt.ts
│   └── utils/                  # Funções utilitárias
│       ├── cn.ts              # Utilitário para classes CSS
│       ├── audit.ts           # Criação de logs de auditoria
│       └── company.ts         # Utilitários multi-tenant
│
├── supabase/                    # Schema e migrations
│   └── schema.sql             # Schema completo do banco de dados
│
└── public/                     # Arquivos estáticos
```

## Modelo de Dados

### Tabelas Principais

1. **companies**: Empresas (tenants)
2. **user_profiles**: Perfis de usuários
3. **company_users**: Relacionamento usuário-empresa (muitos para muitos)
4. **contacts**: Contatos/Leads/Clientes
5. **conversations**: Conversas e atendimentos
6. **messages**: Mensagens individuais
7. **ai_prompts**: Prompts de IA (versionados)
8. **ai_logs**: Logs de todas as ações da IA
9. **automations**: Automações e workflows do n8n
10. **automation_logs**: Logs de execução de automações
11. **files**: Arquivos e base de conhecimento
12. **payments**: Pagamentos e financeiro
13. **audit_logs**: Logs de auditoria

### Relacionamentos

```
companies (1) ──< (N) company_users (N) >── (1) user_profiles
companies (1) ──< (N) contacts
companies (1) ──< (N) conversations
companies (1) ──< (N) messages
companies (1) ──< (N) ai_prompts
companies (1) ──< (N) ai_logs
companies (1) ──< (N) automations
companies (1) ──< (N) audit_logs

contacts (1) ──< (N) conversations
conversations (1) ──< (N) messages
ai_prompts (1) ──< (N) ai_prompts (versionamento)
```

## Fluxo de Autenticação

1. Usuário faz login via Supabase Auth
2. Middleware atualiza sessão em todas as requisições
3. Server Components verificam autenticação via `requireAuth()`
4. RLS policies garantem acesso apenas aos dados da empresa do usuário

## Fluxo Multi-Tenant

1. Usuário autenticado acessa sistema
2. Sistema busca empresas do usuário via `company_users`
3. Usuário seleciona empresa (ou usa primeira empresa ativa)
4. Todas as queries incluem filtro por `company_id`
5. RLS policies garantem isolamento no banco

## Integração com n8n

### Fluxo de Automação

1. **Evento no CRM** (ex: nova mensagem)
2. **Webhook para n8n** com contexto completo
3. **n8n processa** usando agentes de IA
4. **Resposta via webhook** de volta para o CRM
5. **CRM registra** ação da IA em `ai_logs` e `messages`

### Estrutura de Webhook

```typescript
// Enviado para n8n
{
  event: 'new_message',
  company_id: 'uuid',
  conversation_id: 'uuid',
  contact_id: 'uuid',
  message: {
    content: '...',
    sender_type: 'human',
    // ...
  },
  context: {
    contact: { ... },
    conversation: { ... },
    ai_prompt_id: 'uuid',
    // ...
  }
}

// Recebido de n8n
{
  response: 'Resposta da IA',
  decisions: { ... },
  metadata: { ... },
  ai_agent_id: 'n8n-workflow-id'
}
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas principais possuem RLS habilitado com policies que:
- Verificam se usuário pertence à empresa (`user_belongs_to_company`)
- Garantem isolamento completo de dados
- Permitem apenas operações autorizadas

### Validação

- **Zod**: Validação de dados em Server Actions e API Routes
- **TypeScript**: Type-safety em todo o código
- **Supabase RLS**: Validação no nível do banco

### Auditoria

- Todas as ações importantes são registradas em `audit_logs`
- Identificação clara de origem (human, ai, system)
- Histórico imutável

## Próximos Passos

1. ✅ Estrutura base e schema do banco
2. ✅ Autenticação e multi-tenant
3. ⏳ Módulo de Contatos (CRUD completo)
4. ⏳ Módulo de Conversas e Mensagens
5. ⏳ Módulo de IA (prompts, controle, logs)
6. ⏳ Integração com n8n
7. ⏳ Monitoramento em tempo real
8. ⏳ Módulos restantes (arquivos, pagamentos)

## Decisões Técnicas

### Por que Next.js App Router?
- Server Components para melhor performance
- Server Actions para lógica de negócio
- Roteamento file-based intuitivo
- Suporte nativo a TypeScript

### Por que Supabase?
- PostgreSQL robusto
- RLS nativo para multi-tenancy
- Auth integrado
- Real-time capabilities (futuro)
- Storage para arquivos

### Por que n8n para IA?
- Separação de responsabilidades
- Flexibilidade para mudar modelos de IA
- Versionamento de workflows
- Escalabilidade independente

### Por que Zod?
- Validação type-safe
- Mensagens de erro claras
- Integração com TypeScript
- Validação em runtime e compile-time

