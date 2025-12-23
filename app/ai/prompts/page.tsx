import { listAIPrompts } from '@/app/actions/ai-prompts'
import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function AIPromptsPage({
  searchParams,
}: {
  searchParams: { context_type?: string; channel?: string; active?: string }
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const { data: prompts } = await listAIPrompts({
    context_type: searchParams.context_type,
    channel: searchParams.channel,
    is_active: searchParams.active === 'true' ? true : searchParams.active === 'false' ? false : undefined,
  })

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'IA', href: '/ai' },
            { label: 'Prompts' },
          ]}
        />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prompts de IA</h1>
            <p className="mt-2 text-gray-600">Gerencie e versionize os prompts de inteligência artificial</p>
          </div>
          <Link
            href="/ai/prompts/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            + Novo Prompt
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form method="get" className="flex gap-4">
            <select
              name="context_type"
              defaultValue={searchParams.context_type || ''}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos os contextos</option>
              <option value="conversation">Conversa</option>
              <option value="contact">Contato</option>
              <option value="general">Geral</option>
            </select>
            <select
              name="channel"
              defaultValue={searchParams.channel || ''}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos os canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
            </select>
            <select
              name="active"
              defaultValue={searchParams.active || ''}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Lista de prompts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {prompts.length === 0 ? (
            <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum prompt encontrado</h3>
              <p className="mt-2 text-gray-600">Comece criando seu primeiro prompt de IA</p>
              <Link
                href="/ai/prompts/new"
                className="mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-white hover:shadow-lg"
              >
                Criar Primeiro Prompt
              </Link>
            </div>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                      {prompt.is_default && (
                        <span className="rounded-full bg-[#039155] px-2 py-0.5 text-xs font-medium text-white">
                          Padrão
                        </span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{prompt.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {prompt.context_type && (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {prompt.context_type}
                        </span>
                      )}
                      {prompt.channel && (
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                          {prompt.channel}
                        </span>
                      )}
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                        v{prompt.version}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {prompt.is_active ? (
                      <span className="inline-flex h-2 w-2 rounded-full bg-green-400" />
                    ) : (
                      <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500">
                    Modelo: {prompt.model}
                  </div>
                  <Link
                    href={`/ai/prompts/${prompt.id}`}
                    className="text-sm font-semibold text-[#039155] hover:text-[#18B0BB] transition-colors"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

