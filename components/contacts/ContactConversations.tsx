import { listConversations } from '@/app/actions/conversations'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContactConversationsProps {
  contactId: string
}

export async function ContactConversations({ contactId }: ContactConversationsProps) {
  const { data: conversations } = await listConversations({
    contact_id: contactId,
    limit: 10,
  })

  if (!conversations || conversations.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-900 p-4 md:p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Conversas</h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Nenhuma conversa encontrada para este contato.</p>
        <Link
          href={`/conversations?contact_id=${contactId}`}
          className="mt-3 md:mt-4 inline-block text-sm md:text-base font-medium text-[#039155] dark:text-[#18B0BB] hover:text-[#18B0BB] dark:hover:text-[#039155] transition-colors min-h-[44px] md:min-h-0 flex items-center"
        >
          Ver todas as conversas →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-4 md:p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      <div className="mb-3 md:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Conversas</h2>
        <Link
          href={`/conversations?contact_id=${contactId}`}
          className="text-sm md:text-base font-medium text-[#039155] dark:text-[#18B0BB] hover:text-[#18B0BB] dark:hover:text-[#039155] transition-colors min-h-[44px] md:min-h-0 flex items-center"
        >
          Ver todas →
        </Link>
      </div>
      <div className="space-y-2 md:space-y-3">
        {conversations.map((conversation: any) => (
          <Link
            key={conversation.id}
            href={`/conversations?id=${conversation.id}`}
            className="block rounded-md border border-gray-200 dark:border-gray-700 p-3 md:p-4 hover:border-[#039155] dark:hover:border-[#18B0BB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] md:min-h-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {conversation.subject || 'Conversa sem assunto'}
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${
                      conversation.status === 'open'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : conversation.status === 'closed'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    }`}
                  >
                    {conversation.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{conversation.channel}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="break-words">
                    {format(new Date(conversation.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

