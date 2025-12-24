import { getFile } from '@/app/actions/files'
import ProtectedLayout from '@/app/layout-protected'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EditDocumentForm } from '@/components/documents/EditDocumentForm'

export default async function EditDocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: file } = await getFile(params.id)

  if (!file) {
    notFound()
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/documents"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors"
          >
            ← Voltar para documentos
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Editar Documento</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Atualize as informações do documento</p>
        </div>

        <EditDocumentForm file={file} />
      </div>
    </ProtectedLayout>
  )
}

