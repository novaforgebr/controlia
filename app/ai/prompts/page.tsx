import { listAIPrompts } from '@/app/actions/ai-prompts'
import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PromptCard } from '@/components/ai/PromptCard'

export default async function AIPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ context_type?: string; channel?: string; active?: string }>
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const params = await searchParams
  const { data: prompts } = await listAIPrompts({
    context_type: params.context_type,
    channel: params.channel,
    is_active: params.active === 'true' ? true : params.active === 'false' ? false : undefined,
  })

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb
            items={[
              { label: 'IA', href: '/ai' },
              { label: 'Prompts' },
            ]}
          />
        </div>
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Prompts de IA</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Gerencie e versionize os prompts de inteligência artificial</p>
          </div>
          <Link
            href="/ai/prompts/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0 w-full sm:w-auto flex items-center justify-center"
          >
            + Novo Prompt
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-4 md:mb-6 rounded-lg bg-white dark:bg-gray-900 p-3 md:p-4 shadow dark:shadow-gray-900/50">
          <form method="get" className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <select
              name="context_type"
              defaultValue={params.context_type || ''}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
            >
              <option value="">Todos os contextos</option>
              <option value="conversation">Conversa</option>
              <option value="contact">Contato</option>
              <option value="general">Geral</option>
            </select>
            <select
              name="channel"
              defaultValue={params.channel || ''}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
            >
              <option value="">Todos os canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
            </select>
            <select
              name="active"
              defaultValue={params.active || ''}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-700 dark:bg-gray-600 px-4 py-2.5 md:py-2 text-base md:text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors min-h-[44px] md:min-h-0 w-full sm:w-auto"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Lista de prompts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {prompts.length === 0 ? (
            <div className="col-span-full rounded-lg bg-white dark:bg-gray-900 p-12 text-center shadow dark:shadow-gray-900/50">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum prompt encontrado</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Comece criando seu primeiro prompt de IA</p>
              <Link
                href="/ai/prompts/new"
                className="mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-white hover:shadow-lg transition-all"
              >
                Criar Primeiro Prompt
              </Link>
            </div>
          ) : (
            prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

