# Guia Completo: Integração n8n Self-Hosted com Controlia

Este guia explica passo a passo como integrar seu n8n self-hosted com o Controlia CRM, permitindo que seus workflows processem mensagens de todos os canais configurados (Telegram, WhatsApp, Email, etc.).

## 🚀 Início Rápido

Se você já tem um workflow n8n funcionando com Telegram, siga estes passos:

1. **Criar Automação no Controlia** (Passo 2)
2. **Adicionar nó HTTP Request no n8n** (Passo 3.4)
3. **Configurar Webhook do Telegram** (Passo 4.1)
4. **Testar** (Passo 5)

Para uma configuração completa do zero, siga todos os passos abaixo.

## 📋 Visão Geral da Integração

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Canal     │ ──────> │  Controlia   │ ──────> │     n8n      │
│ (Telegram/  │ Mensagem│   Webhook    │  Evento │  Workflow    │
│  WhatsApp)  │         │              │         │   (Agent)    │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         │ Resposta
                                                         ▼
                                                  ┌──────────────┐
                                                  │  Controlia   │
                                                  │   Response   │
                                                  │   Handler    │
                                                  └──────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │   Canal     │
                                                  │ (Telegram/  │
                                                  │  WhatsApp)  │
                                                  └─────────────┘
```

## 🎯 Objetivo

Integrar seu workflow n8n para:
- Receber mensagens de todos os canais configurados
- Processar com seu Agent de IA
- Enviar respostas de volta aos canais
- Registrar tudo no Controlia CRM

---

## 📝 Passo 1: Configurar Canais no Controlia

### 1.1 Configurar Telegram

1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **Telegram**:
   - **Bot Token**: Token do seu bot (obtido do @BotFather)
   - **Webhook URL**: `https://seu-dominio.com/api/webhooks/telegram`
   - **Webhook Secret**: Uma string secreta (gere com `openssl rand -hex 32`)
3. Clique em **Salvar Configurações**

### 1.2 Configurar WhatsApp (se aplicável)

1. Na seção **WhatsApp**:
   - **API URL**: URL da API do seu provedor
   - **API Key**: Chave de API
   - **Webhook Secret**: String secreta
2. Configure o webhook no seu provedor para: `https://seu-dominio.com/api/webhooks/whatsapp`

### 1.3 Configurar Email (se aplicável)

1. Na seção **Email**:
   - Configure SMTP Host, Porta, Usuário e Senha
2. Salve as configurações

---

## 📝 Passo 2: Criar Automação no Controlia

### 2.1 Criar Automação via API ou SQL

Atualmente, as automações são criadas via código. Você pode criar uma automação de duas formas:

#### Opção A: Via SQL (Recomendado para teste rápido)

Execute este SQL no Supabase SQL Editor (substitua os valores):

```sql
INSERT INTO automations (
  company_id,
  name,
  description,
  trigger_event,
  n8n_webhook_url,
  is_active
) VALUES (
  'SEU_COMPANY_ID_AQUI',  -- Substitua pelo ID da sua empresa
  'Agente IA - Mensagens',
  'Processa mensagens de todos os canais com Agent de IA do n8n',
  'new_message',
  'https://seu-n8n.com/webhook/controlia-message',  -- URL do webhook do n8n
  true
);
```

Para encontrar seu `company_id`:
```sql
SELECT id, name FROM companies;
```

#### Opção B: Criar via Interface (se disponível)

1. Acesse **Automações** no menu
2. Clique em **Nova Automação**
3. Preencha os campos:
   - **Nome**: "Agente IA - Mensagens"
   - **Descrição**: "Processa mensagens com Agent de IA"
   - **Evento Trigger**: `new_message`
   - **Webhook URL do n8n**: (deixe vazio por enquanto, preencherá depois)
   - **Ativo**: Marque para ativar
4. Salve a automação

### 2.2 Configurar Webhook URL

Após criar o workflow no n8n (Passo 3), volte aqui e:

1. Acesse **Configurações > n8n**
2. Clique em **Editar** na automação criada
3. Cole a **Webhook URL do n8n** (obtida no Passo 3.2)
4. Salve

---

## 📝 Passo 3: Configurar Workflow no n8n

### 3.1 Criar/Modificar Workflow

1. Acesse seu n8n self-hosted
2. Crie um novo workflow ou abra o existente
3. O workflow deve ter esta estrutura:

```
[Webhook Trigger] → [Agent] → [HTTP Request] → [Fim]
```

### 3.2 Configurar Webhook Trigger

1. Adicione um nó **Webhook** (ou use o Telegram Trigger existente se quiser manter)
2. Se usar Webhook novo, configure:
   - **HTTP Method**: POST
   - **Path**: `/controlia-message` (ou o que preferir)
   - **Response Mode**: Respond When Last Node Finishes
3. **Copie a URL do webhook** (ex: `https://seu-n8n.com/webhook/controlia-message`)
4. **Importante**: Esta URL será usada no Passo 2.2 para configurar a automação no Controlia

**Nota**: Se você já tem um Telegram Trigger funcionando, pode manter ele e adicionar um nó **HTTP Request** antes do Agent para receber também do Controlia, ou criar um workflow separado.

### 3.3 Configurar Agent (seu nó existente)

Seu nó Agent já está configurado. Ele receberá os dados no formato:

**Se usar Webhook do Controlia**:
```json
{
  "message": {
    "text": "Texto da mensagem",
    "from": { "id": 123456789, "first_name": "João" },
    "chat": { "id": 123456789 }
  },
  "controlia": {
    "company_id": "uuid",
    "contact_id": "uuid",
    "conversation_id": "uuid",
    "message_id": "uuid",
    "channel": "telegram",
    "callback_url": "https://..."
  }
}
```

**Ajuste o campo `text` do Agent para**:
```
={{ $json.message.text }}
```

**Se usar Telegram Trigger direto** (mantendo seu workflow atual):
O Agent já está configurado corretamente com `={{ $json.message.text }}`. Você só precisa adicionar o nó HTTP Request no final para enviar a resposta de volta ao Controlia.

### 3.4 Adicionar Nó HTTP Request (Enviar Resposta)

Após o nó "Edit Fields", adicione um nó **HTTP Request**:

1. **Method**: POST
2. **URL**: 
   - Se recebeu do Controlia: `={{ $json.controlia.callback_url }}`
   - Se usa Telegram Trigger direto: `https://seu-dominio.com/api/webhooks/n8n/channel-response`
3. **Authentication**: None
4. **Send Body**: Yes
5. **Body Content Type**: JSON
6. **Body** (se recebeu do Controlia):
```json
{
  "output": "={{ $json.output }}",
  "controlia": {
    "company_id": "={{ $json.controlia.company_id }}",
    "contact_id": "={{ $json.controlia.contact_id }}",
    "conversation_id": "={{ $json.controlia.conversation_id }}",
    "message_id": "={{ $json.controlia.message_id }}",
    "channel": "={{ $json.controlia.channel }}",
    "channel_id": "={{ $json.message.chat.id }}"
  }
}
```

**Body** (se usa Telegram Trigger direto - NÃO RECOMENDADO):
```json
{
  "output": "={{ $json.output }}",
  "controlia": {
    "company_id": "SEU_COMPANY_ID",
    "conversation_id": "BUSCAR_OU_CRIAR",
    "channel": "telegram",
    "channel_id": "={{ $('Telegram Trigger').first().json.message.chat.id }}"
  }
}
```

**⚠️ Importante**: Se você usa Telegram Trigger direto, o Controlia não receberá as mensagens automaticamente. Recomendamos usar o webhook do Controlia para ter controle total e histórico completo.

### 3.5 Ativar Workflow

1. Salve o workflow
2. **Ative o workflow** (toggle no canto superior direito)
3. Verifique se o webhook está ativo (deve aparecer como "Listening")

---

## 📝 Passo 4: Configurar Webhook do Canal

### 4.1 Para Telegram

**IMPORTANTE**: Você precisa escolher uma das duas opções:

#### Opção A: Usar Webhook do Controlia (RECOMENDADO)

1. Configure o webhook do Telegram para apontar para o Controlia:
   ```bash
   curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
     -d "url=https://seu-dominio.com/api/webhooks/telegram"
   ```

   Ou use o navegador:
   ```
   https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook?url=https://seu-dominio.com/api/webhooks/telegram
   ```

2. Verifique se foi configurado:
   ```
   https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo
   ```

3. **Desative o Telegram Trigger no n8n** (ou remova-o), pois agora o Controlia receberá as mensagens primeiro

#### Opção B: Manter Telegram Trigger no n8n (NÃO RECOMENDADO)

Se você quiser manter o Telegram Trigger funcionando diretamente:
- O Controlia não receberá as mensagens automaticamente
- Você precisará criar um workflow separado no n8n para sincronizar com o Controlia
- Não terá histórico completo no CRM

### 4.2 Para WhatsApp

Configure o webhook no painel do seu provedor de WhatsApp para:
```
https://seu-dominio.com/api/webhooks/whatsapp
```

---

## 📝 Passo 5: Testar a Integração

### 5.1 Teste Básico

1. Envie uma mensagem no Telegram para seu bot
2. Verifique no n8n se o workflow foi executado:
   - Acesse **Executions** no n8n
   - Deve aparecer uma execução com status "Success"
3. Verifique se a resposta foi enviada:
   - Você deve receber a resposta do Agent no Telegram
4. Verifique no Controlia:
   - Acesse **Conversas**
   - Deve aparecer a conversa com as mensagens

### 5.2 Verificar Logs

1. **No Controlia**: Acesse **Automações** e veja os logs de execução
2. **No n8n**: Veja os logs de execução do workflow
3. **No navegador**: Abra o Console (F12) e veja os logs do servidor

---

## 🔧 Configuração Avançada

### Suportar Múltiplos Canais

Se você tem workflows diferentes para cada canal:

1. Crie uma automação para cada canal no Controlia
2. Configure o **trigger_conditions** para filtrar por canal:
   ```json
   {
     "channel": "telegram"
   }
   ```
3. Crie workflows separados no n8n ou use condições dentro do mesmo workflow

### Adicionar Filtros no n8n

Você pode adicionar um nó **IF** antes do Agent para filtrar mensagens:

```
[Webhook] → [IF] → [Agent] → [HTTP Request]
```

Condição do IF:
```
{{ $json.message.text }} existe E {{ $json.message.text }} não está vazio
```

### Tratamento de Erros

Adicione um nó **Error Trigger** no n8n para capturar erros:

```
[Webhook] → [Agent] → [HTTP Request]
              ↓ (erro)
         [Error Trigger] → [Notificar Admin]
```

---

## 🐛 Troubleshooting

### Problema: Mensagens não chegam no n8n

**Soluções**:
1. Verifique se a automação está **ativa** no Controlia
2. Verifique se o workflow está **ativo** no n8n
3. Verifique se a URL do webhook está correta
4. Teste o webhook manualmente:
   ```bash
   curl -X POST "https://seu-n8n.com/webhook/controlia-message" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Problema: Respostas não são enviadas

**Soluções**:
1. Verifique se o nó HTTP Request está configurado corretamente
2. Verifique se o `callback_url` está sendo enviado
3. Verifique os logs do Controlia para erros
4. Teste o endpoint de resposta manualmente

### Problema: Mensagens duplicadas

**Soluções**:
1. Verifique se há múltiplas automações ativas para o mesmo evento
2. Verifique se o webhook do canal está configurado apenas uma vez
3. Adicione deduplicação no n8n usando o message_id

### Problema: Erro de autenticação

**Soluções**:
1. Verifique se o Bot Token do Telegram está correto
2. Verifique se as credenciais do WhatsApp estão corretas
3. Verifique se os webhooks estão acessíveis publicamente

---

## 📊 Monitoramento

### No Controlia

1. Acesse **Automações** para ver:
   - Número de execuções
   - Última execução
   - Erros
2. Acesse **Analytics** para ver métricas de mensagens

### No n8n

1. Acesse **Executions** para ver:
   - Histórico de execuções
   - Tempo de execução
   - Erros
2. Configure alertas para falhas

---

## 🔐 Segurança

### Recomendações

1. **Use HTTPS**: Sempre use HTTPS para webhooks
2. **Valide Secrets**: Configure webhook secrets e valide no código
3. **Rate Limiting**: Configure rate limiting nos endpoints
4. **Autenticação**: Considere adicionar autenticação nos webhooks do n8n

### Exemplo de Validação de Secret

No n8n, adicione um nó **Code** antes do Agent:

```javascript
const secret = $json.controlia?.webhook_secret;
const expectedSecret = process.env.WEBHOOK_SECRET;

if (secret !== expectedSecret) {
  throw new Error('Webhook secret inválido');
}

return $input.all();
```

---

## 📚 Exemplos de Workflows

### Workflow Simples (Telegram)

```
[Webhook] → [Agent] → [HTTP Request]
```

### Workflow com Filtros

```
[Webhook] → [IF (tem texto)] → [Agent] → [HTTP Request]
```

### Workflow com Múltiplos Canais

```
[Webhook] → [Switch (por canal)] → [Agent Telegram] → [HTTP Request]
                              → [Agent WhatsApp] → [HTTP Request]
```

---

## ✅ Checklist Final

Antes de considerar a integração completa, verifique:

- [ ] **Passo 1**: Canais configurados no Controlia (Telegram, WhatsApp, etc.)
- [ ] **Passo 2**: Automação criada no Controlia com webhook URL do n8n
- [ ] **Passo 3**: Workflow criado e ativado no n8n com nó HTTP Request configurado
- [ ] **Passo 4**: Webhook do canal configurado para apontar para o Controlia
- [ ] **Passo 5**: Teste básico funcionando (mensagem → resposta)
- [ ] Logs sendo registrados corretamente no Controlia
- [ ] Mensagens aparecendo no Controlia (página Conversas)
- [ ] Respostas sendo enviadas aos canais
- [ ] Logs de automação aparecendo em **Automações** no Controlia

---

## 📋 Resumo do Fluxo Completo

### Fluxo de Mensagem Recebida

1. **Usuário envia mensagem** → Telegram/WhatsApp
2. **Canal envia webhook** → Controlia (`/api/webhooks/telegram` ou `/api/webhooks/whatsapp`)
3. **Controlia processa**:
   - Cria/busca contato
   - Cria/busca conversa
   - Salva mensagem no banco
   - Busca automações ativas para `new_message`
4. **Controlia envia para n8n** → Webhook URL da automação
5. **n8n processa**:
   - Agent processa mensagem
   - Gera resposta
6. **n8n envia resposta** → Controlia (`/api/webhooks/n8n/channel-response`)
7. **Controlia envia ao canal**:
   - Telegram: Via API do Telegram
   - WhatsApp: Via API do provedor
8. **Controlia salva resposta** no banco como mensagem da IA

### Dados Enviados do Controlia para n8n

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": { "id": 123456789, "first_name": "João" },
    "chat": { "id": 123456789 },
    "text": "Olá!",
    "date": 1234567890
  },
  "controlia": {
    "company_id": "uuid-da-empresa",
    "contact_id": "uuid-do-contato",
    "conversation_id": "uuid-da-conversa",
    "message_id": "uuid-da-mensagem",
    "channel": "telegram",
    "callback_url": "https://seu-dominio.com/api/webhooks/n8n/channel-response"
  }
}
```

### Dados Esperados do n8n para Controlia

```json
{
  "output": "Resposta do Agent",
  "controlia": {
    "company_id": "uuid-da-empresa",
    "contact_id": "uuid-do-contato",
    "conversation_id": "uuid-da-conversa",
    "message_id": "uuid-da-mensagem",
    "channel": "telegram",
    "channel_id": "123456789"
  }
}
```

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do Controlia
2. Verifique os logs do n8n
3. Teste cada componente isoladamente
4. Consulte a documentação do n8n: https://docs.n8n.io/
5. Consulte a documentação do Controlia: `docs/INTEGRACAO_N8N.md`

---

## 🎉 Pronto!

Sua integração está completa! Agora todas as mensagens dos canais configurados serão processadas pelo seu Agent de IA no n8n e as respostas serão enviadas automaticamente.

---

## 📖 Resumo Executivo - Passos para Integração

### Para Integrar Seu Workflow n8n Existente:

1. **No Controlia**:
   - Acesse **Automações > Nova Automação**
   - Nome: "Agente IA - Mensagens"
   - Evento: `new_message`
   - Webhook URL: (deixe vazio por enquanto)
   - Salve

2. **No n8n**:
   - Adicione nó **HTTP Request** após "Edit Fields"
   - URL: `https://seu-dominio.com/api/webhooks/n8n/channel-response`
   - Body: (veja Passo 3.4 do guia completo)
   - Ative o workflow

3. **Volte ao Controlia**:
   - Acesse **Configurações > n8n**
   - Edite a automação criada
   - Cole a URL do webhook do n8n
   - Salve

4. **Configure Webhook do Telegram**:
   - Execute: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://seu-dominio.com/api/webhooks/telegram`

5. **Teste**: Envie uma mensagem no Telegram

### Arquivos Criados/Modificados:

- ✅ `app/api/webhooks/n8n/channel-response/route.ts` - Recebe respostas do n8n
- ✅ `app/api/webhooks/telegram/route.ts` - Atualizado para enviar ao n8n
- ✅ `app/api/webhooks/whatsapp/route.ts` - Atualizado para enviar ao n8n
- ✅ `app/automations/new/page.tsx` - Página para criar automações
- ✅ `docs/INTEGRACAO_N8N_SELFHOSTED.md` - Guia completo

### Próximos Passos:

1. Siga o guia completo em `docs/INTEGRACAO_N8N_SELFHOSTED.md`
2. Configure os canais desejados
3. Crie as automações
4. Teste a integração
5. Monitore os logs
