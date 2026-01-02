# Correção: Erro f-string no Information Extractor

## ❌ Problema

O nó "Information Extractor" estava apresentando o seguinte erro:

```
(f-string) Missing value for input
Troubleshooting URL: https://docs.langchain.com/oss/javascript/langchain/errors/INVALID_PROMPT_INPUT/
```

## 🔍 Causa

O erro ocorria porque o `prompt_text` que vem do banco de dados (`ai_prompts` table) contém chaves simples `{nome_completo}` ou exemplos de JSON como `{ "nome_completo": "João Silva Santos" }` que o LangChain interpreta como variáveis de template f-string.

Quando o LangChain processa o prompt, ele tenta substituir essas variáveis (ex: `{nome_completo}`), mas como elas não são fornecidas no contexto, gera o erro "Missing value for input".

### Exemplo do Problema

Se o `prompt_text` contém:
```
**Exemplo 1 - Nome completo mencionado:**
"nome_completo": "João Silva Santos"
```

Ou:
```json
{
  "nome_completo": "Maria Oliveira"
}
```

O LangChain tenta processar `{nome_completo}` como uma variável de template, causando o erro.

## ✅ Solução

Implementada uma solução em duas etapas:

### 1. Escape no Nó "Concatenador #IA de Atendimento e Triagem"

Atualizado o código JavaScript do nó "Concatenador" para escapar chaves simples ANTES de passar o prompt para o Information Extractor:

```javascript
// Escapar chaves simples do prompt para evitar interpretação como variáveis de template pelo LangChain
// Substitui { por [ e } por ] para evitar conflito com templates do n8n ({{ }}) e LangChain
const promptEscapado = concatenado
  .replace(/\{\{/g, 'TEMP_DOUBLE_OPEN')  // Salva chaves duplas temporariamente
  .replace(/\}\}/g, 'TEMP_DOUBLE_CLOSE')
  .replace(/\{/g, '[')  // Substitui chaves simples por colchetes
  .replace(/\}/g, ']')
  .replace(/TEMP_DOUBLE_OPEN/g, '{{')  // Restaura chaves duplas
  .replace(/TEMP_DOUBLE_CLOSE/g, '}}');
```

### 2. Fallback no Information Extractor

Adicionado fallback no `systemPromptTemplate` para garantir que mesmo se o escape não funcionar, há uma camada de proteção:

```javascript
"systemPromptTemplate": "={{ $('Concatenador #IA de Atendimento e Triagem').first().json.prompt_text_escaped || ($json.prompt_text || '').replace(...) }}\n\n..."
```

### Como Funciona

A solução converte:
- Chaves simples `{nome_completo}` → Colchetes `[nome_completo]`
- Chaves simples `{"nome": "valor"}` → `["nome": "valor"]`
- Chaves duplas `{{ $expression }}` → Mantidas como estão (templates do n8n)

Isso garante que:
1. ✅ Chaves simples no `prompt_text` não são interpretadas como variáveis pelo LangChain
2. ✅ Chaves duplas do n8n (`{{ }}`) continuam funcionando normalmente
3. ✅ Exemplos de JSON no prompt não causam erros

## 📝 Exemplo

### Prompt no Banco (contém chaves simples)
```
**Exemplo 1 - Nome completo mencionado:**
"nome_completo": "João Silva Santos"
```

### Após Escape (chaves convertidas para colchetes)
```
**Exemplo 1 - Nome completo mencionado:**
"nome_completo": "João Silva Santos"
```

O LangChain agora vê `[nome_completo]` como texto literal, não como variável de template.

### Templates do n8n (mantidos)
```
Nome do contato: {{ $('Webhook').first().json.body.message.from.first_name }}
```
Continua funcionando normalmente porque `{{` e `}}` são preservados.

## 🎯 Status

✅ **Corrigido** - Chaves simples no `prompt_text` são convertidas para colchetes, evitando interpretação como variáveis de template f-string pelo LangChain.

## 🔗 Arquivos Modificados

- `n8n/fluxo-n8n.json`:
  - Nó "Concatenador #IA de Atendimento e Triagem" - Adicionado escape de chaves
  - Nó "Information Extractor" - Adicionado fallback no `systemPromptTemplate`

## 📚 Nota

A conversão de `{ }` para `[ ]` é segura porque:
- Colchetes não são interpretados como variáveis pelo LangChain
- Colchetes são visualmente similares a chaves (fácil de ler)
- Não interfere com templates do n8n que usam `{{ }}`
