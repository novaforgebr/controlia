# Envio de E-mail de Convites

Este documento descreve como configurar o envio de e-mails de convite usando o Supabase.

## Opções de Configuração

### Opção 1: Edge Function do Supabase (Recomendado)

A Edge Function `send-invite-email` permite enviar e-mails usando serviços externos como Resend ou SMTP direto.

#### 1. Deploy da Edge Function

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy send-invite-email
```

#### 2. Configurar Variáveis de Ambiente

No dashboard do Supabase, vá em **Edge Functions** > **Settings** e adicione:

**Para usar Resend (Recomendado):**
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
```

**Para usar SMTP direto:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
FROM_EMAIL=noreply@seudominio.com
```

#### 3. Obter API Key do Resend

1. Acesse [https://resend.com](https://resend.com)
2. Crie uma conta
3. Vá em **API Keys** e crie uma nova chave
4. Adicione a chave como `RESEND_API_KEY` no Supabase

### Opção 2: Usar Serviço de E-mail do Supabase Auth

O Supabase Auth pode enviar e-mails customizados através de templates. Para usar:

1. Acesse o dashboard do Supabase
2. Vá em **Authentication** > **Email Templates**
3. Crie um template customizado para convites
4. Configure o template para usar variáveis como `{{ .InviteURL }}`

### Opção 3: Integração com n8n

Se você já usa n8n, pode criar um workflow que:
1. Recebe webhook com dados do convite
2. Envia e-mail usando o nó de e-mail do n8n
3. Retorna confirmação

## Configuração no .env.local

Adicione as seguintes variáveis:

```env
# URL da aplicação (usado para gerar links de convite)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Para produção
# NEXT_PUBLIC_APP_URL=https://seudominio.com

# Service Role Key do Supabase (para chamar Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
```

## Testando o Envio de E-mail

### Desenvolvimento

Durante o desenvolvimento, o sistema criará o convite mas pode não enviar o e-mail se a Edge Function não estiver configurada. O link do convite será retornado na resposta da API para testes.

### Produção

1. Configure a Edge Function conforme descrito acima
2. Adicione as variáveis de ambiente necessárias
3. Teste enviando um convite através da interface
4. Verifique os logs da Edge Function no dashboard do Supabase

## Estrutura do E-mail

O e-mail de convite inclui:
- Assunto personalizado com nome da empresa
- Corpo HTML formatado
- Botão de ação para aceitar convite
- Link alternativo (texto)
- Informações sobre expiração (7 dias)
- Rodapé com informações da empresa

## Troubleshooting

### E-mail não está sendo enviado

1. Verifique se a Edge Function foi deployada corretamente
2. Confirme que as variáveis de ambiente estão configuradas
3. Verifique os logs da Edge Function no dashboard do Supabase
4. Teste a Edge Function diretamente usando o Supabase CLI:

```bash
supabase functions invoke send-invite-email --body '{"to":"teste@exemplo.com","subject":"Teste","html":"<p>Teste</p>","text":"Teste"}'
```

### Erro de autenticação

Certifique-se de que o `SUPABASE_SERVICE_ROLE_KEY` está configurado corretamente no `.env.local` e que a Edge Function está usando a chave correta no header `Authorization`.

## Próximos Passos

- [ ] Deploy da Edge Function
- [ ] Configurar variáveis de ambiente
- [ ] Testar envio de e-mail
- [ ] Personalizar template de e-mail (se necessário)
- [ ] Configurar domínio de e-mail (para produção)

