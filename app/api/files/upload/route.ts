import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const is_knowledge_base = formData.get('is_knowledge_base') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Gerar caminho único
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${company.id}/${fileName}`

    // Bucket name
    const bucketName = 'files'
    
    // Não verificar se o bucket existe - tentar fazer upload diretamente
    // Se o bucket não existir, o erro virá no upload e será tratado abaixo

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      
      // Se o erro for de bucket não encontrado
      if (uploadError.message?.includes('Bucket not found') || (uploadError as any).statusCode === '404') {
        return NextResponse.json(
          { error: 'Bucket de armazenamento não configurado' },
          { status: 500 }
        )
      }
      
      // Se o erro for de permissão (RLS)
      if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy') || (uploadError as any).statusCode === '403') {
        return NextResponse.json(
          { error: 'Erro de permissão ao fazer upload. Verifique as políticas RLS do bucket.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro ao fazer upload do arquivo: ${uploadError.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Criar registro no banco
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        company_id: company.id,
        name: name || file.name,
        original_name: file.name,
        storage_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        file_type: 'document',
        is_knowledge_base: is_knowledge_base,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao criar registro:', dbError)
      // Tentar deletar do storage se falhar no banco
      await supabase.storage.from(bucketName).remove([filePath])
      return NextResponse.json({ error: 'Erro ao salvar registro do arquivo' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: fileRecord })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

