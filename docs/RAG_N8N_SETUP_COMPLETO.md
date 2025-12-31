# 🚀 Setup Completo de RAG no n8n - Passo a Passo

Guia detalhado para configurar RAG usando tools nativas do n8n.

## 📋 Checklist de Pré-requisitos

- [ ] Schema SQL executado no Supabase (`supabase/vector-store-schema.sql`)
- [ ] Credenciais Supabase configuradas no n8n
- [ ] Credenciais OpenAI configuradas no n8n
- [ ] Documentos indexados na tabela `document_chunks` (opcional para teste)

## 🔧 Passo 1: Executar Schema SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/vector-store-schema.sql`
4. Cole e execute o script completo
5. Verifique se a tabela `document_chunks` foi criada

```sql
-- Verificar se a tabela existe
SELECT * FROM document_chunks LIMIT 1;
```

## 🔧 Passo 2: Configurar Credenciais no n8n

### Supabase Credentials

1. No n8n, vá em **Credentials** → **Add Credential**
2. Procure por **Supabase**
3. Configure:
   - **Host**: URL do seu projeto (ex: `https://xxxxx.supabase.co`)
   - **Service Role Secret**: Use a Service Role Key (não a anon key)
   - **Database**: Deixe vazio (usa padrão)
   - **Port**: Deixe vazio (usa padrão)
4. Salve como `Supabase RAG`

### OpenAI Credentials

1. Vá em **Credentials** → **Add Credential**
2. Procure por **OpenAI**
3. Configure:
   - **API Key**: Sua chave OpenAI
4. Salve como `OpenAI Embeddings`

## 🔧 Passo 3: Adicionar Tools ao Workflow

### 3.1 Adicionar Embeddings OpenAI (Tool)

1. No seu workflow do AI Agent, clique em **Add Node**
2. Procure por **"Embeddings OpenAI"**
3. Selecione como **Tool** (não como nó normal)
4. Configure:
   - **Credential**: Selecione `OpenAI Embeddings`
   - **Model**: `text-embedding-3-small`
   - **Dimensions**: `1536`
   - **Input Type**: `text`
5. Nome: `Embeddings OpenAI`

### 3.2 Adicionar Supabase Vector Store (Tool)

1. Clique em **Add Node**
2. Procure por **"Supabase Vector Store"**
3. Selecione como **Tool**
4. Configure:

**Aba Principal:**
- **Credential**: Selecione `Supabase RAG`
- **Table Name**: `document_chunks`
- **Similarity Threshold**: `0.7`
- **Top K**: `5` (número de resultados)
- **Return Source Documents**: ✅ Marque como `true`

**Aba Options/Filters:**
- **Query Name**: `query`
- **Vector Field Name**: `content_embedding`
- **Metadata Fields**: `file_name,file_type,file_category,file_tags`

**Adicionar Filtro por Empresa:**
No campo **Filter**, adicione:
```json
{
  "conditions": [
    {
      "key": "company_id",
      "value": "={{ $('Webhook').first().json.body.controlia.company_id }}",
      "operator": "equals"
    },
    {
      "key": "is_indexed",
      "value": true,
      "operator": "equals"
    }
  ]
}
```

5. Nome: `Busca Base de Conhecimento`

### 3.3 Conectar as Tools

1. Conecte **Embeddings OpenAI** → **Busca Base de Conhecimento**
   - O output `embedding` do Embeddings OpenAI será usado como input do Vector Store
   
2. **IMPORTANTE**: Ambas as tools devem estar conectadas ao **AI Agent - Respostas**
   - O AI Agent precisa ter acesso a ambas para funcionar corretamente

## 🔧 Passo 4: Configurar Tool Description

No nó **"Busca Base de Conhecimento"**, adicione a seguinte descrição no campo **Tool Description**:

```
Busca informações na base de conhecimento da empresa usando busca semântica (RAG).

Use esta ferramenta quando:
- O cliente fizer perguntas sobre produtos, serviços, políticas, procedimentos da empresa
- Você precisar de informações específicas que não estão no seu conhecimento base
- O cliente perguntar sobre documentação, termos, condições, prazos, métodos de pagamento, etc.

A ferramenta automaticamente:
1. Gera um embedding da pergunta do cliente usando OpenAI
2. Busca os documentos mais similares na base de conhecimento usando Supabase Vector Store
3. Retorna os trechos (chunks) mais relevantes com suas fontes

Parâmetros:
- query (obrigatório): A pergunta ou termo de busca do cliente

Retorna:
- Array de documentos relevantes da base de conhecimento
- Cada documento contém:
  - pageContent: Texto do chunk de documento
  - metadata: Objeto com file_name, file_type, file_category, file_tags, similarity

IMPORTANTE:
- Use os resultados para enriquecer sua resposta, mas sempre cite a fonte quando possível
- Exemplo: "De acordo com nossa documentação em [file_name]..."
- Se não encontrar resultados relevantes, informe ao cliente que não há informações disponíveis
- Combine múltiplos documentos se necessário para dar uma resposta completa
- Não invente informações - se não encontrar, seja honesto
```

## 🔧 Passo 5: Testar a Configuração

### Teste Manual

1. Adicione um nó **HTTP Request** temporário antes das tools
2. Configure para enviar:
```json
{
  "query": "política de reembolso"
}
```

3. Execute o workflow
4. Verifique se:
   - Embeddings OpenAI gera um embedding (array de 1536 números)
   - Supabase Vector Store retorna documentos

### Teste com AI Agent

1. Envie uma mensagem de teste via webhook
2. Faça uma pergunta que requer busca na base de conhecimento
3. Verifique se o AI Agent:
   - Identifica a necessidade de buscar
   - Chama a tool corretamente
   - Usa os resultados na resposta

## 🐛 Troubleshooting

### Erro: "Table document_chunks does not exist"

**Solução**: Execute o script SQL `supabase/vector-store-schema.sql`

### Erro: "Column content_embedding does not exist"

**Solução**: Verifique se o schema foi executado corretamente. O campo deve ser do tipo `vector(1536)`

### Warning: "No embedding found" no Supabase Vector Store

**Solução**: 
- Verifique se há documentos indexados: `SELECT COUNT(*) FROM document_chunks WHERE is_indexed = true`
- Certifique-se de que os documentos foram processados e têm embeddings

### Erro: "Dimensions mismatch"

**Solução**: 
- Certifique-se de que o modelo OpenAI é `text-embedding-3-small`
- Dimensions configurado como `1536`
- Campo no Supabase é `vector(1536)`

### Nenhum resultado retornado

**Solução**:
1. Reduza o `similarityThreshold` para `0.5` ou `0.6`
2. Verifique se o filtro `company_id` está correto
3. Verifique se há documentos indexados para essa empresa

### Embeddings OpenAI não está gerando embedding

**Solução**:
- Verifique se a API Key do OpenAI está correta
- Verifique se há créditos na conta OpenAI
- Verifique se o input está chegando corretamente (adicione um nó de log)

## 📊 Estrutura de Dados Esperada

### Input para Embeddings OpenAI
```json
{
  "text": "Qual é a política de reembolso?"
}
```

### Output de Embeddings OpenAI
```json
{
  "embedding": [0.123, -0.456, 0.789, ...] // Array de 1536 números
}
```

### Output de Supabase Vector Store
```json
{
  "documents": [
    {
      "pageContent": "Texto do chunk de documento...",
      "metadata": {
        "file_name": "Política de Reembolso.pdf",
        "file_type": "document",
        "file_category": "Políticas",
        "file_tags": ["reembolso", "política"],
        "similarity": 0.85
      }
    }
  ]
}
```

## ✅ Checklist Final

- [ ] Schema SQL executado
- [ ] Credenciais configuradas
- [ ] Embeddings OpenAI (Tool) adicionado e configurado
- [ ] Supabase Vector Store (Tool) adicionado e configurado
- [ ] Tools conectadas ao AI Agent
- [ ] Tool Description configurada
- [ ] Filtro por company_id adicionado
- [ ] Teste manual executado com sucesso
- [ ] Teste com AI Agent executado com sucesso

## 🚀 Próximos Passos

1. **Indexar Documentos**: Crie um workflow para processar e indexar documentos automaticamente
2. **Monitorar Performance**: Acompanhe os logs para verificar queries e resultados
3. **Ajustar Thresholds**: Ajuste o `similarityThreshold` baseado nos resultados obtidos
4. **Adicionar Filtros**: Configure filtros adicionais por categoria, tags, etc.

## 📚 Documentação Adicional

- `docs/RAG_N8N_NATIVO.md` - Documentação técnica detalhada
- `docs/PROMPTS_IA_COMPLETOS.md` - Prompts atualizados com instruções RAG

