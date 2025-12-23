import ProtectedLayout from '@/app/layout-protected'
import Link from 'next/link'
import { NewDocumentForm } from '@/components/documents/NewDocumentForm'

export default function NewDocumentPage() {
  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/documents"
            className="text-sm font-medium text-gray-600 hover:text-[#039155] transition-colors"
          >
            ← Voltar para documentos
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Novo Documento</h1>
          <p className="mt-2 text-sm text-gray-600">Adicione um documento à base de conhecimento</p>
        </div>

        <NewDocumentForm />
      </div>
    </ProtectedLayout>
  )
}

