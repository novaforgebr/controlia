import { listPipelines } from '@/app/actions/pipelines'
import ProtectedLayout from '@/app/layout-protected'
import Link from 'next/link'
import { PipelineList } from '@/components/crm/PipelineList'

export default async function PipelinesPage() {
  const { data: pipelines } = await listPipelines()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href="/crm"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors"
            >
              ← Voltar para CRM
            </Link>
            <h1 className="mt-2 text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Pipelines</h1>
            <p className="mt-1 md:mt-2 text-sm text-gray-600 dark:text-gray-400">Configure e gerencie seus pipelines de vendas</p>
          </div>
          <Link
            href="/crm/pipelines/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0 w-full sm:w-auto flex items-center justify-center"
          >
            + Novo Pipeline
          </Link>
        </div>

        <PipelineList pipelines={pipelines || []} />
      </div>
    </ProtectedLayout>
  )
}

