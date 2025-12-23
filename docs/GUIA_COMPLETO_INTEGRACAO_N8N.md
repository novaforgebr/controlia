# 🚀 Guia Completo: Integração n8n Self-Hosted com Controlia

Este guia passo a passo detalha como integrar completamente seu n8n self-hosted com o Controlia, permitindo que mensagens do Telegram sejam processadas pela IA e respostas sejam enviadas automaticamente.

## 📋 Pré-requisitos

- ✅ Controlia instalado e funcionando
- ✅ n8n self-hosted instalado e funcionando
- ✅ Bot do Telegram criado (via @BotFather)
- ✅ Workflow n8n com Telegram Trigger e AI Agent configurado

---

## 📝 Passo 1: Obter o Secret do Webhook n8n

### ⚠️ IMPORTANTE: Diferença entre Telegram Trigger e Webhook

No n8n, existem dois tipos de nós que podem receber mensagens:

- **Telegram Trigger**: Recebe mensagens diretamente do Telegram
  - **NÃO tem opção de secret/autenticação** (isso é normal)
  
- **Webhook**: Recebe mensagens do Controlia
  - **TEM opção de secret/autenticação**
  - É neste nó que você configura o secret

### 1.1 Acessar o Workflow no n8n

1. Abra seu n8n self-hosted no navegador
2. Navegue até o workflow que processa mensagens do Telegram
3. **Clique no nó "Webhook"** (não no Telegram Trigger)

### 1.2 Localizar o Secret

1. Nas configurações do nó **Webhook**, procure por:
   - **"Authentication"**
   - **"Secret"**
   - **"Webhook Authentication"**
   - **"Require Secret"**

2. Se o secret estiver habilitado, você verá:
   - Um campo com o secret (ex: `abc123xyz`)
   - Ou uma opção para gerar um novo secret

3. **Copie o secret** (você precisará dele no Passo 3)

### 1.3 Se não houver secret configurado

Se o webhook não tiver autenticação configurada:

1. No nó **Webhook**, ative a opção **"Require Secret"** ou **"Authentication"**
2. Gere ou configure um secret
3. **Copie o secret** gerado

⚠️ **Importante**: 
- O secret é configurado **APENAS no nó Webhook**, não no Telegram Trigger
- Anote este secret, você precisará dele para configurar no Controlia

---

## 📝 Passo 2: Obter a URL do Webhook n8n

### 2.1 Localizar a URL do Webhook

1. No mesmo nó Webhook do n8n, você verá a URL do webhook
2. Geralmente está no formato:
   ```
   https://seu-n8n.com/webhook/UUID/webhook
   ```
   Exemplo:
   ```
   https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook
   ```

3. **Copie a URL completa** (você precisará dela no Passo 4)

### 2.2 Verificar se a URL está acessível

Teste se a URL está acessível publicamente:

```bash
curl -X POST "https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

Se retornar um erro de autenticação (como `"Provided secret is not valid"`), isso é normal - significa que o webhook está protegido e funcionando.

---

## 📝 Passo 3: Configurar Secret do n8n no Controlia

### 3.1 Acessar Configurações

1. Faça login no Controlia
2. Navegue até **Configurações** (menu lateral)
3. Clique na aba **Integrações**

### 3.2 Adicionar Secret do n8n

1. Role até a seção **"n8n"**
2. No campo **"Webhook Secret do n8n"**, cole o secret que você copiou no Passo 1
3. Clique em **"Salvar Configurações"**

✅ **Pronto!** O secret está configurado e será usado automaticamente quando mensagens forem enviadas para o n8n.

---

## 📝 Passo 4: Configurar Automação no Controlia

### 4.1 Verificar se já existe automação

Execute este SQL no Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused
FROM automations
WHERE trigger_event = 'new_message';
```

### 4.2 Criar ou Atualizar Automação

Se não houver automação, crie uma:

```sql
INSERT INTO automations (
  company_id,
  name,
  description,
  trigger_event,
  trigger_conditions,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused
) VALUES (
  'SEU_COMPANY_ID',  -- Substitua pelo ID da sua empresa
  'Agente IA - Telegram',
  'Processa mensagens do Telegram com Agent de IA do n8n',
  'new_message',
  '{}'::jsonb,
  'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',  -- Substitua pela URL do seu webhook
  'SEU_WORKFLOW_ID',  -- Substitua pelo ID do workflow (opcional)
  true,
  false
);
```

**Substitua:**
- `SEU_COMPANY_ID` → ID da sua empresa (ex: `cae292bd-2cc7-42b9-9254-779ed011989e`)
- URL do webhook → A URL que você copiou no Passo 2
- `SEU_WORKFLOW_ID` → ID do workflow no n8n (opcional)

### 4.3 Se já existir automação, atualizar a URL

```sql
UPDATE automations
SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook'
WHERE id = 'ID_DA_AUTOMACAO';
```

---

## 📝 Passo 5: Configurar Webhook do Telegram

### 5.1 Obter Bot Token

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/mybots`
3. Selecione seu bot
4. Clique em **"API Token"**
5. **Copie o token** (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 5.2 Configurar Bot Token no Controlia

1. No Controlia, vá em **Configurações > Integrações**
2. Na seção **Telegram**, cole o **Bot Token** no campo correspondente
3. Clique em **"Salvar Configurações"**

### 5.3 Configurar Webhook do Telegram para Controlia

Execute este comando no terminal (substitua `SEU_BOT_TOKEN` e `SEU_DOMINIO`):

```bash
curl "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook?url=https://SEU_DOMINIO/api/webhooks/telegram"
```

**Exemplo:**
```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

### 5.4 Verificar se foi configurado

```bash
curl "https://api.telegram.org/botSEU_BOT_TOKEN/getWebhookInfo"
```

Você deve ver:
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    ...
  }
}
```

---

## 📝 Passo 6: Configurar Workflow n8n

### 6.1 Estrutura do Workflow

Seu workflow n8n deve ter esta estrutura:

```
Telegram Trigger → AI Agent → HTTP Request (para Controlia)
```

### 6.2 Configurar Telegram Trigger

1. No nó **"Telegram Trigger"** ou **"Webhook"**:
   - Configure o método: **POST**
   - Ative **"Require Secret"** (se ainda não estiver)
   - Configure o secret (o mesmo do Passo 1)

### 6.3 Configurar AI Agent

1. Configure seu AI Agent (OpenAI, Anthropic, etc.)
2. Use a mensagem do Telegram como input
3. Configure o prompt/instruções da IA

### 6.4 Configurar HTTP Request para Controlia

1. Adicione um nó **"HTTP Request"**
2. Configure:
   - **Method**: `POST`
   - **URL**: `{{ $json.controlia.callback_url }}`
   - **Authentication**: None
   - **Body Content Type**: JSON
   - **JSON Body**:
   ```json
   {
     "output": "={{ $json.output }}",
     "controlia": {
       "company_id": "{{ $json.controlia?.company_id }}",
       "contact_id": "{{ $json.controlia?.contact_id }}",
       "conversation_id": "{{ $json.controlia?.conversation_id }}",
       "message_id": "{{ $json.controlia?.message_id }}",
       "channel": "{{ $json.controlia?.channel || 'telegram' }}",
       "channel_id": "{{ $json.message?.chat?.id || $json.controlia?.channel_id }}"
     },
     "message": {
       "from": "{{ $json.message?.from || $('Telegram Trigger').first()?.json?.message?.from }}",
       "chat": "{{ $json.message?.chat || $('Telegram Trigger').first()?.json?.message?.chat }}"
     }
   }
   ```

### 6.5 Salvar e Ativar Workflow

1. Clique em **"Save"** para salvar o workflow
2. Ative o workflow (toggle no canto superior direito)

---

## 📝 Passo 7: Testar a Integração

### 7.1 Teste Completo

1. **Envie uma mensagem no Telegram** para seu bot
2. **Verifique no Controlia**:
   - A mensagem deve aparecer na conversa
   - A resposta da IA deve aparecer automaticamente
3. **Verifique os logs da Vercel**:
   - Deve aparecer: `📥 Webhook Telegram recebido`
   - Deve aparecer: `✅ Mensagem criada com sucesso`
   - Deve aparecer: `📤 Enviando para n8n`
   - Deve aparecer: `✅ Mensagem enviada para n8n com sucesso`
   - Não deve aparecer: `❌ Erro ao enviar para n8n`

### 7.2 Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Verificar mensagens recentes
SELECT 
  m.id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;
```

Você deve ver:
- Mensagens `direction = 'inbound'` e `sender_type = 'human'` (do lead)
- Mensagens `direction = 'outbound'` e `sender_type = 'ai'` (da IA)

---

## 🔧 Troubleshooting

### Problema: "Provided secret is not valid"

**Solução:**
1. Verifique se o secret está configurado corretamente no Controlia (Passo 3)
2. Verifique se o secret no n8n é o mesmo
3. Verifique os logs da Vercel para ver se o secret está sendo adicionado à URL

### Problema: Mensagens não aparecem no Controlia

**Solução:**
1. Verifique se o webhook do Telegram está apontando para o Controlia (Passo 5.3)
2. Verifique os logs da Vercel para erros
3. Execute o script `supabase/check-inbound-messages.sql`

### Problema: Mensagens não são enviadas para n8n

**Solução:**
1. Verifique se há automação ativa (Passo 4)
2. Verifique se a URL do webhook está correta
3. Verifique os logs da Vercel para erros ao enviar para n8n

### Problema: IA não responde

**Solução:**
1. Verifique se o workflow n8n está ativo
2. Verifique se o HTTP Request está configurado corretamente (Passo 6.4)
3. Verifique se o `callback_url` está sendo enviado corretamente
4. Verifique os logs do n8n para erros

---

## ✅ Checklist Final

Antes de considerar a integração completa, verifique:

- [ ] Secret do n8n configurado no Controlia (Configurações > Integrações > n8n)
- [ ] Automação criada e ativa no banco de dados
- [ ] URL do webhook n8n configurada na automação
- [ ] Bot Token do Telegram configurado no Controlia
- [ ] Webhook do Telegram apontando para Controlia (não para n8n)
- [ ] Workflow n8n ativo e configurado corretamente
- [ ] HTTP Request no n8n apontando para `controlia.callback_url`
- [ ] Teste completo funcionando (mensagem do lead → aparece no Controlia → IA responde → resposta aparece no Controlia e Telegram)

---

## 🎉 Pronto!

Após seguir todos os passos, sua integração está completa:

1. ✅ Lead envia mensagem no Telegram
2. ✅ Mensagem aparece no Controlia
3. ✅ Controlia envia para n8n
4. ✅ n8n processa com IA
5. ✅ n8n envia resposta para Controlia
6. ✅ Controlia envia resposta para Telegram
7. ✅ Lead recebe resposta da IA

Todas as mensagens ficam registradas no Controlia para histórico completo! 🚀

