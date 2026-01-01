# Correção: IA não está buscando disponibilidades e criando eventos

## Problema

A IA do fluxo n8n não estava:
1. Usando a tool "Busca Disponibilidades" quando o cliente perguntava sobre horários disponíveis
2. Usando a tool "Cria Evento" quando o cliente confirmava uma data de agendamento

## Causas Identificadas

1. **Prompt do AI Agent incompleto**: O `systemMessage` não tinha instruções suficientemente explícitas e imperativas sobre quando usar as ferramentas
2. **Descrições das Tools genéricas**: As `toolDescription` não eram claras o suficiente sobre quando usar cada ferramenta
3. **Dependências de nós não executados**: Algumas tools ainda tentavam acessar `$('Get row(s)1')` que pode não estar disponível quando a tool é chamada dinamicamente
4. **Referências incorretas**: Uso de `Webhook1` ao invés de `Webhook` em alguns lugares

## Correções Aplicadas

### 1. System Message do AI Agent Atualizado

Adicionado seção completa com **REGRAS OBRIGATÓRIAS** no `systemMessage`:

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

### 2. Tool "Busca Disponibilidades" Melhorada

**Antes:**
- Descrição genérica
- Tentava acessar `$('Get row(s)1')` que pode não estar disponível

**Depois:**
- Descrição mais explícita com emojis e instruções imperativas
- Usa apenas `$now` e `$('Webhook')` que estão sempre disponíveis
- Busca automaticamente os próximos 15 dias a partir de agora

### 3. Tool "Cria Evento" Refatorada

**Antes:**
- Tentava acessar `$('Get row(s)1')` para obter dados
- Descrição não era suficientemente clara

**Depois:**
- Usa `$fromAI` para receber `start_at` e `end_at` diretamente da IA
- Descrição muito mais explícita com exemplos de quando usar
- A IA fornece a data baseada na conversa

### 4. Correções de Referências

- Substituído todas as referências `Webhook1` por `Webhook`
- Corrigido expressões que tentavam acessar nós não executados
- Removido header duplicado `x-company-id`

### 5. Tool "Atualiza Eventos" e "Exclui Eventos"

- Atualizadas para usar `$fromAI` quando necessário
- Corrigidas referências para `Webhook` (ao invés de `Webhook1`)

## Arquivos Modificados

1. `n8n/fluxo-n8n.json`:
   - `systemMessage` do nó "AI Agent - Respostas" (adicionado regras obrigatórias)
   - `toolDescription` de "Busca Disponibilidades" (melhorada)
   - `toolDescription` de "Cria Evento" (melhorada)
   - `jsonBody` de "Cria Evento" (usando `$fromAI`)
   - `jsonBody` de "Atualiza Eventos" (usando `$fromAI`)
   - Expressões em todas as tools (corrigidas dependências)
   - Referências `Webhook1` → `Webhook` (corrigidas)

2. `docs/TROUBLESHOOTING_N8N.md`:
   - Adicionada seção sobre "IA não está usando as ferramentas de agendamento"

## Como Funciona Agora

### Fluxo de Agendamento:

1. **Cliente pergunta sobre horários:**
   - IA detecta que precisa buscar disponibilidades
   - IA usa **"Busca Disponibilidades"** automaticamente
   - IA informa os horários livres ao cliente

2. **Cliente confirma uma data:**
   - IA detecta confirmação (ex: "sim", "confirmo", "está bom")
   - IA usa **"Cria Evento"** fornecendo `start_at` e `end_at` via `$fromAI`
   - IA usa **"Data table Update"** para salvar o ID do agendamento
   - IA confirma o agendamento ao cliente

### Exemplo de Interação:

**Cliente**: "verifique quais horários você tem disponíveis"

**IA**: [Usa "Busca Disponibilidades"] 
"Tenho disponibilidade nos seguintes horários: [lista horários livres]"

**Cliente**: "Pode ser amanhã às 10h"

**IA**: [Usa "Cria Evento" com start_at e end_at]
[Usa "Data table Update" para salvar ID]
"Perfeito! Seu agendamento está confirmado para amanhã, [data], às 10h da manhã."

## Validação

Para testar as correções:

1. **Teste 1 - Buscar disponibilidades:**
   - Envie: "quais horários você tem disponíveis?"
   - ✅ A IA deve usar "Busca Disponibilidades" automaticamente

2. **Teste 2 - Confirmar agendamento:**
   - Envie: "quero agendar para amanhã às 10h"
   - ✅ A IA deve usar "Busca Disponibilidades" primeiro
   - ✅ Se livre, deve usar "Cria Evento" imediatamente
   - ✅ Deve usar "Data table Update" para salvar o ID

3. **Teste 3 - Confirmação após sugestão:**
   - Envie: "quais horários você tem?"
   - Aguarde resposta da IA
   - Responda: "Pode ser às 14h"
   - ✅ A IA deve usar "Cria Evento" imediatamente

## Notas Importantes

1. **`$fromAI`**: As tools "Cria Evento" e "Atualiza Eventos" agora usam `$fromAI` para receber datas. A IA precisa fornecer essas datas no formato ISO 8601.

2. **Prompt Imperativo**: As regras no `systemMessage` são muito explícitas e imperativas para garantir que a IA use as ferramentas quando apropriado.

3. **Sem Dependências de Nós**: Todas as tools agora usam apenas `$now` e `$('Webhook')` que estão sempre disponíveis, evitando erros de "node hasn't been executed".

## Próximos Passos

Se a IA ainda não estiver usando as ferramentas corretamente:

1. Verifique se o prompt foi aplicado corretamente no n8n
2. Verifique os logs de execução do n8n para ver se há erros
3. Considere tornar as instruções ainda mais explícitas no prompt
4. Teste com diferentes modelos de IA (pode haver diferenças na interpretação)

