import { getPipeline } from '@/app/actions/pipelines'
import ProtectedLayout from '@/app/layout-protected'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EditPipelineForm } from '@/components/crm/EditPipelineForm'

export default async function EditPipelinePage({
  params,
}: {
  params: { id: string }
}) {
  const { data: pipeline } = await getPipeline(params.id)

  if (!pipeline) {
    notFound()
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/crm/pipelines"
            className="text-sm font-medium text-gray-600 hover:text-[#039155] transition-colors"
          >
            ← Voltar para pipelines
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Editar Pipeline</h1>
          <p className="mt-2 text-sm text-gray-600">Configure estágios e detalhes do pipeline</p>
        </div>

        <EditPipelineForm pipeline={pipeline} />
      </div>
    </ProtectedLayout>
  )
}

