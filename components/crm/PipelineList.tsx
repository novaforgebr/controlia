import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PipelineActions } from './PipelineActions'

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  pipeline_stages: Array<{
    id: string
    name: string
    color: string
    display_order: number
  }>
}

interface PipelineListProps {
  pipelines: Pipeline[]
}

export function PipelineList({ pipelines }: PipelineListProps) {
  if (pipelines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 md:p-12 text-center shadow dark:shadow-gray-900/50">
        <svg
          className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-4 text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum pipeline encontrado</h3>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Crie seu primeiro pipeline para organizar seus contatos</p>
        <Link
          href="/crm/pipelines/new"
          className="mt-4 md:mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0"
        >
          Criar Primeiro Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {pipelines.map((pipeline) => (
        <div key={pipeline.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6 shadow dark:shadow-gray-900/50">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{pipeline.name}</h3>
                {pipeline.is_default && (
                  <span className="inline-flex rounded-full bg-[#039155] px-2 py-1 text-xs font-medium text-white">
                    Padrão
                  </span>
                )}
              </div>
              {pipeline.description && (
                <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-gray-400 break-words">{pipeline.description}</p>
              )}
              <div className="mt-3 md:mt-4">
                <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Estágios ({pipeline.pipeline_stages.length}):</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pipeline.pipeline_stages
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((stage) => (
                      <span
                        key={stage.id}
                        className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.name}
                      </span>
                    ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Criado em {format(new Date(pipeline.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="ml-4 flex gap-2">
              <Link
                href={`/crm/pipelines/${pipeline.id}/edit`}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Editar
              </Link>
              <PipelineActions pipelineId={pipeline.id} isDefault={pipeline.is_default} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

