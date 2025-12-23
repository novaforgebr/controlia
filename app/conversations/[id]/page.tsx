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
  params: { id: string }
}) {
  const conversation = await getConversation(params.id)

  if (!conversation) {
    notFound()
  }

  const { data: messages } = await listMessages(params.id)

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Conversas', href: '/conversations' },
            { label: conversation.subject || 'Conversa sem assunto' },
          ]}
        />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {conversation.subject || 'Conversa sem assunto'}
            </h1>
            <p className="mt-1 text-sm text-gray-600 capitalize">
              Canal: {conversation.channel} • Status: {conversation.status}
            </p>
          </div>
          <div className="flex gap-2">
            {conversation.status !== 'closed' && (
              <CloseConversationButton conversationId={conversation.id} />
            )}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="mb-6 rounded-lg bg-white shadow">
          <div className="max-h-[600px] overflow-y-auto p-6">
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
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.direction === 'outbound'
                          ? 'bg-gradient-to-r from-[#039155] to-[#18B0BB] text-white'
                          : message.sender_type === 'ai'
                          ? 'bg-purple-50 border border-purple-200 text-purple-900'
                          : 'bg-gray-50 border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender_type === 'ai' && (
                          <span className="text-xs font-semibold">🤖 IA</span>
                        )}
                        {message.sender_type === 'human' && message.user_profiles && (
                          <span className="text-xs font-semibold">
                            {message.user_profiles.full_name || 'Usuário'}
                          </span>
                        )}
                        <span className="text-xs opacity-75">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

