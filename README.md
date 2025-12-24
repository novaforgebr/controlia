# Controlia CRM

Plataforma SaaS de CRM inteligente com foco em automação, inteligência artificial e controle total de dados.

## 🎯 Visão Geral

O Controlia CRM é um centro de comando operacional que centraliza:
- Gestão de contatos
- Atendimentos e conversas (principalmente WhatsApp)
- Pagamentos
- Usuários e permissões
- Automações
- Controle completo sobre agentes de IA

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: API Routes / Server Actions (Next.js)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Hospedagem**: Vercel
- **Integrações**: n8n (automações e agentes de IA)

## 🏗️ Arquitetura

### Multi-Tenant
- Isolamento completo de dados por empresa
- Row Level Security (RLS) no Supabase
- Cada empresa possui configurações próprias

### Módulos Principais

1. **Autenticação e Usuários**
   - Login, registro, recuperação de senha
   - Gestão de usuários por empresa
   - Papéis e permissões (admin, operador, observador)

2. **Empresas (Multi-Tenant)**
   - Dados isolados por empresa
   - Configurações próprias

3. **Contatos**
   - CRUD completo
   - Campos personalizados
   - Histórico de interações
   - Tags e status

4. **Conversas e Atendimentos**
   - Registro completo de mensagens
   - Origem: humano ou IA
   - Status e priorização

5. **Inteligência Artificial**
   - Gerenciamento de prompts (versionamento)
   - Controle de permissões da IA
   - Logs completos de decisões
   - Integração via n8n

6. **Automação (n8n)**
   - Webhooks de entrada e saída
   - Configuração de eventos
   - Logs de execução

7. **Monitoramento em Tempo Real**
   - Visualização de conversas ativas
   - Intervenção manual
   - Modo observador

8. **Arquivos e Base de Conhecimento**
   - Upload de arquivos
   - Classificação por tipo
   - Uso como contexto para IA

9. **Pagamentos**
   - Registro de pagamentos
   - Planos e assinaturas
   - Histórico financeiro

10. **Auditoria**
    - Log de todas as ações
    - Rastreamento de humanos e IA

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- (Opcional) Instância do n8n para automações

### Instalação

1. Clone o repositório
```bash
git clone <repo-url>
cd CONTROLIA
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Configure o banco de dados

Execute o schema SQL no Supabase:
- Acesse o SQL Editor no Supabase
- Execute o arquivo `supabase/schema.sql`

5. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
CONTROLIA/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas do dashboard
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI base
│   └── modules/          # Componentes por módulo
├── lib/                   # Utilitários e lógica
│   ├── supabase/         # Clientes Supabase
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Funções utilitárias
├── supabase/             # Schema e migrations
│   └── schema.sql        # Schema completo do banco
└── public/               # Arquivos estáticos
```

## 🔒 Segurança

- **Row Level Security (RLS)**: Isolamento completo de dados por empresa
- **Autenticação**: Supabase Auth com sessões seguras
- **Auditoria**: Log completo de todas as ações
- **Validação**: Zod para validação de dados

## 📝 Princípios de Desenvolvimento

1. **Multi-tenant desde o início**: Dados isolados por empresa
2. **Controle total**: Usuário possui soberania sobre dados e IA
3. **Auditoria completa**: Todas as ações são registradas
4. **Código modular**: Separação clara de responsabilidades
5. **Type-safety**: TypeScript em todo o código
6. **Versionamento**: Prompts, fluxos e configurações versionados

## 🧪 Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📄 Licença

Proprietário - Todos os direitos reservados

## 🤝 Contribuindo

Este é um projeto proprietário. Para contribuições, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com foco em escalabilidade, segurança e experiência do usuário.**

