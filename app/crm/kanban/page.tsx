import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { listPipelines } from '@/app/actions/pipelines'
import { KanbanView } from '@/components/crm/KanbanView'

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline_id?: string }>
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const params = await searchParams
  const { data: pipelines } = await listPipelines()
  const selectedPipelineId = params.pipeline_id || pipelines?.find((p: any) => p.is_default)?.id

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Kanban</h1>
          <p className="mt-1 md:mt-2 text-sm text-gray-600 dark:text-gray-400">
            Visualize e gerencie contatos organizados por estágios do pipeline
          </p>
        </div>

        <KanbanView pipelines={pipelines || []} selectedPipelineId={selectedPipelineId} />
      </div>
    </ProtectedLayout>
  )
}

