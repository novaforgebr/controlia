import { getCurrentCompany } from '@/lib/utils/company'
import { createClient } from '@/lib/supabase/server'
import ProtectedLayout from '@/app/layout-protected'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function SettingsPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const supabase = await createClient()

  // Buscar configurações da empresa
  const { data: companySettings } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', company.id)
    .single()

  // Buscar automações para mostrar webhooks do n8n
  const { data: automations } = await supabase
    .from('automations')
    .select('id, name, n8n_webhook_url, n8n_workflow_id, is_active')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const settings = companySettings?.settings || {}

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'Configurações' }]} />
        </div>
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Gerencie as configurações da sua empresa e integrações</p>
        </div>

        <SettingsTabs
          company={company}
          settings={settings}
          automations={automations || []}
        />
      </div>
    </ProtectedLayout>
  )
}

