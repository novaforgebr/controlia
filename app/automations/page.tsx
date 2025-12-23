import { listAutomations } from '@/app/actions/automations'
import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import { format } from 'date-fns'
import { ToggleAutomationButton, PauseAutomationButton } from '@/components/automations/AutomationButtons'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function AutomationsPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const { data: automations } = await listAutomations()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Automações' }]} />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automações</h1>
            <p className="mt-2 text-gray-600">Gerencie workflows e integrações com n8n</p>
          </div>
          <Link
            href="/automations/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            + Nova Automação
          </Link>
        </div>

        {/* Lista de automações */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {automations.length === 0 ? (
            <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma automação encontrada</h3>
              <p className="mt-2 text-gray-600">Comece criando sua primeira automação</p>
            </div>
          ) : (
            automations.map((automation: any) => (
              <div
                key={automation.id}
                className="rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                      {automation.is_active ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-green-400" />
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" />
                      )}
                      {automation.is_paused && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pausada
                        </span>
                      )}
                    </div>
                    {automation.description && (
                      <p className="mt-2 text-sm text-gray-600">{automation.description}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Evento:</span>{' '}
                        <span className="text-gray-600">{automation.trigger_event}</span>
                      </div>
                      {automation.last_executed_at && (
                        <div className="text-xs text-gray-500">
                          Última execução: {format(new Date(automation.last_executed_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Execuções: {automation.execution_count || 0}</span>
                        {automation.error_count > 0 && (
                          <span className="text-red-600">Erros: {automation.error_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <ToggleAutomationButton
                      automationId={automation.id}
                      isActive={automation.is_active}
                    />
                    {automation.is_active && (
                      <PauseAutomationButton
                        automationId={automation.id}
                        isPaused={automation.is_paused}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

