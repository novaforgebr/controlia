import { getCurrentCompany } from '@/lib/utils/company'
import { createClient } from '@/lib/supabase/server'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function DashboardPage() {
  const company = await getCurrentCompany()
  const supabase = await createClient()

  if (!company) {
    return null
  }

  // Buscar estatísticas básicas
  const [contactsCount, conversationsCount, messagesCount] = await Promise.all([
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'open'),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Últimas 24h
  ])

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Dashboard' }]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Visão geral da sua empresa</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
            <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-[#039155]/10 to-[#18B0BB]/10 rounded-bl-full"></div>
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Contatos</h3>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-[#039155] to-[#18B0BB] bg-clip-text text-transparent">
                {contactsCount.count || 0}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
            <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversas Abertas</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {conversationsCount.count || 0}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
            <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full"></div>
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensagens (24h)</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {messagesCount.count || 0}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
            <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-bl-full"></div>
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{company.name}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-xl bg-gradient-to-r from-[#039155]/5 to-[#18B0BB]/5 border border-[#039155]/20 p-8 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Bem-vindo ao Controlia CRM</h2>
                <p className="mt-2 text-gray-600">
                  Sua plataforma está configurada e pronta para uso. Comece criando contatos e
                  configurando suas automações para potencializar seus resultados.
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href="/contacts/new"
                    className="inline-flex items-center rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Criar Contato
                  </a>
                  <a
                    href="/automations"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Ver Automações
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

