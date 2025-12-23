import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { CRMDashboard } from '@/components/crm/CRMDashboard'

export default async function CRMPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie contatos, conversas, pipelines e campos personalizados
          </p>
        </div>

        <CRMDashboard />
      </div>
    </ProtectedLayout>
  )
}

