#!/bin/bash
# Exemplo prático de comando curl para configurar webhook do Telegram
# Copie e cole este comando, substituindo <SEU_BOT_TOKEN> pelo seu token real

# IMPORTANTE: Substitua <SEU_BOT_TOKEN> pelo seu token do Telegram Bot
BOT_TOKEN="<SEU_BOT_TOKEN>"
WEBHOOK_URL="https://controliaa.vercel.app/api/webhooks/telegram"

echo "🔧 Configurando webhook do Telegram..."
echo ""

# Comando curl completo
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"allowed_updates\": [\"message\", \"edited_message\", \"callback_query\"]
  }"

echo ""
echo ""
echo "✅ Comando executado!"
echo ""
echo "📋 Para verificar o status, execute:"
echo "curl -X GET \"https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo\""

