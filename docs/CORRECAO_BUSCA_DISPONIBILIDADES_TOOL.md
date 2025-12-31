# Correção: Erro "Node hasn't been executed" no Tool "Busca Disponibilidades"

## 🐛 Problema

Ao executar o nó "Busca Disponibilidades" como Tool do AI Agent, aparece o erro:

```
ExpressionError: Node 'Get row(s)1' hasn't been executed
There is no connection back to the node 'Get row(s)1', but it's used in an expression here.
```

E também:
```
No parameters are set up to be filled by AI. Click on the ✨ button next to a parameter to allow AI to set its value.
```

## 🔍 Causa

**Tools do AI Agent** são chamadas dinamicamente pela IA e não têm acesso a nós anteriores do workflow que não foram executados. 

Quando uma Tool é chamada pelo AI Agent:
- Ela é executada independentemente do fluxo normal do workflow
- Não há garantia de que outros nós (como "Get row(s)1") já foram executados
- Expressões que referenciam nós anteriores falham

## ✅ Solução

Para Tools do AI Agent, use uma das seguintes abordagens:

### Solução 1: Usar `$fromAI` para receber parâmetros da IA (Recomendado)

Configure os parâmetros para serem preenchidos pela IA usando `$fromAI`:

```json
{
  "queryParameters": {
    "parameters": [
      {
        "name": "start",
        "value": "={{ $fromAI('start_date', 'Data de início para busca (formato ISO 8601). Se não fornecida, usa data/hora atual de São Paulo.', 'string') || $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
      },
      {
        "name": "end",
        "value": "={{ ($fromAI('start_date', '', 'string') || $now.setZone('America/Sao_Paulo').toUTC()).plus({ hours: 360 }).toISO() }}"
      },
      {
        "name": "status",
        "value": "scheduled"
      },
      {
        "name": "company_id",
        "value": "={{ $('Webhook').first().json.body.controlia.company_id }}"
      }
    ]
  }
}
```

### Solução 2: Simplificar usando apenas data/hora atual (Mais Simples)

Se você não precisa da data específica da DataTable, use apenas a data/hora atual:

```json
{
  "queryParameters": {
    "parameters": [
      {
        "name": "start",
        "value": "={{ $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
      },
      {
        "name": "end",
        "value": "={{ $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
      },
      {
        "name": "status",
        "value": "scheduled"
      },
      {
        "name": "company_id",
        "value": "={{ $('Webhook').first().json.body.controlia.company_id }}"
      }
    ]
  }
}
```

### Solução 3: Usar apenas o Webhook (Híbrida)

Acesse apenas dados do Webhook que sempre estarão disponíveis:

```json
{
  "queryParameters": {
    "parameters": [
      {
        "name": "start",
        "value": "={{ $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
      },
      {
        "name": "end",
        "value": "={{ $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
      },
      {
        "name": "status",
        "value": "scheduled"
      },
      {
        "name": "company_id",
        "value": "={{ $('Webhook').first().json.body.controlia.company_id }}"
      }
    ]
  }
}
```

## 📝 Implementação Recomendada

**Use a Solução 2 ou 3** e atualize a Tool Description para orientar a IA:

```
Verifica a disponibilidade da agenda em um período específico. 
Retorna todos os eventos agendados no intervalo de datas informado.
Use esta ferramenta ANTES de criar ou atualizar qualquer evento para garantir que não haja conflitos de horário.

IMPORTANTE: 
- A ferramenta busca eventos nos próximos 15 dias (360 horas) a partir da data/hora atual de São Paulo.
- Se o usuário mencionar uma data específica para agendamento, você pode informar os horários disponíveis com base nos resultados retornados.
- Sempre use esta ferramenta antes de criar um novo evento.
```

## 🔧 Passos para Corrigir

1. **Abra o nó "Busca Disponibilidades"** no workflow
2. **Vá em Query Parameters**
3. **Altere os parâmetros `start` e `end`**:

**Substitua:**
```javascript
"start": "={{ ($('Get row(s)1').first().json.data_agendamento || $('AtualizaVariaveisExtrator').first().json.data_agendamento) ? DateTime.fromISO($('Get row(s)1').first().json.data_agendamento || $('AtualizaVariaveisExtrator').first().json.data_agendamento).toUTC().toISO() : $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
```

**Por:**
```javascript
"start": "={{ $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
```

**E substitua:**
```javascript
"end": "={{ ($('Get row(s)1').first().json.data_agendamento || $('AtualizaVariaveisExtrator').first().json.data_agendamento) ? DateTime.fromISO($('Get row(s)1').first().json.data_agendamento || $('AtualizaVariaveisExtrator').first().json.data_agendamento).plus({ hours: 360 }).toUTC().toISO() : $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
```

**Por:**
```javascript
"end": "={{ $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
```

4. **Salve o workflow**
5. **Teste novamente**

## 💡 Por Que Funciona

- `$now` sempre está disponível, não depende de outros nós
- O Webhook sempre foi executado antes (é o primeiro nó)
- A IA pode usar os resultados para verificar disponibilidade e sugerir horários baseado na data mencionada pelo usuário
- Não há dependência de nós que podem não estar executados

## 📋 Configuração Completa Corrigida

```json
{
  "parameters": {
    "toolDescription": "Verifica a disponibilidade da agenda nos próximos 15 dias (360 horas) a partir da data/hora atual de São Paulo. Retorna todos os eventos agendados no período. Use ANTES de criar ou atualizar qualquer evento.",
    "url": "https://controliaa.vercel.app/api/calendar/events",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "start",
          "value": "={{ $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
        },
        {
          "name": "end",
          "value": "={{ $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
        },
        {
          "name": "status",
          "value": "scheduled"
        },
        {
          "name": "company_id",
          "value": "={{ $('Webhook').first().json.body.controlia.company_id }}"
        }
      ]
    },
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "Authorization",
          "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoY3N5cHVkcHd3Zmxjb3J5Zm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjIzMTMsImV4cCI6MjA4MTk5ODMxM30.rguJ34eShUCSKKBWuy8bBS7bSxuC5mCeRnXych0LGKM"
        },
        {
          "name": "x-company-id",
          "value": "={{ $('Webhook').first().json.body.controlia.company_id }}"
        }
      ]
    }
  }
}
```

## ✅ Checklist

- [ ] Nó "Busca Disponibilidades" aberto
- [ ] Parâmetro `start` simplificado para usar apenas `$now`
- [ ] Parâmetro `end` simplificado para usar apenas `$now`
- [ ] Tool Description atualizada
- [ ] Workflow salvo
- [ ] Teste executado com sucesso
- [ ] Erro não aparece mais

