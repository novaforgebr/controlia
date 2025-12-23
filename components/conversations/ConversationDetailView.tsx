'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { CloseConversationButton } from './CloseConversationButton'
import { MessageForm } from './MessageForm'
import { ContactDetailsModal } from './ContactDetailsModal'
import { toggleConversationAI } from '@/app/actions/conversations'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string
  subject: string | null
  status: string
  channel: string
  priority: string
  ai_assistant_enabled: boolean
  last_message_at: string
  contact_id: string
  contacts: {
    name: string
    whatsapp: string | null
    email: string | null
  } | null
}

interface Message {
  id: string
  content: string
  direction: string
  sender_type: string
  created_at: string
  media_url: string | null
  user_profiles: {
    full_name: string | null
  } | null
}

interface ConversationDetailViewProps {
  conversation: Conversation
  onClose?: () => void
}

export function ConversationDetailView({ conversation, onClose }: ConversationDetailViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(conversation.ai_assistant_enabled)
  const [showContactModal, setShowContactModal] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadMessages()
  }, [conversation.id])

  useEffect(() => {
    if (!conversation.id) return

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as any
          // Buscar dados completos da mensagem com relacionamentos
          const { data: fullMessage } = await supabase
            .from('messages')
            .select('*, user_profiles:sender_id(full_name)')
            .eq('id', newMessage.id)
            .single()

          if (fullMessage) {
            setMessages((prev) => [...prev, fullMessage as Message])
            setTimeout(() => scrollToBottom(), 100)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*, user_profiles:sender_id(full_name)')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      setMessages(data || [])
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleMessageSent = () => {
    loadMessages()
  }

  const handleToggleAI = async () => {
    setTogglingAI(true)
    try {
      const result = await toggleConversationAI(conversation.id, !aiEnabled)
      if (result.success) {
        setAiEnabled(!aiEnabled)
        router.refresh()
      } else {
        alert('Erro ao atualizar IA: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atualizar IA:', error)
      alert('Erro ao atualizar IA')
    } finally {
      setTogglingAI(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {conversation.contacts?.name || 'Contato sem nome'}
              </h2>
              {conversation.status === 'open' && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
              )}
            </div>
            {conversation.subject && (
              <p className="mt-1 text-sm text-gray-600 truncate">{conversation.subject}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="capitalize">{conversation.channel}</span>
              <span>•</span>
              <span className="capitalize">{conversation.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Botão Ver Detalhes do Contato */}
            <button
              onClick={() => setShowContactModal(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Ver detalhes do contato"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            {/* Toggle IA */}
            <button
              onClick={handleToggleAI}
              disabled={togglingAI}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                aiEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
              title={aiEnabled ? 'Desativar IA' : 'Ativar IA'}
            >
              {togglingAI ? (
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              ) : (
                <span className="flex items-center gap-1">
                  <span>🤖</span>
                  <span>{aiEnabled ? 'IA Ativa' : 'IA Inativa'}</span>
                </span>
              )}
            </button>
            
            {conversation.status !== 'closed' && (
              <CloseConversationButton conversationId={conversation.id} />
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="mt-1 text-xs">Envie a primeira mensagem abaixo</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
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
                    <span className={`text-xs ${message.direction === 'outbound' ? 'opacity-90' : 'opacity-60'}`}>
                      {format(new Date(message.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {message.media_url && (
                    <div className="mt-2">
                      <a
                        href={message.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs underline ${message.direction === 'outbound' ? 'text-white/90' : 'text-gray-600'}`}
                      >
                        Ver mídia
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Formulário de mensagem */}
      {conversation.status !== 'closed' && (
        <div className="border-t border-gray-200 bg-white p-4">
          <MessageForm
            conversationId={conversation.id}
            contactId={conversation.contact_id}
            onMessageSent={handleMessageSent}
          />
        </div>
      )}

      {/* Modal de detalhes do contato */}
      <ContactDetailsModal
        contactId={conversation.contact_id}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onUpdate={() => {
          // Recarregar mensagens caso o contato tenha sido atualizado
          loadMessages()
        }}
      />
    </div>
  )
}
