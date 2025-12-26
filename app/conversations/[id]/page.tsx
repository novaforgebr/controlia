import { getConversation } from '@/app/actions/conversations'
import { listMessages } from '@/app/actions/messages'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MessageForm } from '@/components/conversations/MessageForm'
import { CloseConversationButton } from '@/components/conversations/CloseConversationButton'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const conversation = await getConversation(id)

  if (!conversation) {
    notFound()
  }

  const { data: messages } = await listMessages(id)

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb
            items={[
              { label: 'Conversas', href: '/conversations' },
              { label: conversation.subject || 'Conversa sem assunto' },
            ]}
          />
        </div>
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="mt-2 text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {conversation.subject || 'Conversa sem assunto'}
            </h1>
            <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 capitalize">
              Canal: {conversation.channel} • Status: {conversation.status}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {conversation.status !== 'closed' && (
              <CloseConversationButton conversationId={conversation.id} />
            )}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="mb-4 md:mb-6 rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50">
          <div className="max-h-[400px] md:max-h-[600px] overflow-y-auto p-4 md:p-6">
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 md:px-4 ${
                        message.direction === 'outbound'
                          ? 'bg-gradient-to-r from-[#039155] to-[#18B0BB] text-white'
                          : message.sender_type === 'ai'
                          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100'
                          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {message.sender_type === 'ai' && (
                          <span className="text-xs font-semibold">🤖 IA</span>
                        )}
                        {message.sender_type === 'human' && message.user_profiles && (
                          <span className="text-xs font-semibold truncate max-w-[120px]">
                            {message.user_profiles.full_name || 'Usuário'}
                          </span>
                        )}
                        <span className="text-xs opacity-75">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                      {message.media_url && (
                        <div className="mt-2">
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                          >
                            Ver mídia
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p>Nenhuma mensagem ainda.</p>
                <p className="mt-2 text-sm">Envie a primeira mensagem abaixo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulário de nova mensagem */}
        {conversation.status !== 'closed' && (
          <MessageForm conversationId={conversation.id} contactId={conversation.contact_id} />
        )}
      </div>
    </ProtectedLayout>
  )
}

