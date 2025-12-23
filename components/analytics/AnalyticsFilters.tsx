'use client'

interface AnalyticsFiltersProps {
  filters: {
    dateRange: string
    status: string
    channel: string
  }
  onFiltersChange: (filters: { dateRange: string; status: string; channel: string }) => void
}

export function AnalyticsFilters({ filters, onFiltersChange }: AnalyticsFiltersProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
            Período
          </label>
          <select
            id="dateRange"
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
            <option value="all">Todo o período</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          >
            <option value="all">Todos</option>
            <option value="open">Abertas</option>
            <option value="closed">Fechadas</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
            Canal
          </label>
          <select
            id="channel"
            value={filters.channel}
            onChange={(e) => onFiltersChange({ ...filters, channel: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          >
            <option value="all">Todos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="chat">Chat</option>
          </select>
        </div>
      </div>
    </div>
  )
}

