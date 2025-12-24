'use client'

interface ChartsSectionProps {
  statusCounts: Record<string, number>
  contactStatusCounts: Record<string, number>
  channelCounts: Record<string, number>
  messagesChartData: Array<{ date: string; count: number }>
  aiActionsCount: Record<string, number>
}

export function ChartsSection({
  statusCounts,
  contactStatusCounts,
  channelCounts,
  messagesChartData,
  aiActionsCount,
}: ChartsSectionProps) {
  // Calcular altura máxima para gráficos de barras
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1)
  const maxContactCount = Math.max(...Object.values(contactStatusCounts), 1)
  const maxChannelCount = Math.max(...Object.values(channelCounts), 1)
  const maxMessagesCount = Math.max(...messagesChartData.map((d) => d.count), 1)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Conversas por Status */}
      <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversas por Status</h3>
        <div className="space-y-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#039155] to-[#18B0BB] rounded-full transition-all"
                  style={{ width: `${(count / maxStatusCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(statusCounts).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Contatos por Status */}
      <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contatos por Status</h3>
        <div className="space-y-3">
          {Object.entries(contactStatusCounts).map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${(count / maxContactCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(contactStatusCounts).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Conversas por Canal */}
      <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversas por Canal</h3>
        <div className="space-y-3">
          {Object.entries(channelCounts).map(([channel, count]) => (
            <div key={channel}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{channel}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${(count / maxChannelCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(channelCounts).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Mensagens ao Longo do Tempo */}
      <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mensagens (Últimos 30 dias)</h3>
        <div className="flex items-end justify-between h-48 gap-1">
          {messagesChartData.length > 0 ? (
            messagesChartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#039155] to-[#18B0BB] rounded-t transition-all hover:opacity-80"
                  style={{ height: `${(data.count / maxMessagesCount) * 100}%` }}
                  title={`${data.date}: ${data.count} mensagens`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center w-full py-4">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Ações da IA */}
      {Object.keys(aiActionsCount).length > 0 && (
        <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ações da IA</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(aiActionsCount).map(([action, count]) => (
              <div key={action} className="rounded-lg bg-gradient-to-br from-[#039155]/10 to-[#18B0BB]/10 dark:from-[#039155]/20 dark:to-[#18B0BB]/20 p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">{action.replace('_', ' ')}</p>
                <p className="mt-2 text-2xl font-bold text-[#039155] dark:text-[#18B0BB]">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

