import { listAILogs } from '@/app/actions/ai-logs'
import { getCurrentCompany } from '@/lib/utils/company'
import { format } from 'date-fns'
import ProtectedLayout from '@/app/layout-protected'

export default async function AILogsPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation_id?: string; status?: string; page?: string }>
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { data: logs, count } = await listAILogs({
    conversation_id: params.conversation_id,
    status: params.status,
    limit,
    offset,
  })

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Logs de IA</h1>
          <p className="mt-2 text-gray-600">Acompanhe todas as ações e decisões da inteligência artificial</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form method="get" className="flex gap-4">
            <input
              type="text"
              name="conversation_id"
              placeholder="Ex: UUID da conversa..."
              defaultValue={params.conversation_id}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
            />
            <select
              name="status"
              defaultValue={params.status || ''}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos os status</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
              <option value="pending">Pendente</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Lista de logs */}
        <div className="rounded-lg bg-white shadow">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum log encontrado.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                          </span>
                        </div>
                        {log.prompt_name && (
                          <p className="mt-2 text-sm font-medium text-gray-900">
                            Prompt: {log.prompt_name}
                          </p>
                        )}
                        {log.decision && (
                          <p className="mt-1 text-sm text-gray-600">
                            Decisão: {log.decision}
                          </p>
                        )}
                        {log.error_message && (
                          <p className="mt-1 text-sm text-red-600">
                            Erro: {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      {page > 1 && (
                        <a
                          href={`/ai/logs?page=${page - 1}${params.conversation_id ? `&conversation_id=${params.conversation_id}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
                        </a>
                      )}
                      {page < totalPages && (
                        <a
                          href={`/ai/logs?page=${page + 1}${params.conversation_id ? `&conversation_id=${params.conversation_id}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Próxima
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

