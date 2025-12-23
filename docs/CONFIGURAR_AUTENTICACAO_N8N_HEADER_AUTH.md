# 🔐 Como Configurar Autenticação no Webhook n8n (Header Auth)

## 📋 Opções de Autenticação no n8n

No n8n, o nó Webhook oferece as seguintes opções de autenticação:

- **Basic Auth** - Autenticação básica HTTP
- **Header Auth** - Autenticação via header customizado (recomendado para secret)
- **JWT Auth** - Autenticação via JWT
- **None** - Sem autenticação (não recomendado para produção)

## 🎯 Configurar Header Auth (Recomendado)

### Passo 1: Selecionar Header Auth

1. No n8n, abra seu workflow
2. Clique no nó **"Webhook"**
3. Na seção **"Authentication"**, selecione **"Header Auth"**

### Passo 2: Configurar o Header

Após selecionar "Header Auth", você verá campos para configurar:

1. **Header Name**: Nome do header (ex: `X-Webhook-Secret` ou `X-n8n-Webhook-Secret`)
2. **Header Value**: Valor do secret (ex: `abc123xyz789`)

**Exemplo de configuração:**
- **Header Name**: `X-Webhook-Secret`
- **Header Value**: `abc123xyz789`

### Passo 3: Configurar no Controlia

1. Acesse **Configurações > Integrações** no Controlia
2. Na seção **"n8n"**, configure:
   - **Webhook Secret do n8n**: Cole o mesmo valor do Header Value (ex: `abc123xyz789`)
3. Clique em **"Salvar Configurações"**

### Passo 4: Atualizar Código do Controlia (se necessário)

O Controlia precisa enviar o secret como header HTTP. Verifique se o código está enviando o header corretamente.

## 🔄 Como Funciona

Quando o Controlia envia uma mensagem para o n8n:

1. Controlia busca o secret das settings (`n8n_webhook_secret`)
2. Controlia adiciona o header `X-Webhook-Secret: abc123xyz789` na requisição
3. n8n valida o header e processa a mensagem

## ⚙️ Alternativa: Usar Query Parameter

Se preferir usar query parameter em vez de header:

1. No n8n, selecione **"None"** em Authentication
2. No Controlia, adicione o secret como query parameter na URL do webhook:
   ```
   https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=abc123xyz789
   ```

O Controlia já faz isso automaticamente se o secret estiver configurado nas settings.

## 🧪 Testar

1. Configure Header Auth no n8n com um secret
2. Configure o mesmo secret no Controlia
3. Envie uma mensagem no Telegram
4. Verifique os logs da Vercel - deve aparecer o header sendo enviado

## ❓ FAQ

### P: Posso usar "None" sem autenticação?
**R:** Sim, mas não é recomendado para produção, pois deixa o webhook público.

### P: Qual é melhor: Header Auth ou Query Parameter?
**R:** Header Auth é mais seguro, pois o secret não aparece na URL. Query Parameter é mais simples e já está implementado no Controlia.

### P: O secret precisa ser o mesmo no n8n e Controlia?
**R:** Sim! O valor do Header Value no n8n deve ser **exatamente igual** ao secret configurado no Controlia.

