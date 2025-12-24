import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { listAIPrompts } from '@/app/actions/ai-prompts'

export default async function AIPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  // Buscar estatísticas rápidas
  const { data: prompts } = await listAIPrompts({})
  const activePrompts = prompts?.filter((p) => p.is_active) || []
  const defaultPrompts = prompts?.filter((p) => p.is_default) || []

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'IA' }]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inteligência Artificial</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie prompts, monitore decisões da IA e configure automações inteligentes
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-purple-100 dark:bg-purple-900/30 p-3">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Prompts</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{prompts?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 dark:bg-green-900/30 p-3">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Prompts Ativos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{activePrompts.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-100 dark:bg-blue-900/30 p-3">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Prompts Padrão</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{defaultPrompts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Prompts */}
          <Link
            href="/ai/prompts"
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
                    <svg
                      className="h-6 w-6 text-purple-600 dark:text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompts de IA</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Crie e gerencie prompts versionados para inteligência artificial
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  Gerenciar prompts
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Logs */}
          <Link
            href="/ai/logs"
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
                    <svg
                      className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Logs de IA</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Visualize todas as decisões e ações tomadas pela inteligência artificial
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Ver logs
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8 rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ai/prompts/new"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              + Criar Novo Prompt
            </Link>
            <Link
              href="/ai/prompts"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Ver Todos os Prompts
            </Link>
            <Link
              href="/ai/logs"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Ver Logs de IA
            </Link>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

