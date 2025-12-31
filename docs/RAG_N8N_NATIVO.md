# Implementação de RAG usando Tools Nativos do n8n

Este documento descreve como implementar RAG (Retrieval Augmented Generation) usando as ferramentas nativas do n8n: **Supabase Vector Store** e **Embeddings OpenAI**.

## 📋 Visão Geral

Ao invés de usar uma API externa, utilizamos os nós nativos do n8n que já estão otimizados para RAG:
- **Supabase Vector Store**: Gerencia o armazenamento e busca vetorial diretamente
- **Embeddings OpenAI**: Gera embeddings dos documentos e queries

## 🏗️ Arquitetura no n8n

```
Cliente faz pergunta
    ↓
AI Agent identifica necessidade de buscar
    ↓
Tool "Busca Base de Conhecimento" é chamada
    ↓
Embeddings OpenAI: Gera embedding da query
    ↓
Supabase Vector Store: Busca chunks similares
    ↓
Retorna resultados ao AI Agent
    ↓
AI Agent usa informações para responder
```

## 📦 Pré-requisitos

### 1. Schema SQL no Supabase

Execute o arquivo `supabase/vector-store-schema.sql` no Supabase SQL Editor para criar:
- Tabela `document_chunks`
- Índices HNSW
- Função `search_similar_chunks`

### 2. Credenciais no n8n

Certifique-se de ter configuradas:
- **Supabase Credentials**: URL e Service Role Key
- **OpenAI Credentials**: API Key

## 🔧 Configuração no n8n

### Passo 1: Configurar Supabase Vector Store (Tool)

1. No seu workflow, adicione um nó do tipo **"Supabase Vector Store"** como **Tool**
2. Configure as credenciais:
   - **Connection**: Selecione ou crie credenciais do Supabase
   - **Table Name**: `document_chunks`
   - **Similarity Threshold**: `0.7` (ajustável)
   - **Return Source Documents**: `true`
   - **Top K**: `5` (número de resultados)

3. **Campo de Embedding**: `content_embedding`
4. **Campo de Texto**: `content`
5. **Metadados**: Configure para retornar `file_name`, `file_category`, `file_tags`, etc.

### Passo 2: Configurar Embeddings OpenAI (Tool)

1. Adicione um nó **"Embeddings OpenAI"** também como **Tool**
2. Configure:
   - **Credential**: Selecione credenciais OpenAI
   - **Model**: `text-embedding-3-small` (1536 dimensões - mais barato)
   - **Input Type**: `text`
   - **Dimensions**: `1536`

### Passo 3: Criar Workflow de Busca RAG

Crie um subworkflow ou use nós conectados para:

1. **Embeddings OpenAI** (Tool):
   - Recebe a `query` do usuário
   - Gera o embedding
   - Passa o embedding para o Supabase Vector Store

2. **Supabase Vector Store** (Tool):
   - Recebe o embedding da query
   - Busca chunks similares no Supabase
   - Retorna os documentos mais relevantes

### Passo 4: Conectar ao AI Agent

Conecte ambas as tools ao **AI Agent - Respostas** para que ele possa usar quando necessário.

## 📝 Configuração Detalhada dos Nós

### Supabase Vector Store - Configuração JSON

```json
{
  "name": "Busca Base de Conhecimento",
  "type": "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
  "typeVersion": 1,
  "parameters": {
    "credential": "supabaseApi",
    "tableName": "document_chunks",
    "similarityThreshold": 0.7,
    "topK": 5,
    "returnSourceDocuments": true,
    "filter": {
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
    },
    "options": {
      "queryName": "query",
      "vectorFieldName": "content_embedding",
      "metadataFields": ["file_name", "file_type", "file_category", "file_tags"]
    }
  }
}
```

### Embeddings OpenAI - Configuração JSON

```json
{
  "name": "Embeddings OpenAI",
  "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
  "typeVersion": 1,
  "parameters": {
    "credential": "openAiApi",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "inputType": "text",
    "options": {}
  }
}
```

## 🎯 Tool Description para AI Agent

Use a seguinte descrição para que o AI Agent saiba quando e como usar:

```
Busca informações na base de conhecimento da empresa usando busca semântica (RAG).

Use esta ferramenta quando:
- O cliente fizer perguntas sobre produtos, serviços, políticas, procedimentos da empresa
- Você precisar de informações específicas que não estão no seu conhecimento base
- O cliente perguntar sobre documentação, termos, condições, prazos, métodos de pagamento, etc.

A ferramenta automaticamente:
1. Gera um embedding da pergunta do cliente
2. Busca os documentos mais similares na base de conhecimento da empresa
3. Retorna os trechos (chunks) mais relevantes

Parâmetros:
- query (obrigatório): A pergunta ou termo de busca do cliente

Retorna:
- Array de documentos relevantes da base de conhecimento
- Cada documento contém: pageContent (texto), metadata (nome do arquivo, categoria, tags)
- Score de similaridade para cada resultado

IMPORTANTE:
- Use os resultados para enriquecer sua resposta, mas sempre cite a fonte quando possível
- Se não encontrar resultados relevantes, informe ao cliente que não há informações disponíveis
- Combine múltiplos documentos se necessário para dar uma resposta completa
- Não invente informações - se não encontrar, seja honesto
```

## 🔗 Conectando as Tools

### Opção 1: Tool Composta (Recomendado)

Crie um nó **Code** que coordena ambas as tools:

```javascript
// Nó Code: "Busca RAG Completa"
const query = $input.item.json.query || $input.item.json.text;

// 1. Gerar embedding
const embeddingResult = await $node["Embeddings OpenAI"].execute({
  json: { text: query }
});

const embedding = embeddingResult.first().json.embedding;

// 2. Buscar no Supabase Vector Store
const searchResult = await $node["Supabase Vector Store"].execute({
  json: { 
    queryVector: embedding,
    query: query
  }
});

return searchResult.all();
```

### Opção 2: Conexão Direta

Conecte diretamente:
- **Embeddings OpenAI** → **Supabase Vector Store**

O n8n pode conectar automaticamente se configurado corretamente.

## 📊 Estrutura de Retorno

Quando o AI Agent chama a tool, ele receberá:

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
  ],
  "query": "política de reembolso",
  "totalResults": 5
}
```

## ⚙️ Filtros e Personalização

### Filtrar por Empresa

Adicione um filtro no Supabase Vector Store:

```json
{
  "filter": {
    "conditions": [
      {
        "key": "company_id",
        "value": "={{ $('Webhook').first().json.body.controlia.company_id }}",
        "operator": "equals"
      }
    ]
  }
}
```

### Filtrar por Categoria ou Tags

```json
{
  "filter": {
    "conditions": [
      {
        "key": "company_id",
        "value": "={{ $('Webhook').first().json.body.controlia.company_id }}",
        "operator": "equals"
      },
      {
        "key": "file_category",
        "value": "Políticas",
        "operator": "equals"
      }
    ]
  }
}
```

## 🚀 Indexação de Documentos

Para indexar documentos, você pode criar um workflow separado:

1. **Get Row(s) from Supabase**: Buscar arquivos com `is_knowledge_base = true`
2. **Extract Text**: Extrair texto do arquivo (PDF, DOCX, etc.)
3. **Split Text**: Dividir em chunks
4. **Embeddings OpenAI**: Gerar embedding de cada chunk
5. **Insert into Supabase**: Salvar na tabela `document_chunks`

## 🐛 Troubleshooting

### Warning no Supabase Vector Store

Se aparecer um warning (⚠️):
1. Verifique se as credenciais do Supabase estão corretas
2. Verifique se a tabela `document_chunks` existe
3. Verifique se o campo `content_embedding` existe e é do tipo `vector(1536)`
4. Verifique se o índice HNSW foi criado

### Erro "Table not found"

Execute o script `supabase/vector-store-schema.sql` no Supabase.

### Erro "Embedding dimensions mismatch"

Certifique-se de que:
- Modelo OpenAI: `text-embedding-3-small`
- Dimensions: `1536`
- Campo no Supabase: `vector(1536)`

### Nenhum resultado retornado

1. Verifique se há documentos indexados: `SELECT COUNT(*) FROM document_chunks WHERE is_indexed = true`
2. Reduza o `similarityThreshold` (ex: 0.5)
3. Verifique se o filtro `company_id` está correto

## 📚 Referências

- [n8n Supabase Vector Store](https://docs.n8n.io/integrations/builtin/memory-nodes/langchain/supabase-vector-store/)
- [n8n OpenAI Embeddings](https://docs.n8n.io/integrations/builtin/memory-nodes/langchain/openai-embeddings/)
- [Supabase Vector Store](https://supabase.com/docs/guides/ai/vector-columns)

