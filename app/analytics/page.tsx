import { getCurrentCompany } from '@/lib/utils/company'
import { createClient } from '@/lib/supabase/server'
import ProtectedLayout from '@/app/layout-protected'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function AnalyticsPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const supabase = await createClient()

  // Buscar dados para análises
  const [
    { count: totalContacts },
    { count: totalConversations },
    { count: totalMessages },
    { count: activeConversations },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .is('closed_at', null),
  ])

  // Buscar conversas por status
  const { data: conversationsByStatus } = await supabase
    .from('conversations')
    .select('status')
    .eq('company_id', company.id)

  // Buscar contatos por status
  const { data: contactsByStatus } = await supabase
    .from('contacts')
    .select('status')
    .eq('company_id', company.id)

  // Buscar mensagens por período (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: messagesByDay } = await supabase
    .from('messages')
    .select('created_at')
    .eq('company_id', company.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Buscar conversas por canal
  const { data: conversationsByChannel } = await supabase
    .from('conversations')
    .select('channel')
    .eq('company_id', company.id)

  // Buscar mensagens da IA
  const { data: aiMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .eq('sender_type', 'ai')

  // Buscar logs de IA
  const { data: aiLogs } = await supabase
    .from('ai_logs')
    .select('action, created_at')
    .eq('company_id', company.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  // Processar dados
  const statusCounts = conversationsByStatus?.reduce(
    (acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  const contactStatusCounts = contactsByStatus?.reduce(
    (acc, contact) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  const channelCounts = conversationsByChannel?.reduce(
    (acc, conv) => {
      acc[conv.channel] = (acc[conv.channel] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  // Agrupar mensagens por dia
  const messagesByDayMap = new Map<string, number>()
  messagesByDay?.forEach((msg) => {
    const date = new Date(msg.created_at).toISOString().split('T')[0]
    messagesByDayMap.set(date, (messagesByDayMap.get(date) || 0) + 1)
  })

  const messagesChartData = Array.from(messagesByDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Agrupar ações da IA
  const aiActionsCount = aiLogs?.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Analytics' }]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Análises e Relatórios</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Visualize métricas e insights do seu CRM</p>
        </div>

        <AnalyticsDashboard
          totalContacts={totalContacts || 0}
          totalConversations={totalConversations || 0}
          totalMessages={totalMessages || 0}
          activeConversations={activeConversations || 0}
          statusCounts={statusCounts}
          contactStatusCounts={contactStatusCounts}
          channelCounts={channelCounts}
          messagesChartData={messagesChartData}
          aiMessagesCount={aiMessages?.length || 0}
          aiActionsCount={aiActionsCount}
        />
      </div>
    </ProtectedLayout>
  )
}

