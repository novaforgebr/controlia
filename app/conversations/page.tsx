import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { ConversationsSplitView } from '@/components/conversations/ConversationsSplitView'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: { id?: string; status?: string; channel?: string }
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  return (
    <ProtectedLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <Breadcrumb items={[{ label: 'Conversas' }]} />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Conversas</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                Tempo Real
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Todas as conversas em tempo real</p>
          </div>
        </div>

        <ConversationsSplitView
          selectedConversationId={searchParams.id}
          initialStatus={searchParams.status}
          initialChannel={searchParams.channel}
        />
      </div>
    </ProtectedLayout>
  )
}
