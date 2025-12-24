import { getAIPrompt, getPromptVersions } from '@/app/actions/ai-prompts'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { TogglePromptButton } from '@/components/ai/TogglePromptButton'
import { PromptIdDisplay } from '@/components/ai/PromptIdDisplay'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function AIPromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prompt = await getAIPrompt(id)

  if (!prompt) {
    notFound()
  }

  const { data: versions } = await getPromptVersions(id)

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'IA', href: '/ai' },
            { label: 'Prompts', href: '/ai/prompts' },
            { label: prompt.name },
          ]}
        />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{prompt.name}</h1>
            {prompt.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{prompt.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/ai/prompts/${prompt.id}/edit`}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Editar
            </Link>
            <TogglePromptButton promptId={prompt.id} isActive={prompt.is_active} />
          </div>
        </div>

        <div className="space-y-6">
          {/* ID do Prompt */}
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Identificação</h2>
            <PromptIdDisplay promptId={prompt.id} />
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Use este ID no n8n para referenciar este prompt nos seus workflows.
            </p>
          </div>

          {/* Informações principais */}
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Informações</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Contexto</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{prompt.context_type || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Canal</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{prompt.channel || 'Todos'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Modelo</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{prompt.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">v{prompt.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  {prompt.is_active ? (
                    <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-800 dark:text-green-400">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Inativo
                    </span>
                  )}
                </dd>
              </div>
              {prompt.is_default && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Padrão</dt>
                  <dd className="mt-1">
                    <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-800 dark:text-blue-400">
                      Sim
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Texto do prompt */}
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Texto do Prompt</h2>
            <pre className="whitespace-pre-wrap rounded-md bg-gray-50 dark:bg-gray-800 p-4 text-sm font-mono text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
              {prompt.prompt_text}
            </pre>
          </div>

          {/* Histórico de versões */}
          {versions && versions.length > 0 && (
            <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Histórico de Versões</h2>
              <div className="space-y-3">
                {versions.map((version: any) => (
                  <div
                    key={version.id}
                    className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Versão {version.version}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(version.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      {version.id === prompt.id && (
                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-800 dark:text-green-400">
                          Atual
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

