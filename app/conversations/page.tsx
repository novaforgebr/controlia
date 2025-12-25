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
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex-col">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'Conversas' }]} />
        </div>
        <div className="mb-2 md:mb-4 flex items-center justify-between flex-shrink-0 px-4 md:px-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Conversas</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-green-800 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                </span>
                <span className="hidden sm:inline">Tempo Real</span>
              </span>
            </div>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden md:block">Todas as conversas em tempo real</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
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
