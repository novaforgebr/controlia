# 🔧 Como Corrigir o Webhook do Telegram

## Problema Identificado

O webhook do Telegram está configurado para apontar para o **n8n** (Railway), mas deveria apontar para o **Controlia** (Vercel).

**URL Atual (INCORRETA):**
```
https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook
```

**URL Correta:**
```
https://controliaa.vercel.app/api/webhooks/telegram
```

## ✅ Solução: Reconfigurar o Webhook

### Passo 1: Configurar Webhook do Telegram para Controlia

Execute este comando (substitua `SEU_BOT_TOKEN` pelo seu token):

```bash
curl "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

**Exemplo com seu token:**
```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

### Passo 2: Verificar se foi configurado corretamente

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
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

## 🔄 Fluxo Correto Após a Correção

```
1. Lead envia mensagem no Telegram
   ↓
2. Telegram → Controlia (/api/webhooks/telegram)
   ↓
3. Controlia:
   - Cria/atualiza contato
   - Cria/reutiliza conversa
   - Salva mensagem no banco (direction: inbound, sender_type: human)
   ↓
4. Controlia verifica automações ativas
   ↓
5. Se houver automação → Controlia envia para n8n
   ↓
6. n8n processa com Agent de IA
   ↓
7. n8n envia resposta → Controlia (/api/webhooks/n8n/channel-response)
   ↓
8. Controlia:
   - Salva mensagem da IA no banco (direction: outbound, sender_type: ai)
   - Envia resposta para Telegram
   ↓
9. Lead recebe resposta no Telegram
```

## ✅ Benefícios

- ✅ Todas as mensagens (lead e IA) ficam registradas no Controlia
- ✅ Histórico completo da conversa na plataforma
- ✅ Possibilidade de intervenção humana quando necessário
- ✅ Analytics e relatórios completos

## ⚠️ Importante

Após reconfigurar o webhook:
1. As **novas mensagens** do lead serão recebidas pelo Controlia
2. As mensagens **antigas** que foram para o n8n não aparecerão (mas isso é normal)
3. Teste enviando uma nova mensagem no Telegram
4. Verifique se a mensagem aparece no Controlia

## 🧪 Teste

Após reconfigurar, envie uma mensagem no Telegram e verifique:

1. **No Controlia**: A mensagem deve aparecer na conversa
2. **No banco de dados**: Execute:
   ```sql
   SELECT * FROM messages 
   WHERE direction = 'inbound' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. **Logs da Vercel**: Verifique se aparecem os logs:
   - `📥 Webhook Telegram recebido`
   - `✅ Mensagem criada com sucesso`

