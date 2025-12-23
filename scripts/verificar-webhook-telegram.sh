#!/bin/bash

# Script para verificar e reconfigurar webhook do Telegram

TELEGRAM_BOT_TOKEN="8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg"
CONTROLIA_WEBHOOK_URL="https://controliaa.vercel.app/api/webhooks/telegram"

echo "🔍 Verificando webhook atual do Telegram..."
echo ""

# Verificar webhook atual
echo "1. Verificando webhook atual:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'

echo ""
echo ""

# Reconfigurar webhook para Controlia
echo "2. Reconfigurando webhook para Controlia..."
RESULT=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${CONTROLIA_WEBHOOK_URL}")
echo "$RESULT" | jq '.'

echo ""
echo ""

# Verificar novamente
echo "3. Verificando webhook após reconfiguração:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'

echo ""
echo "✅ Verificação concluída!"

