# 🔧 Corrigir: Webhook do Telegram Não Está Sendo Chamado

## 🔍 Problema Identificado

O log da Vercel mostra apenas:
```
POST /api/webhooks/n8n/channel-response
```

**Mas NÃO mostra:**
```
POST /api/webhooks/telegram
```

Isso significa que **o Telegram não está enviando mensagens para o Controlia**. O Telegram pode estar configurado para enviar diretamente para o n8n.

## ✅ SOLUÇÃO: Reconfigurar Webhook do Telegram

### Passo 1: Verificar Webhook Atual do Telegram

Execute no terminal:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Verifique a URL atual:**
- Se for `https://controlia.up.railway.app/...` → Está apontando para n8n (ERRADO)
- Se for `https://controliaa.vercel.app/api/webhooks/telegram` → Está correto

### Passo 2: Configurar Webhook para Controlia

Execute no terminal (substitua `SEU_BOT_TOKEN`):

```bash
curl "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

**Exemplo com seu token:**
```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Passo 3: Verificar se Foi Configurado

Execute novamente:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Deve mostrar:**
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    ...
  }
}
```

### Passo 4: Testar

1. **Envie uma mensagem no Telegram** para o bot
2. **Verifique os logs da Vercel:**
   - Deve aparecer: `POST /api/webhooks/telegram`
   - Deve aparecer: `📥 Webhook Telegram recebido:`
   - Deve aparecer: `📨 Processando mensagem do Telegram:`
   - Deve aparecer: `✅ Mensagem inbound salva no banco`

3. **Se aparecer:**
   - ✅ Webhook está funcionando
   - ✅ Mensagem deve aparecer na conversa

## 🔄 Fluxo Correto

### Fluxo Atual (ERRADO):
```
Telegram → n8n → Controlia (channel-response)
```

**Problema:** Mensagens do lead não passam pelo Controlia primeiro.

### Fluxo Correto:
```
Telegram → Controlia (/api/webhooks/telegram) → n8n → Controlia (/api/webhooks/n8n/channel-response) → Telegram
```

**Vantagem:** Todas as mensagens ficam registradas no Controlia.

## 📋 Checklist

- [ ] Webhook do Telegram verificado (`getWebhookInfo`)
- [ ] Webhook configurado para Controlia (`setWebhook`)
- [ ] Mensagem enviada no Telegram
- [ ] Logs da Vercel mostram `POST /api/webhooks/telegram`
- [ ] Mensagem aparece na conversa

## 🎯 Próximos Passos

1. **Execute o comando `setWebhook`** para apontar para o Controlia
2. **Envie uma mensagem no Telegram**
3. **Verifique os logs da Vercel** - deve aparecer `POST /api/webhooks/telegram`
4. **Verifique se a mensagem aparece** na conversa

Após reconfigurar o webhook, as mensagens do lead devem começar a aparecer!

