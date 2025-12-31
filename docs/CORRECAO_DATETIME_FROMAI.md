# Correção: Erro "Invalid type: dateTime" no $fromAI

## 🐛 Problema

No nó **"AI Agent - Respostas"**, aparece o erro:

```
Failed to parse $fromAI arguments: 'data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'dateTime': Error: Invalid type: dateTime.
```

## 🔍 Causa

O `$fromAI` no n8n aceita apenas tipos básicos válidos:
- ✅ `'string'`
- ✅ `'number'`
- ✅ `'boolean'`

**NÃO aceita**:
- ❌ `'dateTime'`
- ❌ `'date'`
- ❌ `'object'`
- ❌ Outros tipos complexos

Mesmo que a coluna na DataTable seja do tipo `dateTime`, o `$fromAI` deve usar `'string'` como tipo. O n8n fará a conversão automática baseado no schema da coluna.

## ✅ Solução

### Passo 1: Abrir o Nó "Data table Update"

1. No seu workflow do n8n
2. Encontre o nó **"Data table Update"**
3. Clique para editá-lo

### Passo 2: Corrigir o Campo data_agendamento

1. Vá na seção **Columns**
2. No campo **value**, encontre o campo `data_agendamento`
3. Localize a expressão que contém `$fromAI`

**Antes (INCORRETO):**
```javascript
"data_agendamento": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'dateTime') }}"
```

**Depois (CORRETO):**
```javascript
"data_agendamento": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'string') }}"
```

**Mudança**: Altere o último parâmetro de `'dateTime'` para `'string'`

### Passo 3: Salvar e Testar

1. Clique em **Save** ou pressione `Ctrl+S` / `Cmd+S`
2. Execute um teste do workflow
3. O erro não deve mais aparecer

## 📝 Explicação Técnica

### Por que usar 'string'?

1. **O `$fromAI` apenas extrai valores**: Ele pega valores da resposta da IA como texto
2. **Conversão automática**: O n8n converte automaticamente strings ISO 8601 para `dateTime` baseado no schema da coluna
3. **Validação no schema**: A DataTable valida que a string seja um formato de data válido quando armazena

### Formato Esperado

A IA deve retornar a data no formato ISO 8601:
- ✅ `"2026-01-15T10:00:00Z"`
- ✅ `"2026-01-15T10:00:00.000Z"`
- ✅ `"2026-01-15T10:00:00+00:00"`

### Exemplo Completo Correto

```javascript
{
  "columns": {
    "value": {
      "agendamento_id": "={{ $fromAI('agendamento_id', `Atualiza o campo \"agendamento_id\" com o id obtido da criação do evento.`, 'string') }}",
      "data_agendamento": "={{ $fromAI('data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'string') }}"
    }
  }
}
```

## ✅ Checklist

- [ ] Nó "Data table Update" aberto
- [ ] Campo `data_agendamento` localizado
- [ ] Tipo alterado de `'dateTime'` para `'string'`
- [ ] Workflow salvo
- [ ] Teste executado com sucesso
- [ ] Erro não aparece mais

## 🔗 Referências

- [n8n $fromAI Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.data-table-tool/)
- Veja também: `docs/TROUBLESHOOTING_N8N.md` para outros problemas comuns

