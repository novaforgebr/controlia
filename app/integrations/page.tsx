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
      <div className="flex flex-col">
        <Breadcrumb items={[{ label: 'Integrações' }]} />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integrações de Canais</h1>
            <p className="mt-2 text-sm text-gray-600">
              Conecte seus canais de comunicação (WhatsApp, Telegram) e gerencie suas integrações
            </p>
          </div>
        </div>

        <IntegrationsDashboard />
      </div>
    </ProtectedLayout>
  )
}

