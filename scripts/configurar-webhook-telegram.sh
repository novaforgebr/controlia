#!/bin/bash

# Script para configurar webhook do Telegram usando curl
# Uso: ./scripts/configurar-webhook-telegram.sh <BOT_TOKEN> [WEBHOOK_URL]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se o bot token foi fornecido
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erro: Bot Token do Telegram é obrigatório${NC}"
    echo ""
    echo "Uso: $0 <BOT_TOKEN> [WEBHOOK_URL]"
    echo ""
    echo "Exemplo:"
    echo "  $0 123456789:ABCdefGHIjklMNOpqrsTUVwxyz https://controliaa.vercel.app/api/webhooks/telegram"
    echo ""
    echo "Ou configure a variável de ambiente:"
    echo "  export TELEGRAM_BOT_TOKEN='seu_token_aqui'"
    echo "  export WEBHOOK_URL='https://controliaa.vercel.app/api/webhooks/telegram'"
    echo "  $0"
    exit 1
fi

# Obter bot token (argumento ou variável de ambiente)
BOT_TOKEN="${1:-$TELEGRAM_BOT_TOKEN}"

# Obter URL do webhook (argumento, variável de ambiente ou padrão)
WEBHOOK_URL="${2:-${WEBHOOK_URL:-https://controliaa.vercel.app/api/webhooks/telegram}}"

echo -e "${BLUE}🚀 Configurando webhook do Telegram${NC}"
echo ""
echo -e "${YELLOW}📋 Configurações:${NC}"
echo "   Bot Token: ${BOT_TOKEN:0:10}..."
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Verificar status atual do webhook
echo -e "${BLUE}📡 Verificando status atual do webhook...${NC}"
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

if echo "$WEBHOOK_INFO" | grep -q '"ok":true'; then
    CURRENT_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    PENDING_UPDATES=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
    
    echo -e "${GREEN}✅ Status do webhook obtido${NC}"
    echo "   URL atual: ${CURRENT_URL:-Não configurado}"
    echo "   Pendências: ${PENDING_UPDATES:-0}"
    
    if [ "$CURRENT_URL" = "$WEBHOOK_URL" ]; then
        echo -e "${GREEN}✅ Webhook já está configurado corretamente!${NC}"
        
        # Verificar se há erros
        LAST_ERROR=$(echo "$WEBHOOK_INFO" | grep -o '"last_error_message":"[^"]*' | cut -d'"' -f4 || echo "")
        if [ -n "$LAST_ERROR" ]; then
            echo -e "${YELLOW}⚠️  Último erro: $LAST_ERROR${NC}"
        fi
        
        exit 0
    else
        echo -e "${YELLOW}🔧 Reconfigurando webhook...${NC}"
        echo "   De: ${CURRENT_URL:-Não configurado}"
        echo "   Para: $WEBHOOK_URL"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar status atual${NC}"
    echo "   Tentando configurar novo webhook..."
fi

echo ""

# 2. Configurar webhook
echo -e "${BLUE}🔧 Configurando webhook...${NC}"
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"url\": \"$WEBHOOK_URL\",
        \"allowed_updates\": [\"message\", \"edited_message\", \"callback_query\"]
    }")

# Verificar resposta
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook configurado com sucesso!${NC}"
    echo ""
    
    # Verificar novamente o status
    echo -e "${BLUE}📡 Verificando status final...${NC}"
    FINAL_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
    
    if echo "$FINAL_INFO" | grep -q '"ok":true'; then
        FINAL_URL=$(echo "$FINAL_INFO" | grep -o '"url":"[^"]*' | cut -d'"' -f4)
        PENDING=$(echo "$FINAL_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
        LAST_ERROR_DATE=$(echo "$FINAL_INFO" | grep -o '"last_error_date":[0-9]*' | cut -d':' -f2 || echo "")
        LAST_ERROR_MSG=$(echo "$FINAL_INFO" | grep -o '"last_error_message":"[^"]*' | cut -d'"' -f4 || echo "")
        
        echo -e "${GREEN}✅ Status confirmado:${NC}"
        echo "   URL: $FINAL_URL"
        echo "   Pendências: ${PENDING:-0}"
        
        if [ -n "$LAST_ERROR_DATE" ] && [ -n "$LAST_ERROR_MSG" ]; then
            ERROR_DATE=$(date -d "@$LAST_ERROR_DATE" 2>/dev/null || echo "Data desconhecida")
            echo -e "${YELLOW}⚠️  Último erro: $ERROR_DATE - $LAST_ERROR_MSG${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}✅ Configuração concluída!${NC}"
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "   1. Envie uma mensagem para o bot do Telegram"
    echo "   2. Verifique se a mensagem aparece no Controlia"
    echo "   3. Verifique os logs do webhook se houver problemas"
    
else
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"description":"[^"]*' | cut -d'"' -f4 || echo "Erro desconhecido")
    echo -e "${RED}❌ Erro ao configurar webhook: $ERROR_MSG${NC}"
    echo ""
    echo "Resposta completa:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

