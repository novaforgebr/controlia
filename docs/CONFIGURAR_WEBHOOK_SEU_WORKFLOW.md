# 🔧 Configurar Webhook no Seu Workflow n8n

Baseado no seu workflow, você tem dois nós que recebem mensagens:

1. **Telegram Trigger** (`8097328d-757f-4d4d-8f00-4f2e6cb27233`)
   - Recebe mensagens diretamente do Telegram
   - **NÃO tem opção de secret** (isso é normal)

2. **Webhook** (`94d8922a-d802-42f6-9fd2-9e492fc6f9d9`)
   - Path: `/controlia-messag`
   - Recebe mensagens do Controlia
   - **É AQUI que você configura o secret**

## 📝 Como Configurar Secret no Nó Webhook

### Passo 1: Abrir Configurações do Webhook

1. No seu workflow n8n, clique no nó **"Webhook"** (não no Telegram Trigger)
2. Você verá as configurações do webhook

### Passo 2: Verificar/Configurar Autenticação

1. Nas configurações do Webhook, procure por:
   - **"Authentication"**
   - **"Require Secret"**
   - **"Webhook Authentication"**

2. **Se NÃO houver opção de secret:**
   - O webhook está sem autenticação
   - Você pode deixar assim (não recomendado para produção)
   - OU adicionar autenticação (recomendado)

3. **Se houver opção de secret:**
   - Ative **"Require Secret"** ou **"Authentication"**
   - Configure um secret (ex: `abc123xyz789`)
   - **Copie o secret** - você precisará dele no Controlia

### Passo 3: Configurar no Controlia

1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **"n8n"**, cole o secret no campo **"Webhook Secret do n8n"**
3. Clique em **"Salvar Configurações"**

## 🔄 Como Seu Workflow Funciona

### Fluxo Atual:

```
Telegram → [Telegram Trigger] → [Agent] → [Prepare Response Data] → [HTTP Request] → Controlia → Telegram
```

### Fluxo com Controlia (Recomendado):

```
Telegram → Controlia → [Webhook] → [Agent] → [Prepare Response Data] → [HTTP Request] → Controlia → Telegram
```

**Vantagens do fluxo com Controlia:**
- ✅ Todas as mensagens ficam registradas no Controlia
- ✅ Histórico completo de conversas
- ✅ Melhor controle e auditoria

## ⚙️ Configuração do Nó Webhook

Seu nó Webhook deve ter estas configurações:

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "/controlia-messag",
    "responseMode": "lastNode",
    "options": {
      "authentication": "genericCredentialType",  // Se usar autenticação
      "secret": "SEU_SECRET_AQUI"  // Se configurado
    }
  }
}
```

## 🧪 Testar

1. **Configure o secret no nó Webhook** (se ainda não configurou)
2. **Configure o secret no Controlia** (Configurações > Integrações > n8n)
3. **Envie uma mensagem no Telegram**
4. **Verifique os logs da Vercel:**
   - Deve aparecer: `🔐 Secret adicionado à URL do webhook`
   - Não deve aparecer: `❌ Erro ao enviar para n8n: {"message":"Provided secret is not valid"}`

## ❓ Se Não Quiser Usar Secret

Se você não quiser configurar autenticação no Webhook:

1. **Deixe o Webhook sem autenticação** (não recomendado para produção)
2. **NÃO configure secret no Controlia** (deixe o campo vazio)
3. O Controlia enviará mensagens sem secret

⚠️ **Atenção**: Sem autenticação, qualquer pessoa que souber a URL do webhook pode enviar dados para ele.

## ✅ Checklist

- [ ] Nó Webhook identificado no workflow
- [ ] Secret configurado no nó Webhook (ou autenticação desabilitada)
- [ ] Secret configurado no Controlia (se usar autenticação)
- [ ] Teste completo funcionando

