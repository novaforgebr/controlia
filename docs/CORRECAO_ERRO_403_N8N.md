# Correção: Erro 403 ao enviar mensagem para n8n

## 🔍 Problema Identificado

Ao enviar mensagem do Telegram para o Controlia, a mensagem era salva corretamente, mas o envio para o n8n falhava com erro:

```
Status: 403 Forbidden
Resposta: {"message":"Provided secret is not valid"}
```

## ✅ Solução Implementada

O problema era que o n8n estava configurado para aceitar o secret como **Header HTTP** (`X-Webhook-Secret`), mas o código estava enviando apenas como **query parameter** na URL (`?secret=xxx`).

### Mudanças Realizadas

1. **Priorização do secret:**
   - Primeiro tenta usar o secret das settings da empresa (`n8n_webhook_secret`)
   - Se não existir, extrai da URL do webhook

2. **Envio como Header HTTP:**
   - **SEMPRE** envia o secret como header `X-Webhook-Secret` quando disponível
   - Mesmo que o secret esteja na URL, também envia como header (muitos n8n precisam)

3. **Decodificação correta:**
   - O secret é decodificado corretamente da URL (convertendo `%40` para `@`)

## 📋 Configuração no n8n

Para que o secret funcione, o webhook no n8n deve estar configurado com:

**Authentication: Header Auth**
- **Name:** `X-Webhook-Secret`
- **Value:** O valor do secret (ex: `N0v4F0rg3@2025`)

**OU**

**Authentication: None** (com secret na URL)
- URL: `https://controlia.up.railway.app/webhook/xxx/webhook?secret=N0v4F0rg3@2025`
- Mas ainda assim o código enviará como header também para garantir compatibilidade

## 🔧 Como Configurar o Secret

### Opção 1: Nas Settings da Empresa (Recomendado)

1. Acesse `/settings` no Controlia
2. Vá para a aba de integrações
3. Configure o campo `n8n_webhook_secret`
4. Salve as configurações

### Opção 2: Na URL do Webhook

Ao criar a automação, adicione o secret na URL:
```
https://controlia.up.railway.app/webhook/xxx/webhook?secret=N0v4F0rg3@2025
```

**Nota:** O caractere `@` será automaticamente codificado como `%40` na URL, mas será decodificado corretamente antes de ser enviado como header.

## ✅ Resultado Esperado

Após a correção, os logs devem mostrar:

```
🔐 Usando secret das settings da empresa
🔐 Secret enviado como header HTTP: X-Webhook-Secret
🔐 Valor do secret: N0v4F0rg3@2025
🔐 Tamanho do secret: 13 caracteres
📤 ENVIANDO para n8n:
   Headers: {
     "Content-Type": "application/json",
     "X-Webhook-Secret": "N0v4F0rg3@2025"
   }
```

E a resposta do n8n deve ser:

```
Status: 200 OK
```

## 🧪 Teste

1. Envie uma nova mensagem do Telegram
2. Verifique os logs da Vercel
3. Confirme que o secret está sendo enviado como header
4. Verifique se o n8n recebeu e processou a mensagem

## 🔍 Troubleshooting

### Se ainda receber 403:

1. **Verifique o valor do secret:**
   - O secret no n8n deve ser EXATAMENTE igual ao configurado
   - Verifique espaços em branco ou caracteres especiais

2. **Verifique a configuração do webhook no n8n:**
   - Authentication deve ser "Header Auth"
   - Nome do header deve ser `X-Webhook-Secret`

3. **Verifique os logs:**
   - Procure por: `🔐 Secret enviado como header HTTP`
   - Confirme que o valor do secret está correto

### Se o secret não estiver sendo enviado:

1. **Configure nas settings:**
   - Acesse `/settings` > Integrações
   - Configure `n8n_webhook_secret`
   - Salve

2. **Ou adicione na URL do webhook:**
   - Ao criar/editar a automação
   - Adicione `?secret=xxx` na URL

