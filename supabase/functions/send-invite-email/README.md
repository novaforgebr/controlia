# Edge Function: send-invite-email

Esta Edge Function do Supabase envia e-mails de convite para novos usuários.

## Deploy

```bash
# Certifique-se de estar no diretório raiz do projeto
cd supabase/functions/send-invite-email

# Ou use o Supabase CLI a partir da raiz:
supabase functions deploy send-invite-email --project-ref seu-project-ref
```

## Variáveis de Ambiente

Configure no dashboard do Supabase (Edge Functions > Settings):

### Opção 1: Resend (Recomendado)

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
```

### Opção 2: SMTP Direto

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
FROM_EMAIL=noreply@seudominio.com
```

## Uso

A função é chamada automaticamente pela API route `/api/invitations/send-email` quando um convite é criado.

### Teste Manual

```bash
supabase functions invoke send-invite-email \
  --body '{
    "to": "teste@exemplo.com",
    "subject": "Teste de Convite",
    "html": "<h1>Teste</h1>",
    "text": "Teste"
  }'
```

## Requisitos

- Supabase CLI instalado
- Projeto Supabase linkado
- Variáveis de ambiente configuradas

