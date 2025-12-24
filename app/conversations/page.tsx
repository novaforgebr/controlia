import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { ConversationsSplitView } from '@/components/conversations/ConversationsSplitView'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string; channel?: string }>
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const params = await searchParams

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <Breadcrumb items={[{ label: 'Conversas' }]} />
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Conversas</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                </span>
                Tempo Real
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Todas as conversas em tempo real</p>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ConversationsSplitView
            selectedConversationId={params.id}
            initialStatus={params.status}
            initialChannel={params.channel}
          />
        </div>
      </div>
    </ProtectedLayout>
  )
}
