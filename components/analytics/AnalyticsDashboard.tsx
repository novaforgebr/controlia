'use client'

import { useState } from 'react'
import { AnalyticsFilters } from './AnalyticsFilters'
import { StatsCards } from './StatsCards'
import { ChartsSection } from './ChartsSection'
import { ReportsTable } from './ReportsTable'

interface AnalyticsDashboardProps {
  totalContacts: number
  totalConversations: number
  totalMessages: number
  activeConversations: number
  statusCounts: Record<string, number>
  contactStatusCounts: Record<string, number>
  channelCounts: Record<string, number>
  messagesChartData: Array<{ date: string; count: number }>
  aiMessagesCount: number
  aiActionsCount: Record<string, number>
}

export function AnalyticsDashboard({
  totalContacts,
  totalConversations,
  totalMessages,
  activeConversations,
  statusCounts,
  contactStatusCounts,
  channelCounts,
  messagesChartData,
  aiMessagesCount,
  aiActionsCount,
}: AnalyticsDashboardProps) {
  const [filters, setFilters] = useState({
    dateRange: '30',
    status: 'all',
    channel: 'all',
  })

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <AnalyticsFilters filters={filters} onFiltersChange={setFilters} />

      {/* Cards de Estatísticas */}
      <StatsCards
        totalContacts={totalContacts}
        totalConversations={totalConversations}
        totalMessages={totalMessages}
        activeConversations={activeConversations}
        aiMessagesCount={aiMessagesCount}
      />

      {/* Gráficos */}
      <ChartsSection
        statusCounts={statusCounts}
        contactStatusCounts={contactStatusCounts}
        channelCounts={channelCounts}
        messagesChartData={messagesChartData}
        aiActionsCount={aiActionsCount}
      />

      {/* Tabela de Relatórios */}
      <ReportsTable
        statusCounts={statusCounts}
        contactStatusCounts={contactStatusCounts}
        channelCounts={channelCounts}
      />
    </div>
  )
}

