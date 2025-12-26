import { listKnowledgeBaseFiles } from '@/app/actions/files'
import ProtectedLayout from '@/app/layout-protected'
import Link from 'next/link'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const params = await searchParams
  const { data: files } = await listKnowledgeBaseFiles({
    search: params.search,
    category: params.category,
  })

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'Base de Conhecimento' }]} />
        </div>
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Base de Conhecimento</h1>
            <p className="mt-1 md:mt-2 text-sm text-gray-600 dark:text-gray-400">
              Gerencie documentos que servirão como base de conhecimento para a IA
            </p>
          </div>
          <Link
            href="/documents/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0 w-full sm:w-auto flex items-center justify-center"
          >
            + Novo Documento
          </Link>
        </div>

        <DocumentsList files={files || []} />
      </div>
    </ProtectedLayout>
  )
}

