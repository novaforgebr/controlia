'use client'

interface ReportsTableProps {
  statusCounts: Record<string, number>
  contactStatusCounts: Record<string, number>
  channelCounts: Record<string, number>
}

export function ReportsTable({ statusCounts, contactStatusCounts, channelCounts }: ReportsTableProps) {
  const totalConversations = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const totalContacts = Object.values(contactStatusCounts).reduce((a, b) => a + b, 0)
  const totalChannels = Object.values(channelCounts).reduce((a, b) => a + b, 0)

  const allData = [
    ...Object.entries(statusCounts).map(([status, count]) => ({
      category: 'Conversas',
      item: status,
      count,
      percentage: totalConversations > 0 ? `${((count / totalConversations) * 100).toFixed(1)}%` : '0%',
    })),
    ...Object.entries(contactStatusCounts).map(([status, count]) => ({
      category: 'Contatos',
      item: status,
      count,
      percentage: totalContacts > 0 ? `${((count / totalContacts) * 100).toFixed(1)}%` : '0%',
    })),
    ...Object.entries(channelCounts).map(([channel, count]) => ({
      category: 'Canal',
      item: channel,
      count,
      percentage: totalChannels > 0 ? `${((count / totalChannels) * 100).toFixed(1)}%` : '0%',
    })),
  ]

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Relatório Detalhado</h3>
      </div>
      
      {/* Mobile: Cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
        {allData.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum dado disponível
          </div>
        ) : (
          allData.map((row, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{row.category}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{row.item}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.percentage}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Percentual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {/* Conversas por Status */}
            {Object.entries(statusCounts).map(([status, count]) => (
              <tr key={`status-${status}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">Conversas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {totalConversations > 0 ? `${((count / totalConversations) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {/* Contatos por Status */}
            {Object.entries(contactStatusCounts).map(([status, count]) => (
              <tr key={`contact-${status}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">Contatos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {totalContacts > 0 ? `${((count / totalContacts) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {/* Conversas por Canal */}
            {Object.entries(channelCounts).map(([channel, count]) => (
              <tr key={`channel-${channel}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">Canal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">{channel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {totalChannels > 0 ? `${((count / totalChannels) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {Object.keys(statusCounts).length === 0 &&
              Object.keys(contactStatusCounts).length === 0 &&
              Object.keys(channelCounts).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum dado disponível
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

