# Integração de Agendamento/Calendário com n8n

Este documento descreve como configurar e usar as ferramentas de agendamento no n8n para permitir que o agente de IA gerencie eventos do calendário em tempo real.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura da API](#estrutura-da-api)
3. [Configuração das Tools HTTP Request](#configuração-das-tools-http-request)
4. [Configuração da Tool DataTable](#configuração-da-tool-datatable)
5. [Prompts para o Agente](#prompts-para-o-agente)
6. [Fluxo de Trabalho Recomendado](#fluxo-de-trabalho-recomendado)
7. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O sistema permite que o agente de IA:
- **Verificar disponibilidade** da agenda antes de criar/atualizar eventos
- **Criar eventos** de agendamento
- **Atualizar eventos** existentes
- **Excluir eventos** quando solicitado
- **Armazenar o ID do agendamento** na DataTable para referência futura

**IMPORTANTE**: O agente **SEMPRE** deve verificar a disponibilidade antes de criar ou atualizar um evento.

---

## 🔌 Estrutura da API

### Base URL
```
https://controliaa.vercel.app/api/calendar/events
```

### Autenticação
Todas as requisições requerem autenticação via header:
```
Authorization: Bearer {SUPABASE_ANON_KEY}
```

Ou via header customizado (se configurado):
```
x-api-key: {SUPABASE_ANON_KEY}
```

### Obtendo o company_id no n8n

O `company_id` geralmente está disponível no contexto da conversa. Exemplos de como acessá-lo:

1. **Do nó que recebe dados do Controlia**:
   ```
   {{ $('AtualizaVariaveisExtrator').first().json.company_id }}
   ```

2. **Do webhook do Controlia**:
   ```
   {{ $json.company_id }}
   ```

3. **De uma variável de ambiente ou configuração**:
   ```
   {{ $env.COMPANY_ID }}
   ```

**IMPORTANTE**: O `company_id` é obrigatório para todas as requisições do n8n. Sem ele, a API retornará erro "Empresa não encontrada".

### Formatação de Datas

**CRÍTICO**: Todas as datas devem estar no formato ISO 8601 (ex: `2025-01-15T10:00:00Z`).

**Exemplos de formatação no n8n**:

1. **Converter data para ISO 8601**:
   ```
   {{ DateTime.fromISO($json.data_agendamento).toUTC().toISO() }}
   ```

2. **Adicionar horas a uma data**:
   ```
   {{ DateTime.fromISO($json.data_agendamento).plus({ hours: 1 }).toUTC().toISO() }}
   ```

3. **Criar data de início e fim do dia**:
   ```
   Início: {{ DateTime.fromISO($json.data_agendamento).startOf('day').toUTC().toISO() }}
   Fim: {{ DateTime.fromISO($json.data_agendamento).endOf('day').toUTC().toISO() }}
   ```

**ERRO COMUM**: Não use strings de data formatadas como `"Tue Dec 30 2025 05:00:00 GMT+0000"`. Sempre converta para ISO 8601 antes de enviar.

### Estrutura de Evento

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "title": "Consulta com João Silva",
  "description": "Consulta inicial",
  "start_at": "2025-01-15T10:00:00Z",
  "end_at": "2025-01-15T11:00:00Z",
  "is_all_day": false,
  "location": "Clínica - Sala 1",
  "contact_id": "uuid",
  "organizer_id": "uuid",
  "visibility": "company",
  "status": "scheduled",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

---

## 🛠️ Configuração das Tools HTTP Request

### 1. Tool: Busca Disponibilidades

**Nome no n8n**: `Busca Disponibilidades`

**Método**: `GET`

**⚠️ IMPORTANTE - Configuração de Query Parameters no n8n:**

**NÃO coloque expressões diretamente na URL!** Use "Send Query Parameters" ao invés disso para garantir que as expressões sejam resolvidas corretamente.

**Configuração Correta:**

1. **URL Base** (sem query parameters):
   ```
   https://controliaa.vercel.app/api/calendar/events
   ```

2. **Ative "Send Query Parameters"** (toggle ON no n8n)

3. **Adicione os parâmetros separadamente** na seção "Query Parameters":

   | Name | Value |
   |------|-------|
   | `start` | `{{ DateTime.fromISO($('AtualizaVariaveisExtrator').first().json.data_agendamento).toUTC().toISO() }}` |
   | `end` | `{{ DateTime.fromISO($('AtualizaVariaveisExtrator').first().json.data_agendamento).plus({ hours: 360 }).toUTC().toISO() }}` |
   | `status` | `scheduled` |
   | `company_id` | `{{ $('AtualizaVariaveisExtrator').first().json.company_id }}` |

**Por que usar Query Parameters ao invés da URL?**

Quando você coloca expressões complexas diretamente na URL do n8n (especialmente expressões com `DateTime.plus()`), elas podem não ser resolvidas corretamente no momento da execução, resultando em parâmetros vazios. Usando "Send Query Parameters", o n8n resolve cada expressão separadamente antes de montar a URL, garantindo que todos os valores sejam preenchidos corretamente.

**Exemplo de URL final gerada**:
```
https://controliaa.vercel.app/api/calendar/events?start=2025-01-15T00:00:00Z&end=2025-01-15T23:59:59Z&status=scheduled&company_id=uuid-da-empresa
```

**Parâmetros de Query**:
- `start` (obrigatório se `end` for fornecido): Data/hora de início no formato ISO 8601 (ex: `2025-01-15T00:00:00Z`)
- `end` (obrigatório se `start` for fornecido): Data/hora de fim no formato ISO 8601 (ex: `2025-01-15T23:59:59Z`)
- `status` (opcional): Status dos eventos (padrão: `scheduled`)
- `contact_id` (opcional): Filtrar por contato específico
- `company_id` (obrigatório para requisições do n8n): ID da empresa. Pode ser enviado via query parameter ou header `x-company-id`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
  "x-company-id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}"
}
```

**IMPORTANTE**: Para requisições do n8n, você DEVE fornecer o `company_id` via query parameter ou header `x-company-id`. O `company_id` geralmente está disponível no contexto da conversa (ex: `{{ $('AtualizaVariaveisExtrator').first().json.company_id }}`).

**Resposta de Sucesso** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Consulta existente",
      "start_at": "2025-01-15T10:00:00Z",
      "end_at": "2025-01-15T11:00:00Z",
      "contact_id": "uuid",
      "status": "scheduled"
    }
  ]
}
```

**Descrição para o Agente**:
```
Verifica a disponibilidade da agenda em um período específico. 
Retorna todos os eventos agendados no intervalo de datas informado.
Use esta ferramenta ANTES de criar ou atualizar qualquer evento para garantir que não haja conflitos de horário.
```

---

### 2. Tool: Cria Evento

**Nome no n8n**: `Cria Evento`

**Método**: `POST`

**URL**: 
```
https://controliaa.vercel.app/api/calendar/events
```

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
  "x-company-id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}"
}
```

**Body** (JSON):
```json
{
  "company_id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}",
  "title": "Consulta com {{ nome_contato }}",
  "description": "{{ descricao_opcional }}",
  "start_at": "2025-01-15T10:00:00Z",
  "end_at": "2025-01-15T11:00:00Z",
  "is_all_day": false,
  "location": "{{ localizacao_opcional }}",
  "contact_id": "{{ contact_id }}",
  "visibility": "company",
  "organizer_id": "{{ organizer_id_opcional }}"
}
```

**Campos Obrigatórios**:
- `company_id`: ID da empresa (pode ser enviado via body ou header `x-company-id`)
- `title`: Título do evento
- `start_at`: Data/hora de início (ISO 8601)
- `end_at`: Data/hora de fim (ISO 8601)

**Campos Opcionais**:
- `description`: Descrição do evento
- `is_all_day`: Boolean (padrão: false)
- `location`: Local do evento
- `contact_id`: ID do contato relacionado
- `visibility`: "company" ou "private" (padrão: "company")
- `organizer_id`: ID do organizador do evento (opcional para requisições externas)

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-evento-criado",
    "title": "Consulta com João Silva",
    "start_at": "2025-01-15T10:00:00Z",
    "end_at": "2025-01-15T11:00:00Z",
    ...
  }
}
```

**Resposta de Erro** (400/500):
```json
{
  "error": "Mensagem de erro descritiva"
}
```

**Descrição para o Agente**:
```
Cria um novo evento no calendário da empresa.
IMPORTANTE: Sempre use "Busca Disponibilidades" ANTES de criar um evento para verificar se o horário está livre.
Após criar o evento com sucesso, salve o ID retornado no campo "agendamento_id" da DataTable usando a tool "Data table Update".
```

---

### 3. Tool: Atualiza Eventos

**Nome no n8n**: `Atualiza Eventos`

**Método**: `PATCH` ou `PUT`

**URL**: 
```
https://controliaa.vercel.app/api/calendar/events/{{ event_id }}
```

**Parâmetros de URL**:
- `event_id` (obrigatório): ID do evento a ser atualizado (UUID). Use o valor do campo `agendamento_id` da DataTable.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
  "x-company-id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}"
}
```

**Body** (JSON) - Apenas campos que deseja atualizar:
```json
{
  "company_id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}",
  "title": "{{ novo_titulo }}",
  "start_at": "2025-01-15T14:00:00Z",
  "end_at": "2025-01-15T15:00:00Z",
  "description": "{{ nova_descricao }}",
  "location": "{{ nova_localizacao }}",
  "status": "cancelled"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Resposta de Erro** (404):
```json
{
  "error": "Evento não encontrado"
}
```

**Descrição para o Agente**:
```
Atualiza um evento existente no calendário.
IMPORTANTE: 
1. Sempre use "Busca Disponibilidades" ANTES de atualizar para verificar se o novo horário está disponível.
2. Você precisa do ID do evento (agendamento_id) que está armazenado na DataTable.
3. Se o evento não existir mais, informe ao usuário e ofereça criar um novo.
```

---

### 4. Tool: Exclui Eventos

**Nome no n8n**: `Exclui Eventos`

**Método**: `DELETE`

**URL**: 
```
https://controliaa.vercel.app/api/calendar/events/{{ event_id }}?company_id={{ $('AtualizaVariaveisExtrator').first().json.company_id }}
```

**Parâmetros de URL**:
- `event_id` (obrigatório): ID do evento a ser deletado (UUID). Use o valor do campo `agendamento_id` da DataTable.
- `company_id` (obrigatório): ID da empresa. Pode ser enviado via query parameter ou header `x-company-id`

**Headers**:
```json
{
  "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
  "x-company-id": "{{ $('AtualizaVariaveisExtrator').first().json.company_id }}"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true
}
```

**Resposta de Erro** (404):
```json
{
  "error": "Evento não encontrado"
}
```

**Descrição para o Agente**:
```
Exclui um evento do calendário.
IMPORTANTE: 
1. Você precisa do ID do evento (agendamento_id) que está armazenado na DataTable.
2. Sempre confirme com o usuário antes de excluir um agendamento.
3. Após excluir, atualize a DataTable removendo o agendamento_id (defina como vazio ou null).
```

---

## 📊 Configuração da Tool DataTable

### Tool: Data table Update

**Nome no n8n**: `Data table Update`

**Operação**: `update`

**DataTable ID**: `IJSkPhNqYZMoQW6b` (ou o ID da sua tabela)

**Filtros**:
```json
{
  "conditions": [
    {
      "keyName": "sessionId",
      "keyValue": "={{ $('Define:Mensagem e Session_id').first().json.session_id }}"
    }
  ]
}
```

**Campos para Atualizar**:
```json
{
  "agendamento_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('agendamento_id', ``, 'string') }}",
  "data_agendamento": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('data_agendamento', ``, 'string') }}"
}
```

**Descrição para o Agente**:
```
Atualiza o campo "agendamento_id" na DataTable com o ID do evento criado ou atualizado.
Use esta ferramenta após criar ou atualizar um evento com sucesso.
O campo "agendamento_id" armazena o UUID do evento no calendário para referência futura.
```

---

## 🤖 Prompts para o Agente

### Prompt Principal (System Message)

Adicione este texto ao system message do seu agente:

```
## Sistema de Agendamento e Calendário

Você tem acesso a ferramentas para gerenciar o calendário e agendamentos da empresa. Use-as quando o paciente mencionar datas, horários, agendamentos, reagendamentos ou cancelamentos.

### Regras Obrigatórias:

1. **SEMPRE verifique disponibilidade ANTES de criar ou atualizar eventos**
   - Use "Busca Disponibilidades" com a data/hora desejada
   - Verifique se não há conflitos de horário
   - Se houver conflito, informe ao paciente e sugira horários alternativos

2. **Fluxo para Criar Agendamento**:
   a) Extraia a data e hora da mensagem do paciente
   b) Use "Busca Disponibilidades" para verificar se o horário está livre
   c) Se disponível, use "Cria Evento" para criar o agendamento
   d) Salve o ID retornado usando "Data table Update" no campo "agendamento_id"
   e) Confirme o agendamento ao paciente com data, hora e detalhes

3. **Fluxo para Reagendar**:
   a) Verifique se existe "agendamento_id" na DataTable
   b) Use "Busca Disponibilidades" para verificar se o novo horário está livre
   c) Se disponível, use "Atualiza Eventos" com o agendamento_id existente
   d) Atualize "data_agendamento" na DataTable
   e) Confirme o reagendamento ao paciente

4. **Fluxo para Cancelar**:
   a) Verifique se existe "agendamento_id" na DataTable
   b) Confirme com o paciente antes de cancelar
   c) Use "Exclui Eventos" com o agendamento_id
   d) Limpe o campo "agendamento_id" na DataTable (defina como vazio)
   e) Confirme o cancelamento ao paciente

5. **Interpretação de Datas**:
   - "amanhã" = próximo dia útil
   - "segunda que vem" = próxima segunda-feira
   - "depois do almoço" = após 13:00
   - "de manhã" = entre 08:00 e 12:00
   - "à tarde" = entre 13:00 e 18:00
   - Sempre use a data/hora atual do contexto para calcular datas relativas

6. **Formato de Datas**:
   - Use formato ISO 8601: "YYYY-MM-DDTHH:mm:ssZ"
   - Exemplo: "2025-01-15T10:00:00Z"
   - Considere o fuso horário da empresa (geralmente UTC-3 para Brasil)

7. **Tratamento de Erros**:
   - Se "Busca Disponibilidades" retornar eventos no horário, informe: "Desculpe, este horário já está ocupado. Horários disponíveis próximos: [sugerir alternativas]"
   - Se "Cria Evento" falhar, informe: "Não foi possível criar o agendamento. Por favor, tente novamente ou entre em contato conosco."
   - Se "Atualiza Eventos" retornar erro 404, o evento não existe mais - ofereça criar um novo

8. **Informações do Contexto**:
   - Use o "contact_id" do contexto da conversa ao criar eventos
   - O "company_id" é automaticamente incluído pela API
   - Sempre inclua o nome do paciente no título do evento

### Exemplos de Uso:

**Paciente**: "Quero agendar para amanhã às 10h"
**Ação**: 
1. Calcular data de amanhã
2. Buscar disponibilidades para amanhã entre 09:00 e 11:00
3. Se livre, criar evento
4. Salvar agendamento_id
5. Confirmar: "Agendamento confirmado para [data] às 10h"

**Paciente**: "Preciso mudar meu horário"
**Ação**:
1. Verificar se existe agendamento_id na DataTable
2. Perguntar qual o novo horário desejado
3. Buscar disponibilidades para o novo horário
4. Atualizar evento existente
5. Confirmar reagendamento

**Paciente**: "Quero cancelar"
**Ação**:
1. Verificar se existe agendamento_id na DataTable
2. Confirmar: "Tem certeza que deseja cancelar o agendamento de [data]?"
3. Se confirmado, excluir evento
4. Limpar agendamento_id
5. Confirmar cancelamento
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Fluxo Completo: Criar Agendamento

```
1. Paciente menciona data/hora
   ↓
2. Agente extrai data/hora da mensagem
   ↓
3. Agente usa "Busca Disponibilidades"
   ↓
4. Verifica se horário está livre
   ↓
5a. Se LIVRE:
    → Usa "Cria Evento"
    → Salva agendamento_id com "Data table Update"
    → Confirma ao paciente
    
5b. Se OCUPADO:
    → Informa conflito
    → Sugere horários alternativos
    → Pergunta se deseja algum dos horários sugeridos
```

### Fluxo: Reagendar

```
1. Paciente pede para mudar horário
   ↓
2. Agente verifica agendamento_id na DataTable
   ↓
3a. Se EXISTE:
    → Pergunta novo horário
    → Usa "Busca Disponibilidades" para novo horário
    → Se livre, usa "Atualiza Eventos"
    → Atualiza data_agendamento na DataTable
    → Confirma reagendamento
    
3b. Se NÃO EXISTE:
    → Informa que não há agendamento
    → Oferece criar novo
```

### Fluxo: Cancelar

```
1. Paciente pede para cancelar
   ↓
2. Agente verifica agendamento_id na DataTable
   ↓
3a. Se EXISTE:
    → Confirma cancelamento com paciente
    → Se confirmado, usa "Exclui Eventos"
    → Limpa agendamento_id na DataTable
    → Confirma cancelamento
    
3b. Se NÃO EXISTE:
    → Informa que não há agendamento para cancelar
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Criar Agendamento

**Mensagem do Paciente**: "Quero agendar uma consulta para amanhã às 14h"

**Ações do Agente**:
1. Calcula data de amanhã: `2025-01-16`
2. Chama "Busca Disponibilidades":
   ```
   GET /api/calendar/events?start=2025-01-16T00:00:00Z&end=2025-01-16T23:59:59Z
   ```
3. Verifica resposta: `{ "data": [] }` (livre)
4. Chama "Cria Evento":
   ```json
   {
     "title": "Consulta com Jailton Silva",
     "start_at": "2025-01-16T14:00:00Z",
     "end_at": "2025-01-16T15:00:00Z",
     "contact_id": "59f8a089-2b3a-42ff-8786-eecf24465f18"
   }
   ```
5. Recebe resposta: `{ "success": true, "data": { "id": "abc-123-def" } }`
6. Chama "Data table Update":
   ```json
   {
     "agendamento_id": "abc-123-def",
     "data_agendamento": "2025-01-16T14:00:00Z"
   }
   ```
7. Responde ao paciente: "Perfeito! Seu agendamento está confirmado para amanhã (16/01) às 14h. Te espero!"

---

### Exemplo 2: Horário Ocupado

**Mensagem do Paciente**: "Quero agendar para segunda às 10h"

**Ações do Agente**:
1. Calcula próxima segunda: `2025-01-20`
2. Chama "Busca Disponibilidades":
   ```
   GET /api/calendar/events?start=2025-01-20T09:00:00Z&end=2025-01-20T11:00:00Z
   ```
3. Verifica resposta: 
   ```json
   {
     "data": [
       {
         "id": "xyz-789",
         "start_at": "2025-01-20T10:00:00Z",
         "end_at": "2025-01-20T11:00:00Z"
       }
     ]
   }
   ```
4. Responde: "Desculpe, segunda-feira às 10h já está ocupada. Tenho disponibilidade às 9h, 11h ou 14h. Qual prefere?"

---

### Exemplo 3: Reagendar

**Mensagem do Paciente**: "Preciso mudar meu horário para depois do almoço"

**Ações do Agente**:
1. Verifica DataTable: `agendamento_id = "abc-123-def"`
2. Pergunta: "Qual horário você prefere? Tenho disponibilidade às 13h, 14h ou 15h."
3. Paciente responde: "14h"
4. Chama "Busca Disponibilidades" para 14h
5. Se livre, chama "Atualiza Eventos":
   ```
   PATCH /api/calendar/events/abc-123-def
   ```
   Body:
   ```json
   {
     "start_at": "2025-01-16T14:00:00Z",
     "end_at": "2025-01-16T15:00:00Z"
   }
   ```
6. Atualiza DataTable: `data_agendamento = "2025-01-16T14:00:00Z"`
7. Confirma: "Perfeito! Seu agendamento foi reagendado para às 14h."

---

## ⚠️ Observações Importantes

1. **Autenticação**: Certifique-se de que o `SUPABASE_ANON_KEY` está configurado corretamente nas variáveis de ambiente do n8n.

2. **Fuso Horário**: A API trabalha com UTC. Converta as datas locais para UTC antes de enviar.

3. **Validação**: A API valida que `end_at` seja posterior a `start_at`. Certifique-se de que a duração do evento seja positiva.

4. **Status**: Eventos criados têm status `scheduled` por padrão. Para cancelar, você pode:
   - Excluir o evento (recomendado)
   - Ou atualizar o status para `cancelled`

5. **RLS (Row Level Security)**: A API automaticamente filtra eventos pela `company_id` do contexto. Não é necessário enviar `company_id` nas requisições.

6. **Tratamento de Erros**: Sempre trate erros HTTP e informe ao paciente de forma clara e amigável.

---

## 🔗 Referências

- API Base: `https://controliaa.vercel.app/api`
- Documentação Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Formato ISO 8601: [https://en.wikipedia.org/wiki/ISO_8601](https://en.wikipedia.org/wiki/ISO_8601)

---

**Última atualização**: 29/12/2025

