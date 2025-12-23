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

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Relatório Detalhado</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Conversas por Status */}
            {Object.entries(statusCounts).map(([status, count]) => (
              <tr key={`status-${status}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Conversas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {totalConversations > 0 ? `${((count / totalConversations) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {/* Contatos por Status */}
            {Object.entries(contactStatusCounts).map(([status, count]) => (
              <tr key={`contact-${status}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Contatos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {totalContacts > 0 ? `${((count / totalContacts) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {/* Conversas por Canal */}
            {Object.entries(channelCounts).map(([channel, count]) => (
              <tr key={`channel-${channel}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Canal</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{channel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {totalChannels > 0 ? `${((count / totalChannels) * 100).toFixed(1)}%` : '0%'}
                </td>
              </tr>
            ))}

            {Object.keys(statusCounts).length === 0 &&
              Object.keys(contactStatusCounts).length === 0 &&
              Object.keys(channelCounts).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
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

