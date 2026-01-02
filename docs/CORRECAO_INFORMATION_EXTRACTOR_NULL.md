# Correção: Information Extractor retornando null para campos string

## ❌ Problema

O nó "Information Extractor" estava retornando `null` para campos do tipo string quando a informação não era encontrada, causando erro de parsing:

```
Failed to parse. Text: "{"nome_completo": null, "historico_tratamento": null, "interesse": null, "data_agendamento": "2026-01-08"}". 
Error: Expected string, received null
```

## ✅ Solução

Atualizado o prompt do Information Extractor para instruir a IA a sempre retornar strings vazias (`""`) em vez de `null` para campos do tipo string.

### Campos Afetados

1. **nome_completo** (string): Deve retornar `""` se não encontrar, nunca `null`
2. **historico_tratamento** (string): Deve retornar `""` se não encontrar, nunca `null`
3. **interesse** (string): Deve retornar `""` se não encontrar, nunca `null`
4. **data_agendamento** (date): Pode retornar `null` ou ser omitido se não houver data (este campo pode ter `null`)

### Mudanças Aplicadas

**Arquivo:** `n8n/fluxo-n8n.json`

**Prompt atualizado:** Adicionadas instruções explícitas no `systemPromptTemplate`:

```
### REGRAS OBRIGATÓRIAS PARA OS CAMPOS:

1. **nome_completo** (string): Se não encontrar o nome completo, retorne string vazia "" (NUNCA null).
2. **historico_tratamento** (string): Se não encontrar histórico, retorne string vazia "" (NUNCA null).
3. **interesse** (string): Se não encontrar interesse, retorne string vazia "" (NUNCA null).
4. **data_agendamento** (date): Se não houver data mencionada, não inclua o campo ou retorne null apenas para este campo.

IMPORTANTE: Campos do tipo string (nome_completo, historico_tratamento, interesse) SEMPRE devem ser strings, nunca null. Use "" (string vazia) se a informação não for encontrada.
```

## 📝 Exemplos de Output Correto

### ✅ Correto - Campos string vazios em vez de null
```json
{
  "nome_completo": "",
  "historico_tratamento": "",
  "interesse": "",
  "data_agendamento": "2026-01-08T12:00:00Z"
}
```

### ❌ Incorreto - Campos string com null
```json
{
  "nome_completo": null,  // ❌ ERRO: Esperado string, recebido null
  "historico_tratamento": null,  // ❌ ERRO
  "interesse": null,  // ❌ ERRO
  "data_agendamento": "2026-01-08T12:00:00Z"
}
```

### ✅ Correto - Apenas data preenchida
```json
{
  "nome_completo": "",
  "historico_tratamento": "",
  "interesse": "",
  "data_agendamento": "2026-01-08T12:00:00Z"
}
```

### ✅ Correto - Nenhuma informação nova
```json
{
  "nome_completo": "",
  "historico_tratamento": "",
  "interesse": ""
}
```

## 🔍 Como Verificar

Após a correção, o Information Extractor deve:
1. ✅ Sempre retornar strings (`""`) para campos string, mesmo quando não encontrar valores
2. ✅ Nunca retornar `null` para `nome_completo`, `historico_tratamento` ou `interesse`
3. ✅ Permitir `null` ou omitir apenas para `data_agendamento`

## 📚 Documentação Atualizada

- ✅ `docs/PROMPTS_IA_COMPLETOS.md` - Atualizado com as novas regras
- ✅ `n8n/fluxo-n8n.json` - Prompt do Information Extractor atualizado

## 🎯 Status

✅ **Corrigido** - O prompt agora instrui explicitamente a IA a retornar strings vazias em vez de `null` para campos string.

