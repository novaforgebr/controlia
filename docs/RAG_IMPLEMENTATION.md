# Implementação de RAG (Retrieval Augmented Generation) com Supabase Vector Store

Este documento descreve a implementação completa de RAG para permitir que o agente de IA busque informações na base de conhecimento da empresa.

## 📋 Visão Geral

O sistema de RAG permite que o agente de IA:
1. Busque informações relevantes nos documentos da empresa usando busca vetorial
2. Use essas informações como contexto para responder perguntas dos clientes
3. Forneça respostas mais precisas baseadas na documentação da empresa

## 🏗️ Arquitetura

### Componentes

1. **Tabela `document_chunks`**: Armazena pedaços (chunks) de documentos com seus embeddings
2. **API `/api/rag/search`**: Endpoint para busca vetorial
3. **Tool HTTP Request no n8n**: Ferramenta para o agente buscar informações
4. **OpenAI Embeddings**: Gera embeddings dos documentos e queries

### Fluxo de Funcionamento

```
Cliente faz pergunta
    ↓
Agente identifica necessidade de buscar na base de conhecimento
    ↓
Tool "Busca Base de Conhecimento" é chamada
    ↓
API gera embedding da query
    ↓
Busca chunks similares no Supabase (busca vetorial)
    ↓
Retorna informações relevantes
    ↓
Agente usa informações para responder ao cliente
```

## 📦 Instalação

### 1. Executar Schema SQL

Execute o arquivo `supabase/vector-store-schema.sql` no Supabase SQL Editor:

```sql
-- Este script cria:
-- - Tabela document_chunks
-- - Índices HNSW para busca vetorial
-- - Função search_similar_chunks
-- - Políticas RLS
```

### 2. Configurar Variáveis de Ambiente

Certifique-se de que `OPENAI_API_KEY` está configurada no `.env`:

```env
OPENAI_API_KEY=sk-...
```

### 3. Adicionar Tool no n8n

Adicione o nó HTTP Request Tool conforme descrito na seção "Tool no n8n" abaixo.

## 🔧 Configuração

### Tool no n8n

Adicione um novo nó HTTP Request Tool com a seguinte configuração:

**Nome**: `Busca Base de Conhecimento`

**Parâmetros**:
- **Method**: `POST`
- **URL**: `https://controliaa.vercel.app/api/rag/search`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{ $('Webhook').first().json.body.controlia.token }}`
  - `x-company-id`: `{{ $('Webhook').first().json.body.controlia.company_id }}`
- **Body (JSON)**:
```json
{
  "query": "{{ $json.query }}",
  "company_id": "{{ $('Webhook').first().json.body.controlia.company_id }}",
  "limit": 5,
  "similarity_threshold": 0.7
}
```

**Tool Description**:
```
Busca informações na base de conhecimento da empresa usando busca semântica.

Use esta ferramenta quando:
- O cliente fizer perguntas sobre produtos, serviços, políticas, procedimentos da empresa
- Você precisar de informações específicas que não estão no seu conhecimento base
- O cliente perguntar sobre documentação, termos, condições, etc.

Parâmetros:
- query (obrigatório): A pergunta ou termo de busca do cliente
- limit (opcional): Número de resultados (padrão: 5, máximo: 10)
- similarity_threshold (opcional): Threshold de similaridade (padrão: 0.7, 0.0-1.0)

Retorna:
- Array de chunks de documentos relevantes
- Cada chunk contém: content (texto), file_name, similarity (score), metadata

IMPORTANTE:
- Use os resultados para enriquecer sua resposta, mas sempre cite a fonte quando possível
- Se não encontrar resultados relevantes, informe ao cliente que não há informações disponíveis
- Combine múltiplos chunks se necessário para dar uma resposta completa
```

### Atualizar Prompt do AI Agent

Adicione a seguinte seção ao prompt do "AI Agent - Respostas":

```
## FERRAMENTA DE BASE DE CONHECIMENTO:

### Busca Base de Conhecimento:
Use esta ferramenta quando o cliente fizer perguntas sobre:
- Produtos e serviços da empresa
- Políticas, termos e condições
- Procedimentos e processos
- Informações técnicas específicas
- Qualquer informação que você não tenha certeza

Como usar:
1. Identifique quando a pergunta requer informações da base de conhecimento
2. Chame a ferramenta com a query (pergunta do cliente)
3. Analise os resultados retornados
4. Use as informações para responder ao cliente de forma precisa
5. Sempre cite a fonte quando possível (ex: "De acordo com nossa documentação...")

Exemplo:
Cliente: "Qual é o prazo de entrega?"
Você: [Chama "Busca Base de Conhecimento" com query="prazo de entrega"]
     [Analisa resultados]
     "De acordo com nossa documentação, o prazo de entrega é de 15 a 30 dias úteis..."
```

## 📝 Processamento de Documentos

Para que os documentos sejam pesquisáveis, eles precisam ser processados e indexados:

### Processo Manual (Futuro: Automatizar)

1. **Extrair texto do arquivo** (PDF, DOCX, TXT, etc.)
2. **Dividir em chunks** (pedaços de ~500-1000 tokens)
3. **Gerar embeddings** usando OpenAI
4. **Armazenar na tabela `document_chunks`**

### Exemplo de Script de Indexação

```typescript
// app/actions/rag.ts (a ser criado)
export async function indexDocument(fileId: string) {
  // 1. Buscar arquivo
  // 2. Extrair texto
  // 3. Dividir em chunks
  // 4. Gerar embeddings
  // 5. Salvar na tabela document_chunks
}
```

## 🔍 Como Usar

### No n8n

O agente de IA automaticamente usará a tool quando necessário. Exemplo de interação:

**Cliente**: "Qual é a política de reembolso?"

**Agente**:
1. Identifica que precisa buscar na base de conhecimento
2. Chama "Busca Base de Conhecimento" com query="política de reembolso"
3. Recebe chunks relevantes
4. Responde: "De acordo com nossa documentação, nossa política de reembolso permite..."

### Teste Manual da API

```bash
curl -X POST "https://controliaa.vercel.app/api/rag/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-company-id: <company_id>" \
  -d '{
    "query": "política de reembolso",
    "limit": 5,
    "similarity_threshold": 0.7
  }'
```

## 📊 Estrutura de Dados

### Tabela `document_chunks`

```sql
- id: UUID
- company_id: UUID
- file_id: UUID (referência a files)
- content: TEXT (texto do chunk)
- content_embedding: vector(1536) (embedding OpenAI)
- chunk_index: INTEGER
- file_name: VARCHAR(255)
- file_type: VARCHAR(50)
- file_category: VARCHAR(100)
- file_tags: TEXT[]
- is_indexed: BOOLEAN
```

### Resposta da API

```json
{
  "data": [
    {
      "id": "uuid",
      "file_id": "uuid",
      "content": "Texto do chunk...",
      "file_name": "Política de Reembolso.pdf",
      "file_type": "document",
      "file_category": "Políticas",
      "file_tags": ["reembolso", "política"],
      "chunk_index": 0,
      "similarity": 0.85,
      "metadata": { ... }
    }
  ],
  "grouped_by_file": [...],
  "summary": {
    "total_results": 5,
    "average_similarity": 0.82,
    "files_found": 2
  }
}
```

## ⚙️ Parâmetros de Busca

### `similarity_threshold`

- **Padrão**: 0.7
- **Range**: 0.0 - 1.0
- **Descrição**: Score mínimo de similaridade para retornar um resultado
- **Recomendações**:
  - 0.7-0.8: Resultados muito relevantes (mais restritivo)
  - 0.6-0.7: Resultados relevantes (padrão)
  - 0.5-0.6: Resultados menos relevantes (mais permissivo)

### `limit`

- **Padrão**: 5
- **Máximo**: 10
- **Descrição**: Número máximo de resultados a retornar

## 🚀 Melhorias Futuras

1. **Indexação Automática**: Processar documentos automaticamente ao fazer upload
2. **Cache de Embeddings**: Cachear embeddings de queries frequentes
3. **Re-ranking**: Reordenar resultados usando modelo de re-ranking
4. **Filtros Avançados**: Filtrar por data, autor, tipo de documento
5. **Métricas**: Tracking de queries e resultados mais úteis
6. **Fine-tuning**: Ajustar embeddings para domínio específico

## 🐛 Troubleshooting

### "Nenhum resultado encontrado"

- Verifique se há documentos indexados (`is_indexed = true`)
- Reduza o `similarity_threshold` (ex: 0.5)
- Verifique se os documentos estão marcados como `is_knowledge_base = true`

### "Erro ao gerar embedding"

- Verifique se `OPENAI_API_KEY` está configurada
- Verifique se há créditos na conta OpenAI
- Verifique logs do servidor para mais detalhes

### "Erro ao buscar chunks similares"

- Verifique se a função `search_similar_chunks` existe no Supabase
- Verifique se o índice HNSW foi criado
- Verifique logs do Supabase

## 📚 Referências

- [Supabase Vector Store](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

