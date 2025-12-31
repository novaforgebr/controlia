# 🚀 Quick Start - RAG (Retrieval Augmented Generation)

Guia rápido para implementar busca vetorial na base de conhecimento.

## ✅ Passos de Instalação

### 1. Executar Schema SQL

Execute o arquivo `supabase/vector-store-schema.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase/vector-store-schema.sql`
4. Execute o script

Isso criará:
- Tabela `document_chunks`
- Índices HNSW para busca vetorial otimizada
- Função `search_similar_chunks`
- Políticas RLS

### 2. Verificar Variáveis de Ambiente

Certifique-se de que `OPENAI_API_KEY` está configurada:

```env
OPENAI_API_KEY=sk-...
```

### 3. Adicionar Tool no n8n

1. Abra o workflow do n8n
2. Adicione um novo nó do tipo **HTTP Request Tool**
3. Configure conforme o arquivo `n8n/tool-rag-search.json`
4. Ou copie manualmente:

**Configuração**:
- **Nome**: `Busca Base de Conhecimento`
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

**Tool Description** (cole no campo "Tool Description"):
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

### 4. Atualizar Prompt do AI Agent

Adicione a seção sobre RAG ao prompt do "AI Agent - Respostas". Veja `docs/PROMPTS_IA_COMPLETOS.md` para o prompt completo atualizado.

## 📝 Próximos Passos

### Indexar Documentos Existentes

Para que os documentos sejam pesquisáveis, eles precisam ser processados:

1. **Extrair texto** dos arquivos (PDF, DOCX, TXT, etc.)
2. **Dividir em chunks** (pedaços de ~500-1000 tokens)
3. **Gerar embeddings** usando OpenAI
4. **Armazenar** na tabela `document_chunks`

**Nota**: A indexação automática será implementada em uma próxima versão. Por enquanto, é necessário processar manualmente ou criar um script de indexação.

### Exemplo de Query de Teste

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

## 🎯 Como Funciona

1. Cliente faz pergunta → Agente identifica necessidade de buscar na base de conhecimento
2. Tool "Busca Base de Conhecimento" é chamada → API gera embedding da query
3. Busca chunks similares no Supabase → Retorna informações relevantes
4. Agente usa informações → Responde ao cliente com base na documentação

## 📚 Documentação Completa

Veja `docs/RAG_IMPLEMENTATION.md` para documentação detalhada.

