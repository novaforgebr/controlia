# Solução Final: Erro 403 ao Enviar para n8n

## 🔍 Problema

O n8n está configurado com **Authentication: Header Auth** e espera receber o secret como header HTTP `X-Webhook-Secret`, mas o código estava enviando apenas como query parameter na URL.

## ✅ Correção Implementada

O código foi corrigido para:

1. **SEMPRE extrair o secret da URL** quando não estiver nas settings da empresa
2. **SEMPRE enviar o secret como header HTTP** (`X-Webhook-Secret`) quando disponível
3. **Decodificar corretamente** o secret da URL (convertendo `%40` para `@`)

### O que o código faz agora:

```typescript
// 1. Tenta usar secret das settings primeiro
if (n8nWebhookSecret) {
  secretToUse = n8nWebhookSecret
}

// 2. Se não existir, extrai da URL e decodifica
if (!secretToUse && hasSecretInUrl) {
  const decodedSecret = decodeURIComponent(secretFromUrl)
  secretToUse = decodedSecret
}

// 3. SEMPRE envia como header HTTP
if (secretToUse) {
  headers['X-Webhook-Secret'] = secretToUse
}
```

## 📋 Próximos Passos

### 1. Fazer Deploy do Código

O código atualizado precisa ser deployado na Vercel:

```bash
git add .
git commit -m "fix: Enviar secret do n8n como header HTTP"
git push
```

Ou faça o deploy manualmente através da interface da Vercel.

### 2. Verificar os Logs Após Deploy

Após o deploy, quando enviar uma nova mensagem, os logs devem mostrar:

```
🔐 Extraindo secret da URL (decodificado): N0v4F...
🔐 Secret enviado como header HTTP: X-Webhook-Secret
🔐 Valor do secret: N0v4F0rg3@2025
🔐 Tamanho do secret: 13 caracteres
📤 ENVIANDO para n8n:
   Headers: {
     "Content-Type": "application/json",
     "X-Webhook-Secret": "N0v4F0rg3@2025"
   }
```

**IMPORTANTE:** Os logs antigos mostravam:
```
🔐 NÃO adicionando headers de autenticação - o secret já está na URL  ❌ (versão antiga)
```

Os logs novos devem mostrar:
```
🔐 Secret enviado como header HTTP: X-Webhook-Secret  ✅ (versão nova)
```

### 3. Verificar Configuração do n8n

Confirme que o webhook no n8n está configurado como mostrado nas imagens:

- **Authentication:** Header Auth
- **Credential:** Header Auth account
- **Name:** `X-Webhook-Secret`
- **Value:** `N0v4F0rg3@2025` (o valor exato do secret)

### 4. Testar

1. Envie uma nova mensagem do Telegram
2. Verifique os logs da Vercel
3. Confirme que o header `X-Webhook-Secret` está sendo enviado
4. Verifique se o n8n recebe e processa a mensagem (status 200 OK)

## 🔍 Troubleshooting

### Se ainda receber 403 após o deploy:

1. **Verifique o valor do secret:**
   - O valor no n8n deve ser EXATAMENTE igual: `N0v4F0rg3@2025`
   - Verifique espaços em branco ou caracteres especiais

2. **Verifique os logs:**
   - Procure por: `🔐 Secret enviado como header HTTP: X-Webhook-Secret`
   - Confirme que o valor do secret está correto no log

3. **Verifique a configuração do n8n:**
   - Authentication deve ser "Header Auth"
   - Nome do header deve ser `X-Webhook-Secret` (exato, com maiúsculas/minúsculas)

### Se os logs ainda mostrarem a versão antiga:

- O deploy não foi concluído
- Aguarde alguns minutos e tente novamente
- Ou faça um novo deploy manual

## ✅ Resultado Esperado

Após o deploy e correção:

1. ✅ Mensagem do Telegram → Controlia (salva no banco)
2. ✅ Controlia extrai secret da URL e decodifica
3. ✅ Controlia envia secret como header `X-Webhook-Secret`
4. ✅ n8n recebe e valida o secret (status 200 OK)
5. ✅ n8n processa a mensagem
6. ✅ n8n retorna resposta → Controlia
7. ✅ Controlia envia resposta para Telegram

