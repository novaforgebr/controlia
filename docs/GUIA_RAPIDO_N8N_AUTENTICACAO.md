# ⚡ Guia Rápido: Configurar Autenticação n8n

## 🎯 Opções Disponíveis no n8n

No nó **Webhook** do n8n, você tem estas opções de autenticação:

1. **Header Auth** ⭐ (Recomendado)
2. **Basic Auth**
3. **JWT Auth**
4. **None** (Sem autenticação - não recomendado)

## ✅ Configuração Rápida: Header Auth

### No n8n:

1. Abra o nó **Webhook**
2. Em **Authentication**, selecione **"Header Auth"**
3. Configure:
   - **Header Name**: `X-Webhook-Secret`
   - **Header Value**: `abc123xyz789` (escolha um secret seguro)
4. **Salve**

### No Controlia:

1. Acesse **Configurações > Integrações**
2. Na seção **"n8n"**, cole o secret no campo **"Webhook Secret do n8n"**
3. **Salve**

✅ **Pronto!** O Controlia enviará o secret como header HTTP automaticamente.

## 🔄 Como Funciona

```
Controlia → [Header: X-Webhook-Secret: abc123xyz789] → n8n Webhook → Valida → Processa
```

O Controlia envia o secret:
- ✅ Como header HTTP (`X-Webhook-Secret`)
- ✅ Como query parameter na URL (`?secret=abc123xyz789`)

Isso garante compatibilidade com ambas as configurações do n8n.

## ⚠️ Se Não Quiser Usar Autenticação

1. No n8n, selecione **"None"** em Authentication
2. No Controlia, deixe o campo "Webhook Secret do n8n" vazio
3. Funcionará, mas o webhook ficará público

## 🧪 Testar

1. Configure Header Auth no n8n
2. Configure o secret no Controlia
3. Envie uma mensagem no Telegram
4. Verifique os logs da Vercel:
   - Deve aparecer: `🔐 Secret também enviado como header HTTP`
   - Não deve aparecer: `❌ Erro ao enviar para n8n`

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/CONFIGURAR_AUTENTICACAO_N8N_HEADER_AUTH.md` - Guia completo de Header Auth
- `docs/PASSO_A_PASSO_INTEGRACAO_N8N.md` - Passo a passo completo

