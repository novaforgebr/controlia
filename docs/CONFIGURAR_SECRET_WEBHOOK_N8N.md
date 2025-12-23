# 🔐 Como Configurar Secret no Webhook n8n

## ⚠️ IMPORTANTE: Diferença entre Telegram Trigger e Webhook

No n8n, existem dois tipos de nós que podem receber mensagens:

1. **Telegram Trigger** (`n8n-nodes-base.telegramTrigger`)
   - Recebe mensagens **diretamente do Telegram**
   - **NÃO tem opção de secret/autenticação**
   - Isso é normal e esperado

2. **Webhook** (`n8n-nodes-base.webhook`)
   - Recebe mensagens **do Controlia** (ou qualquer outra fonte HTTP)
   - **TEM opção de secret/autenticação**
   - É neste nó que você configura o secret

## 📝 Como Configurar Secret no Nó Webhook

### Passo 1: Localizar o Nó Webhook

1. Abra seu workflow no n8n
2. Procure pelo nó **"Webhook"** (não o Telegram Trigger)
3. Clique no nó para abrir as configurações

### Passo 2: Configurar Autenticação

No n8n, o nó Webhook oferece estas opções de autenticação:

- **Basic Auth** - Autenticação básica HTTP
- **Header Auth** - Autenticação via header customizado (recomendado)
- **JWT Auth** - Autenticação via JWT
- **None** - Sem autenticação (não recomendado)

### Passo 3: Configurar Header Auth (Recomendado)

1. **Selecione "Header Auth"** no dropdown de Authentication
2. **Configure o header:**
   - **Header Name**: `X-Webhook-Secret` (ou `X-n8n-Webhook-Secret`)
   - **Header Value**: `abc123xyz789` (seu secret - anote este valor)
3. **Salve as configurações**

### Passo 4: Verificar Configuração

O nó Webhook deve ter:
- ✅ Método: **POST**
- ✅ Path: `/controlia-messag` (ou o que você configurou)
- ✅ **Authentication**: **Header Auth**
- ✅ **Header Name**: `X-Webhook-Secret`
- ✅ **Header Value**: `abc123xyz789` (seu secret)

## 🔄 Fluxo de Mensagens

### Quando o Controlia envia para o n8n:

```
Controlia → [Webhook com secret] → AI Agent → HTTP Request → Controlia → Telegram
```

O secret é necessário **apenas** no nó Webhook que recebe do Controlia.

### Quando o Telegram envia diretamente para o n8n:

```
Telegram → [Telegram Trigger sem secret] → AI Agent → HTTP Request → Controlia → Telegram
```

O Telegram Trigger **não precisa** de secret porque o Telegram já autentica via Bot Token.

## ✅ Configurar Secret no Controlia

Após obter o secret do nó Webhook:

1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **"n8n"**, cole o secret no campo **"Webhook Secret do n8n"**
3. Clique em **"Salvar Configurações"**

O Controlia adicionará automaticamente o secret à URL do webhook quando enviar mensagens para o n8n.

## 🧪 Testar

1. Envie uma mensagem no Telegram
2. Verifique os logs da Vercel:
   - Deve aparecer: `🔐 Secret adicionado à URL do webhook`
   - Não deve aparecer: `❌ Erro ao enviar para n8n: {"message":"Provided secret is not valid"}`

## ❓ FAQ

### P: O Telegram Trigger precisa de secret?
**R:** Não. O Telegram Trigger não tem opção de secret e não precisa, pois o Telegram já autentica via Bot Token.

### P: Onde configuro o secret?
**R:** Apenas no nó **"Webhook"** que recebe mensagens do Controlia.

### P: Posso desabilitar o secret no Webhook?
**R:** Sim, mas não é recomendado para produção, pois deixa o webhook público e qualquer pessoa pode enviar dados para ele.

### P: O secret precisa ser o mesmo no Controlia e no n8n?
**R:** Sim! O secret configurado no Controlia deve ser **exatamente igual** ao secret configurado no nó Webhook do n8n.

