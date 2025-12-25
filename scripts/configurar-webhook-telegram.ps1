# Script PowerShell para configurar webhook do Telegram usando curl
# Uso: .\scripts\configurar-webhook-telegram.ps1 -BotToken "SEU_TOKEN" -WebhookUrl "https://controliaa.vercel.app/api/webhooks/telegram"

param(
    [Parameter(Mandatory=$true)]
    [string]$BotToken,
    
    [Parameter(Mandatory=$false)]
    [string]$WebhookUrl = "https://controliaa.vercel.app/api/webhooks/telegram"
)

Write-Host "🚀 Configurando webhook do Telegram" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Bot Token: $($BotToken.Substring(0, [Math]::Min(10, $BotToken.Length)))..."
Write-Host "   Webhook URL: $WebhookUrl"
Write-Host ""

# 1. Verificar status atual do webhook
Write-Host "📡 Verificando status atual do webhook..." -ForegroundColor Blue
try {
    $webhookInfoResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/getWebhookInfo" -Method Get
    
    if ($webhookInfoResponse.ok) {
        $currentUrl = $webhookInfoResponse.result.url
        $pendingUpdates = $webhookInfoResponse.result.pending_update_count
        
        Write-Host "✅ Status do webhook obtido" -ForegroundColor Green
        Write-Host "   URL atual: $(if ($currentUrl) { $currentUrl } else { 'Não configurado' })"
        Write-Host "   Pendências: $pendingUpdates"
        
        if ($currentUrl -eq $WebhookUrl) {
            Write-Host "✅ Webhook já está configurado corretamente!" -ForegroundColor Green
            
            if ($webhookInfoResponse.result.last_error_message) {
                $errorDate = if ($webhookInfoResponse.result.last_error_date) {
                    [DateTimeOffset]::FromUnixTimeSeconds($webhookInfoResponse.result.last_error_date).LocalDateTime
                } else {
                    "Data desconhecida"
                }
                Write-Host "⚠️  Último erro: $errorDate - $($webhookInfoResponse.result.last_error_message)" -ForegroundColor Yellow
            }
            
            exit 0
        } else {
            Write-Host "🔧 Reconfigurando webhook..." -ForegroundColor Yellow
            Write-Host "   De: $(if ($currentUrl) { $currentUrl } else { 'Não configurado' })"
            Write-Host "   Para: $WebhookUrl"
        }
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar status atual" -ForegroundColor Yellow
    Write-Host "   Tentando configurar novo webhook..."
}

Write-Host ""

# 2. Configurar webhook
Write-Host "🔧 Configurando webhook..." -ForegroundColor Blue
try {
    $body = @{
        url = $WebhookUrl
        allowed_updates = @("message", "edited_message", "callback_query")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/setWebhook" -Method Post -Body $body -ContentType "application/json"
    
    if ($response.ok) {
        Write-Host "✅ Webhook configurado com sucesso!" -ForegroundColor Green
        Write-Host ""
        
        # Verificar novamente o status
        Write-Host "📡 Verificando status final..." -ForegroundColor Blue
        $finalInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/getWebhookInfo" -Method Get
        
        if ($finalInfo.ok) {
            Write-Host "✅ Status confirmado:" -ForegroundColor Green
            Write-Host "   URL: $($finalInfo.result.url)"
            Write-Host "   Pendências: $($finalInfo.result.pending_update_count)"
            
            if ($finalInfo.result.last_error_message) {
                $errorDate = if ($finalInfo.result.last_error_date) {
                    [DateTimeOffset]::FromUnixTimeSeconds($finalInfo.result.last_error_date).LocalDateTime
                } else {
                    "Data desconhecida"
                }
                Write-Host "⚠️  Último erro: $errorDate - $($finalInfo.result.last_error_message)" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "✅ Configuração concluída!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Próximos passos:" -ForegroundColor Blue
        Write-Host "   1. Envie uma mensagem para o bot do Telegram"
        Write-Host "   2. Verifique se a mensagem aparece no Controlia"
        Write-Host "   3. Verifique os logs do webhook se houver problemas"
    } else {
        Write-Host "❌ Erro ao configurar webhook: $($response.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao configurar webhook: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta: $responseBody"
    }
    exit 1
}

