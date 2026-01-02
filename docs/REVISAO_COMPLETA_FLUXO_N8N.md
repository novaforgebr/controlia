# Revisão Completa do Fluxo n8n - Correções Aplicadas

**Data:** 02/01/2026

## ✅ Correções Realizadas

### 1. Information Extractor - Escape de Chaves e Fallbacks

**Problema:** O `prompt_text` do banco contém chaves simples `{nome_completo}` que o LangChain interpreta como variáveis de template f-string, causando erro "Missing value for input".

**Correção:**
- ✅ Adicionado escape de chaves no nó "Concatenador #IA de Atendimento e Triagem"
- ✅ Chaves simples `{ }` convertidas para colchetes `[ ]` para evitar interpretação como variáveis
- ✅ Chaves duplas `{{ }}` preservadas (templates do n8n)
- ✅ Adicionados fallbacks para evitar valores `undefined` no `systemPromptTemplate`
- ✅ Adicionadas regras explícitas para campos string retornarem `""` em vez de `null`

**Arquivo:** `n8n/fluxo-n8n.json`
- Nó: "Concatenador #IA de Atendimento e Triagem" (linha ~721)
- Nó: "Information Extractor" (linha ~629)

### 2. AtualizaVariaveisExtrator - Garantir Strings Vazias

**Problema:** Campos string podiam retornar `null` causando erros de parsing.

**Correção:**
- ✅ Adicionado fallback `|| ''` para `nome_completo`, `interesse` e `historico_tratamento`
- ✅ Garantido que campos string sempre retornam string vazia em vez de `null`

**Arquivo:** `n8n/fluxo-n8n.json`
- Nó: "AtualizaVariaveisExtrator" (linhas ~228-231)

### 3. Data table Update - Descrições Completas

**Problema:** Descrição do campo `data_agendamento` estava incompleta (`...`).

**Correção:**
- ✅ Descrição completa para `agendamento_id`: "Atualiza o campo \"agendamento_id\" com o ID obtido da criação do evento. Este ID vem do resultado da ferramenta \"Cria Evento\" no campo \"id\" ou \"data.id\"."
- ✅ Descrição completa para `data_agendamento`: "Atualiza o campo \"data_agendamento\" com a data de início do evento criado. Use o campo \"start_at\" do resultado da ferramenta \"Cria Evento\" no formato ISO 8601 (ex: 2026-01-15T10:00:00Z)."

**Arquivo:** `n8n/fluxo-n8n.json`
- Nó: "Data table Update" (linhas ~472-473)

### 4. Supabase Vector Store - Configuração Correta

**Problema:** 
- `toolDescription` estava usando expressão dinâmica que pode não funcionar
- Tabela estava configurada como `files` em vez de `document_chunks`
- Faltavam filtros para `company_id` e `is_indexed`

**Correção:**
- ✅ `toolDescription` alterado para texto estático e descritivo
- ✅ Tabela corrigida para `document_chunks`
- ✅ Adicionados filtros:
  - `company_id` = company_id do webhook
  - `is_indexed` = true
- ✅ Adicionadas opções: `topK: 5`, `similarityThreshold: 0.7`

**Arquivo:** `n8n/fluxo-n8n.json`
- Nó: "Supabase Vector Store" (linhas ~1063-1092)

### 5. Information Extractor - Prompt Completo

**Correção:**
- ✅ Adicionado prompt completo com todas as regras obrigatórias
- ✅ Instruções explícitas para campos string retornarem `""` em vez de `null`
- ✅ Referência temporal completa
- ✅ Contexto da conversa com fallbacks

**Arquivo:** `n8n/fluxo-n8n.json`
- Nó: "Information Extractor" (linha ~629)

## 📋 Resumo das Mudanças

### Nós Modificados

1. **Concatenador #IA de Atendimento e Triagem**
   - Adicionado escape de chaves simples
   - Output: `prompt_text_escaped` (prompt com chaves escapadas)

2. **Information Extractor**
   - `systemPromptTemplate` atualizado com escape e fallbacks
   - Regras explícitas para campos string
   - Referência temporal completa

3. **AtualizaVariaveisExtrator**
   - Fallbacks `|| ''` para campos string
   - Garantido que nunca retorna `null` para strings

4. **Data table Update**
   - Descrições completas para `agendamento_id` e `data_agendamento`
   - Instruções claras sobre de onde obter os valores

5. **Supabase Vector Store**
   - Tabela corrigida: `document_chunks`
   - Filtros adicionados: `company_id` e `is_indexed`
   - Opções configuradas: `topK: 5`, `similarityThreshold: 0.7`
   - `toolDescription` estático e descritivo

## 🔍 Verificações Realizadas

### ✅ Conexões
- Todas as conexões entre nós estão corretas
- Fluxo lógico: Webhook → Define → Criar sessionId → Get row(s) → Prompts → Information Extractor → AtualizaVariaveisExtrator → AI Agent → Get row(s)1 → AtualizaPerguntaResposta → Prepare Response Data → HTTP Request

### ✅ Expressões
- Todas as expressões usam sintaxe correta do n8n
- Fallbacks adicionados onde necessário
- Referências a nós anteriores estão corretas

### ✅ Tipos de Dados
- Campos string garantem retorno de string vazia (`""`) em vez de `null`
- Campo `data_agendamento` pode ser `null` (tipo date)
- Todos os tipos estão consistentes com o schema do DataTable

### ✅ Ferramentas HTTP Request
- Todas as ferramentas têm `company_id` no header `x-company-id`
- Todas têm `Authorization` header
- Expressões de data usam `America/Sao_Paulo` timezone
- Fallbacks para `start_at` e `end_at` em "Cria Evento"

## 🎯 Status Final

✅ **Todas as correções aplicadas**
- Escape de chaves implementado
- Fallbacks adicionados
- Descrições completas
- Filtros corretos no Vector Store
- Regras explícitas para campos string

## 📝 Notas Importantes

1. **Escape de Chaves**: O prompt do banco pode conter exemplos de JSON com chaves simples. Essas são convertidas para colchetes para evitar erros de f-string.

2. **Campos String**: Todos os campos string (`nome_completo`, `historico_tratamento`, `interesse`) sempre retornam string vazia (`""`) quando não encontrados, nunca `null`.

3. **Vector Store**: Agora filtra corretamente por `company_id` e `is_indexed`, garantindo que apenas documentos da empresa e indexados sejam buscados.

4. **Data table Update**: As descrições agora são completas e indicam claramente de onde obter os valores (`id` ou `data.id` do resultado de "Cria Evento").

## 🚀 Próximos Passos

1. Testar o fluxo completo no n8n
2. Verificar se o Information Extractor não apresenta mais erros de f-string
3. Verificar se os campos string retornam strings vazias em vez de `null`
4. Testar a busca no Vector Store com filtros de `company_id`
5. Verificar se o "Data table Update" recebe os valores corretos após criar eventos

