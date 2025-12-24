# Como Criar o Bucket "files" no Supabase Storage

## Método 1: Via SQL (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/create-files-bucket.sql`
4. Execute o script
5. Verifique se o bucket foi criado: vá em **Storage** e confirme que o bucket "files" aparece

## Método 2: Manual pelo Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá em **Storage**
3. Clique em **"New bucket"**
4. Configure:
   - **Nome**: `files`
   - **Público**: Não (desmarcado)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: Deixe vazio (para permitir todos os tipos)
5. Clique em **"Create bucket"**

## Verificação

Após criar o bucket, você pode verificar se foi criado corretamente:

```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'files';
```

## Políticas RLS

Após criar o bucket, execute o script `supabase/create-files-bucket.sql` para configurar as políticas RLS que garantem:
- Usuários só podem acessar arquivos de suas empresas
- Isolamento completo de dados por empresa

## Solução de Problemas

### Erro: "Bucket not found"
- Certifique-se de que o bucket foi criado com o nome exato: `files` (minúsculas)
- Verifique se você está no projeto correto do Supabase

### Erro: "Permission denied"
- Verifique se as políticas RLS foram criadas corretamente
- Execute o script completo `supabase/create-files-bucket.sql`

### Erro ao fazer upload
- Verifique se o bucket existe: `SELECT * FROM storage.buckets WHERE name = 'files';`
- Verifique as políticas RLS: `SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';`

