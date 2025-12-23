# Guia de Integração com n8n

Este documento explica como integrar seus workflows do n8n com a plataforma Controlia CRM.

## Visão Geral

A integração com n8n permite que você:
- Automatize processos baseados em eventos do CRM
- Crie workflows personalizados
- Conecte o CRM com outros serviços
- Implemente lógica de negócio complexa

## Arquitetura da Integração

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Controlia  │ ──────> │  Webhook    │ ──────> │     n8n      │
│     CRM     │  Evento │   Endpoint  │  HTTP   │  Workflow    │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         │ Resposta
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Controlia  │
                                                  │     CRM     │
                                                  └─────────────┘
```

## Configuração Inicial

### 1. Criar um Workflow no n8n

1. Acesse seu n8n
2. Crie um novo workflow
3. Adicione um nó **Webhook** como trigger
4. Configure o método HTTP como **POST**
5. Copie a URL do webhook gerada

### 2. Registrar a Automação no Controlia

1. Acesse **Configurações > n8n** no Controlia
2. Clique em **Nova Automação**
3. Preencha os campos:
   - **Nome**: Nome descritivo da automação
   - **Webhook URL**: URL do webhook do n8n (copiada no passo anterior)
   - **Evento Trigger**: Escolha o evento que disparará o workflow
   - **Ativo**: Marque para ativar a automação

### 3. Configurar o Workflow no n8n

No n8n, configure o workflow para receber e processar os dados do Controlia.

## Eventos Disponíveis

O Controlia envia eventos para o n8n quando determinadas ações ocorrem:

### Eventos de Contato

- **`contact_created`** - Quando um novo contato é criado
- **`contact_updated`** - Quando um contato é atualizado
- **`contact_status_changed`** - Quando o status de um contato muda

### Eventos de Conversa

- **`conversation_created`** - Quando uma nova conversa é iniciada
- **`conversation_closed`** - Quando uma conversa é fechada
- **`conversation_assigned`** - Quando uma conversa é atribuída a um atendente

### Eventos de Mensagem

- **`message_received`** - Quando uma nova mensagem é recebida
- **`message_sent`** - Quando uma mensagem é enviada
- **`ai_message_generated`** - Quando a IA gera uma resposta

### Eventos de Automação

- **`automation_triggered`** - Quando uma automação é disparada
- **`automation_completed`** - Quando uma automação é concluída

## Formato dos Dados Enviados

### Estrutura Base

Todos os eventos seguem esta estrutura:

```json
{
  "event": "nome_do_evento",
  "timestamp": "2024-01-15T10:30:00Z",
  "company_id": "uuid-da-empresa",
  "data": {
    // Dados específicos do evento
  }
}
```

### Exemplo: Evento de Contato Criado

```json
{
  "event": "contact_created",
  "timestamp": "2024-01-15T10:30:00Z",
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "contact": {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "+5511999999999",
      "whatsapp": "+5511999999999",
      "status": "lead",
      "source": "website",
      "score": 0,
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Exemplo: Evento de Mensagem Recebida

```json
{
  "event": "message_received",
  "timestamp": "2024-01-15T10:35:00Z",
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "message": {
      "id": "msg-123",
      "conversation_id": "conv-456",
      "contact_id": "789e0123-e45f-67g8-h901-234567890123",
      "content": "Olá, preciso de ajuda",
      "direction": "inbound",
      "channel": "whatsapp",
      "sender_type": "human",
      "created_at": "2024-01-15T10:35:00Z"
    },
    "contact": {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "name": "João Silva",
      "phone": "+5511999999999"
    },
    "conversation": {
      "id": "conv-456",
      "status": "open",
      "channel": "whatsapp"
    }
  }
}
```

## Criando Workflows no n8n

### Exemplo 1: Enviar Email ao Criar Contato

1. **Trigger**: Webhook recebendo evento `contact_created`
2. **Filtro**: Verificar se o contato tem email
3. **Ação**: Enviar email de boas-vindas usando nó **Email Send**

**Configuração do Webhook**:
- Método: POST
- Path: `/webhook/contact-created`
- Response: JSON

**Configuração do Filtro**:
```javascript
// Código do nó Code
const contact = $input.item.json.data.contact;
return contact.email ? { json: contact } : null;
```

**Configuração do Email**:
- To: `{{ $json.email }}`
- Subject: "Bem-vindo ao Controlia!"
- Body: Template HTML personalizado

### Exemplo 2: Atualizar Status no CRM Externo

1. **Trigger**: Webhook recebendo evento `contact_status_changed`
2. **HTTP Request**: Fazer requisição para API externa

**Configuração do HTTP Request**:
- Method: PUT
- URL: `https://api.externo.com/contacts/{{ $json.data.contact.id }}`
- Headers: `{ "Authorization": "Bearer TOKEN" }`
- Body:
```json
{
  "status": "{{ $json.data.contact.status }}",
  "updated_at": "{{ $json.timestamp }}"
}
```

### Exemplo 3: Enviar Notificação no Slack

1. **Trigger**: Webhook recebendo evento `conversation_created`
2. **Slack**: Enviar mensagem no canal

**Configuração do Slack**:
- Channel: `#atendimento`
- Text: `Nova conversa iniciada por {{ $json.data.contact.name }}`

### Exemplo 4: Criar Tarefa no Trello

1. **Trigger**: Webhook recebendo evento `message_received`
2. **Filtro**: Apenas mensagens com palavras-chave específicas
3. **Trello**: Criar card

**Configuração do Filtro**:
```javascript
const content = $input.item.json.data.message.content.toLowerCase();
const keywords = ['urgente', 'problema', 'erro'];
return keywords.some(keyword => content.includes(keyword)) 
  ? { json: $input.item.json } 
  : null;
```

## Respondendo ao Controlia

Você pode fazer requisições de volta ao Controlia para atualizar dados ou executar ações.

### Endpoint de API

Base URL: `https://seu-dominio.com/api`

### Autenticação

Use o token de API da empresa (configurado nas configurações):

```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Exemplos de Requisições

#### Atualizar Status de Contato

```http
PUT /api/contacts/{contact_id}
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "status": "client"
}
```

#### Criar Mensagem

```http
POST /api/messages
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "conversation_id": "conv-123",
  "contact_id": "contact-456",
  "content": "Resposta automática do workflow",
  "direction": "outbound",
  "sender_type": "system"
}
```

#### Atualizar Conversa

```http
PUT /api/conversations/{conversation_id}
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "status": "closed",
  "assigned_to": "user-id"
}
```

## Boas Práticas

### 1. Tratamento de Erros

Sempre implemente tratamento de erros nos workflows:

```javascript
try {
  // Sua lógica aqui
  return { json: result };
} catch (error) {
  // Log do erro
  console.error('Erro no workflow:', error);
  // Retornar erro estruturado
  return { json: { error: error.message } };
}
```

### 2. Validação de Dados

Valide os dados recebidos antes de processar:

```javascript
const data = $input.item.json.data;
if (!data || !data.contact) {
  return null; // Ignorar se dados inválidos
}
// Continuar processamento
```

### 3. Rate Limiting

Implemente delays entre requisições para evitar sobrecarga:

- Use o nó **Wait** do n8n
- Configure delays apropriados (ex: 1-2 segundos)

### 4. Logging

Mantenha logs das execuções:

- Use o nó **Set** para adicionar timestamps
- Salve logs em banco de dados ou arquivo
- Monitore falhas e sucessos

### 5. Testes

Teste seus workflows antes de ativá-los:

1. Use o modo **Test** do n8n
2. Envie dados de exemplo
3. Verifique cada etapa do workflow
4. Valide os resultados

## Troubleshooting

### Webhook não está recebendo eventos

1. Verifique se a automação está **ativa** no Controlia
2. Confirme que a URL do webhook está correta
3. Verifique os logs do n8n para erros
4. Teste o webhook manualmente enviando um POST

### Erro de autenticação

1. Verifique se o token de API está correto
2. Confirme que o header `Authorization` está sendo enviado
3. Verifique se o token não expirou

### Dados não estão no formato esperado

1. Verifique a estrutura do JSON recebido
2. Use o nó **JSON** do n8n para validar
3. Consulte a documentação do evento específico

### Workflow muito lento

1. Otimize as requisições HTTP
2. Use processamento paralelo quando possível
3. Implemente cache quando apropriado
4. Considere usar filas para processamento assíncrono

## Recursos Adicionais

### Documentação do n8n

- [Documentação Oficial](https://docs.n8n.io/)
- [Exemplos de Workflows](https://n8n.io/workflows/)
- [Comunidade](https://community.n8n.io/)

### Suporte

Para dúvidas sobre integração:
- Consulte os logs do sistema
- Verifique a documentação da API
- Entre em contato com o suporte técnico

## Exemplo Completo: Workflow de Onboarding

Este exemplo mostra um workflow completo que:
1. Recebe evento de contato criado
2. Envia email de boas-vindas
3. Cria tarefa no sistema de tarefas
4. Adiciona contato a uma lista de marketing

### Estrutura do Workflow

```
Webhook (contact_created)
  ├─> Filtro (tem email?)
  │   ├─> Email Send (boas-vindas)
  │   └─> HTTP Request (adicionar à lista)
  └─> HTTP Request (criar tarefa)
```

### Configuração Passo a Passo

1. **Webhook Node**
   - Path: `/webhook/onboarding`
   - Method: POST

2. **IF Node** (Filtro)
   - Condition: `{{ $json.data.contact.email }}` exists

3. **Email Send Node**
   - To: `{{ $json.data.contact.email }}`
   - Subject: "Bem-vindo!"
   - Body: Template HTML

4. **HTTP Request Node** (Lista)
   - Method: POST
   - URL: API da lista de marketing
   - Body: Dados do contato

5. **HTTP Request Node** (Tarefa)
   - Method: POST
   - URL: API de tarefas
   - Body: Criar tarefa de follow-up

## Conclusão

A integração com n8n oferece flexibilidade total para automatizar processos e conectar o Controlia com outros sistemas. Use este guia como ponto de partida e adapte os exemplos às suas necessidades específicas.

Para mais informações ou suporte, consulte a documentação completa ou entre em contato com a equipe de suporte.

