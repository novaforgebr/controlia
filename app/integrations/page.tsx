import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { IntegrationsDashboard } from '@/components/integrations/IntegrationsDashboard'

export default async function IntegrationsPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'Integrações' }]} />
        </div>
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Integrações de Canais</h1>
          <p className="mt-1 md:mt-2 text-sm text-gray-600 dark:text-gray-400">
            Conecte seus canais de comunicação (WhatsApp, Telegram) e gerencie suas integrações
          </p>
        </div>

        <IntegrationsDashboard />
      </div>
    </ProtectedLayout>
  )
}

