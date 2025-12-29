import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { ConversationsSplitView } from '@/components/conversations/ConversationsSplitView'

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
