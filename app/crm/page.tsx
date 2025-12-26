import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import Link from 'next/link'

export default async function CRMPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'CRM' }]} />
        </div>
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">CRM</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            Gerencie pipelines, visualize contatos em Kanban e configure campos personalizados
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
          {/* Card Kanban */}
          <Link
            href="/crm/kanban"
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-4 md:p-6 shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl hover:-translate-y-1 min-h-[44px] md:min-h-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kanban</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Visualize e gerencie contatos organizados por estágios do pipeline em formato Kanban
                </p>
              </div>
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card Pipelines */}
          <Link
            href="/crm/pipelines"
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-4 md:p-6 shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl hover:-translate-y-1 min-h-[44px] md:min-h-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pipelines</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Configure e gerencie pipelines de vendas com estágios personalizados
                </p>
              </div>
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card Campos Personalizados */}
          <Link
            href="/contacts/custom-fields"
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-4 md:p-6 shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl hover:-translate-y-1 min-h-[44px] md:min-h-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Campos Personalizados</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Crie e gerencie campos personalizados para seus contatos
                </p>
              </div>
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  )
}
