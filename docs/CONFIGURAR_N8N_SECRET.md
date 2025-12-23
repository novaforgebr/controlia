# 🔐 Como Configurar o Secret do n8n

## Problema

O erro `"Provided secret is not valid"` indica que o n8n está esperando um secret/token de autenticação que não está sendo enviado corretamente.

## Solução

O n8n pode esperar o secret de duas formas:

### Opção 1: Secret como Query Parameter na URL (Recomendado)

Adicione o secret diretamente na URL do webhook do n8n:

```
https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=SEU_SECRET_AQUI
```

**Como obter o secret:**
1. No n8n, abra seu workflow
2. Clique no nó "Webhook" (Telegram Trigger)
3. Nas configurações do webhook, procure por "Authentication" ou "Secret"
4. Copie o secret configurado
5. Adicione `?secret=SEU_SECRET` na URL do webhook

### Opção 2: Secret nas Settings da Empresa

1. Acesse **Configurações > Integrações** no Controlia
2. Adicione o campo `n8n_webhook_secret` nas settings (atualmente não há interface, mas você pode adicionar via SQL)

**Via SQL:**
```sql
UPDATE companies
SET settings = jsonb_set(
  settings,
  '{n8n_webhook_secret}',
  '"SEU_SECRET_AQUI"'
)
WHERE id = 'SEU_COMPANY_ID';
```

### Opção 3: Desabilitar Autenticação no n8n (Não Recomendado para Produção)

Se você não quiser usar autenticação:
1. No n8n, abra seu workflow
2. Clique no nó "Webhook"
3. Desabilite a opção "Authentication" ou "Require Secret"

⚠️ **Atenção**: Isso deixa o webhook público e qualquer pessoa pode enviar dados para ele.

## Como Verificar se Está Funcionando

Após configurar o secret:

1. Envie uma mensagem no Telegram
2. Verifique os logs da Vercel:
   - Deve aparecer: `🔐 Secret adicionado à URL do webhook` ou `🔐 Secret encontrado na URL do webhook`
   - Não deve aparecer: `❌ Erro ao enviar para n8n: {"message":"Provided secret is not valid"}`
3. Verifique se a mensagem foi processada pelo n8n
4. Verifique se a resposta da IA apareceu no Controlia

## Atualizar Automação com Secret na URL

Se você já tem uma automação configurada, atualize a URL do webhook:

```sql
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=SEU_SECRET_AQUI'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';
```

Substitua:
- `SEU_SECRET_AQUI` pelo secret do seu webhook n8n
- `49666eb5-d6ca-45f6-9944-9c58354ad6aa` pelo ID da sua automação

