# Troubleshooting - Problemas Comuns no n8n

Este documento lista problemas comuns encontrados ao integrar o Controlia com n8n e suas soluções.

## 📋 Índice

1. [Information Extractor retornando JSON com markdown](#information-extractor-retornando-json-com-markdown)
2. [Campo dateTime recebendo string vazia](#campo-datetime-recebendo-string-vazia)
3. [Erro "Invalid type: dateTime" no $fromAI](#erro-invalid-type-datetime-no-fromai)
4. [Erro "Node hasn't been executed" em Tools do AI Agent](#erro-node-hasnt-been-executed-em-tools-do-ai-agent)
5. [Tool "Busca Disponibilidades" retornando parâmetros null](#tool-busca-disponibilidades-retornando-parâmetros-null)
6. [Erro "Ambos os parâmetros start e end devem ser fornecidos juntos"](#erro-ambos-os-parâmetros-start-e-end-devem-ser-fornecidos-juntos)
7. [Empresa não encontrada mesmo existindo no banco](#empresa-não-encontrada-mesmo-existindo-no-banco)

---

## Erro "Invalid type: dateTime" no $fromAI

### Problema

No nó "Data table Update", aparece o erro:

```
Failed to parse $fromAI arguments: 'data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'dateTime': Error: Invalid type: dateTime.
```

### Causa

O `$fromAI` no n8n aceita apenas tipos básicos: `'string'`, `'number'`, `'boolean'`, etc. Não aceita tipos complexos como `'dateTime'`, mesmo que a coluna na DataTable seja do tipo `dateTime`.

### Solução

Altere o tipo no `$fromAI` de `'dateTime'` para `'string'`. O n8n fará a conversão automaticamente baseado no schema da coluna.

**Antes (INCORRETO):**
```javascript
"data_agendamento": "={{ $fromAI('data_agendamento', `Insere a Data de Agendamento...`, 'dateTime') }}"
```

**Depois (CORRETO):**
```javascript
"data_agendamento": "={{ $fromAI('data_agendamento', `Insere a Data de Agendamento criada no formato ISO 8601 (ex: 2026-01-15T10:00:00Z). Deve ser uma data futura.`, 'string') }}"
```

### Onde Corrigir

No nó **"Data table Update"**, no campo **Columns → value → data_agendamento**, altere:

1. Abra o nó "Data table Update"
2. Vá em **Columns**
3. No campo **value**, encontre `data_agendamento`
4. Altere o último parâmetro de `'dateTime'` para `'string'`

### Por que Funciona

- O n8n aceita strings em campos `dateTime` da DataTable
- O n8n converte automaticamente strings ISO 8601 para o tipo `dateTime` da coluna
- O `$fromAI` apenas extrai valores da resposta da IA, não faz validação de tipo
- A validação e conversão são feitas pelo n8n baseado no schema da coluna

### Validação

Após a correção:
1. Salve o workflow
2. Execute um teste
3. O erro não deve mais aparecer
4. O campo `data_agendamento` será preenchido corretamente com a data em formato ISO 8601

---

## Information Extractor retornando JSON com markdown

### Problema

O nó Information Extractor está retornando JSON dentro de blocos markdown:
```json
```json
{
  "nome_completo": "João Silva",
  "data_agendamento": "2026-01-05T10:00:00"
}
```
```

E o erro aparece:
```
Failed to parse. Text: "```json { ... } ```". Error: SyntaxError: Unexpected token '`'
```

### Causa

O modelo LLM está retornando JSON formatado com markdown code blocks, mas o parser do Information Extractor espera JSON puro.

### Solução

Adicione a seguinte instrução no campo **System Prompt Template** do Information Extractor:

```
IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem code blocks, sem explicações. Apenas o objeto JSON válido.
Não use ```json ou ```. Retorne diretamente o JSON.
```

**Exemplo de System Prompt Template corrigido:**

```
={{ $json.prompt_text }}

### INSTRUÇÃO CRÍTICA DE OUTPUT:
Retorne APENAS o objeto JSON válido, sem markdown, sem code blocks (```), sem explicações adicionais.
Apenas o objeto JSON puro, diretamente, sem formatação markdown.
```

---

## Campo dateTime recebendo string vazia

### Problema

O campo `data_agendamento` do tipo `dateTime` está recebendo uma string vazia (`""`), causando erros em nós subsequentes.

### Causa

O tipo `dateTime` no n8n não aceita strings vazias. Ele aceita apenas:
- `null` (quando não há valor)
- Uma string válida no formato ISO 8601

### Solução

Use `null` ao invés de string vazia quando não houver valor:

**Antes (INCORRETO):**
```javascript
data_agendamento: $json.data_agendamento || ''
```

**Depois (CORRETO):**
```javascript
data_agendamento: $json.data_agendamento || null
```

Ou use uma expressão condicional:
```javascript
data_agendamento: $json.data_agendamento ? $json.data_agendamento : null
```

---

## Erro "Node hasn't been executed" em Tools do AI Agent

### Problema

Ao executar uma Tool do AI Agent (como "Busca Disponibilidades"), aparece o erro:

```
ExpressionError: Node 'Get row(s)1' hasn't been executed
There is no connection back to the node 'Get row(s)1', but it's used in an expression here.
```

### Causa

Tools do AI Agent são chamadas dinamicamente pela IA e não têm acesso a nós anteriores do workflow que podem não ter sido executados. Quando você referencia nós como `$('Get row(s)1')` ou `$('AtualizaVariaveisExtrator')` em uma Tool, esses nós podem não estar disponíveis.

### Solução

Para Tools do AI Agent, **não use referências a nós anteriores do workflow**. Use apenas:

1. **`$now`** - sempre disponível
2. **`$('Webhook')`** - sempre disponível (primeiro nó)
3. **`$fromAI(...)`** - valores fornecidos pela IA
4. **Valores estáticos**

**Exemplo - Correção para "Busca Disponibilidades":**

**Antes (INCORRETO):**
```javascript
"start": "={{ ($('Get row(s)1').first().json.data_agendamento || ...) ? ... : $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
```

**Depois (CORRETO):**
```javascript
"start": "={{ $now.setZone('America/Sao_Paulo').toUTC().toISO() }}"
"end": "={{ $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}"
```

A IA pode usar os resultados da busca para verificar disponibilidade baseado na data mencionada pelo usuário, mesmo que a busca comece da data atual.

---

## Tool "Busca Disponibilidades" retornando parâmetros null

### Problema

A tool "Busca Disponibilidades" está sendo chamada com `null` para os parâmetros `start` e `end`, causando erro na API.

### Causa

O campo `data_agendamento` pode estar `null` e a expressão está tentando usar `DateTime.fromISO(null)`, que retorna `null`.

### Solução

Use expressões condicionais para só incluir os parâmetros quando `data_agendamento` tiver valor:

**No nó "Busca Disponibilidades", use "Send Query Parameters":**

- **start**: 
```javascript
={{ $('Get row(s)1').first().json.data_agendamento ? DateTime.fromISO($('Get row(s)1').first().json.data_agendamento).toUTC().toISO() : $now.setZone('America/Sao_Paulo').toUTC().toISO() }}
```

- **end**:
```javascript
={{ $('Get row(s)1').first().json.data_agendamento ? DateTime.fromISO($('Get row(s)1').first().json.data_agendamento).plus({ hours: 360 }).toUTC().toISO() : $now.setZone('America/Sao_Paulo').plus({ hours: 360 }).toUTC().toISO() }}
```

Isso garante que sempre haverá uma data válida, mesmo quando `data_agendamento` for `null`.

---

## Erro "Ambos os parâmetros start e end devem ser fornecidos juntos"

### Problema

Ao chamar a tool "Busca Disponibilidades", aparece o erro:
```
Bad request - please check your parameters, Ambos os parâmetros start e end devem ser fornecidos juntos
```

### Causa

O n8n não está resolvendo corretamente expressões complexas quando colocadas diretamente na URL. Expressões com `DateTime` não são avaliadas corretamente na URL.

### Solução

**NÃO coloque expressões complexas diretamente na URL.** Use a opção **"Send Query Parameters"** do nó HTTP Request:

1. No nó "Busca Disponibilidades"
2. Desmarque "Specify URL" ou deixe apenas a URL base
3. Marque **"Send Query Parameters"**
4. Adicione cada parâmetro separadamente:
   - `start`: `={{ expressão para start }}`
   - `end`: `={{ expressão para end }}`
   - `status`: `scheduled`
   - `company_id`: `={{ expressão para company_id }}`

Isso garante que cada parâmetro seja resolvido corretamente antes de ser adicionado à URL.

---

## Empresa não encontrada mesmo existindo no banco

### Problema

Ao fazer requisições à API, aparece "empresa não encontrada" mesmo que a empresa exista no banco de dados.

### Causa

1. Problemas com RLS (Row Level Security) do Supabase
2. Service role client não está bypassando RLS corretamente
3. `company_id` pode ter caracteres extras (espaços, quebras de linha)

### Solução

1. **Verificar e normalizar company_id**:
   - Remover espaços e quebras de linha
   - Validar formato UUID

2. **Usar RPC function para bypass RLS**:
   Execute o script `supabase/fix-company-service-role-access.sql` que cria uma função `get_company_by_id` com `SECURITY DEFINER` que bypassa RLS.

3. **Verificar Service Role Key**:
   - Certifique-se de usar a Service Role Key (não a anon key)
   - Verifique se a variável `SUPABASE_SERVICE_ROLE_KEY` está configurada corretamente

---

## IA não está usando as ferramentas de agendamento

### Problema

A IA não está usando as ferramentas "Busca Disponibilidades" ou "Cria Evento" quando o cliente pede horários disponíveis ou confirma uma data de agendamento.

### Causa

1. O prompt do AI Agent pode não ter instruções suficientemente explícitas sobre quando usar as ferramentas
2. As instruções podem estar muito genéricas e não imperativas o suficiente
3. O AI Agent pode não entender claramente quando deve usar cada ferramenta

### Solução

1. **Adicione regras obrigatórias explícitas no systemMessage do AI Agent**:
   - Sempre usar "Busca Disponibilidades" quando o cliente perguntar sobre horários
   - Sempre usar "Cria Evento" quando o cliente confirmar uma data
   - Inclua exemplos claros de quando usar cada ferramenta

2. **Melhore as descrições das Tools**:
   - Use emojis e formatação para destacar quando usar cada tool
   - Seja muito explícito e imperativo nas instruções
   - Inclua exemplos de cenários específicos

3. **Configure as Tools para usar `$fromAI` quando necessário**:
   - Para "Cria Evento", use `$fromAI` para que a IA forneça `start_at` e `end_at`
   - Isso permite que a IA forneça a data baseada na conversa

### Exemplo de System Message melhorado:

```markdown
# ⚠️ REGRAS OBRIGATÓRIAS PARA FERRAMENTAS DE AGENDAMENTO ⚠️

## REGRA 1: SEMPRE USAR "Busca Disponibilidades" QUANDO:
- O cliente perguntar sobre horários disponíveis
- O cliente mencionar interesse em agendar
- ANTES de criar qualquer evento

## REGRA 2: SEMPRE USAR "Cria Evento" QUANDO:
- O cliente confirmar uma data/hora
- Após verificar disponibilidade e o horário estiver livre
```

---

## Outros Problemas

Se você encontrar outros problemas, verifique:

1. **Logs do n8n**: Vá em Executions para ver logs detalhados
2. **Logs da API**: Verifique os logs no Vercel (se hospedado lá)
3. **Schema do Banco**: Certifique-se de que todas as tabelas e funções foram criadas
4. **Credenciais**: Verifique se todas as credenciais estão corretas e atualizadas
