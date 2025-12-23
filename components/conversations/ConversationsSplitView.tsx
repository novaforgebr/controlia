'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ConversationStatus } from '@/lib/types/database'
import { ConversationDetailView } from './ConversationDetailView'

interface Conversation {
  id: string
  subject: string | null
  status: string
  channel: string
  priority: string
  ai_assistant_enabled: boolean
  last_message_at: string
  created_at: string
  contact_id: string
  contacts: {
    name: string
    whatsapp: string | null
    email: string | null
  } | null
  assigned_to: string | null
  user_profiles: {
    full_name: string
  } | null
}

interface ConversationsSplitViewProps {
  selectedConversationId?: string
  initialStatus?: string
  initialChannel?: string
}

export function ConversationsSplitView({
  selectedConversationId,
  initialStatus,
  initialChannel,
}: ConversationsSplitViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all')
  const [channelFilter, setChannelFilter] = useState(initialChannel || 'all')
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedConversationId)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: companyUser } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (!companyUser) return

        setCompanyId(companyUser.company_id)

        let query = supabase
          .from('conversations')
          .select(`
            id,
            subject,
            status,
            channel,
            priority,
            ai_assistant_enabled,
            last_message_at,
            created_at,
            contact_id,
            assigned_to,
            contacts:contact_id (
              name,
              whatsapp,
              email
            ),
            user_profiles:assigned_to (
              full_name
            )
          `)
          .eq('company_id', companyUser.company_id)

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (channelFilter !== 'all') {
          query = query.eq('channel', channelFilter)
        }

        const { data: initialConversations, error } = await query
          .order('last_message_at', { ascending: false })
          .limit(200)

        if (error) {
          console.error('Erro ao carregar conversas:', error)
          return
        }

        setConversations(initialConversations || [])
        setLoading(false)
      } catch (error) {
        console.error('Erro:', error)
        setLoading(false)
      }
    }

    loadInitialData()
  }, [supabase, statusFilter, channelFilter])

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('conversations-split')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data: updatedConversation } = await supabase
              .from('conversations')
              .select(`
                id,
                subject,
                status,
                channel,
                priority,
                ai_assistant_enabled,
                last_message_at,
                created_at,
                contact_id,
                assigned_to,
                contacts:contact_id (
                  name,
                  whatsapp,
                  email
                ),
                user_profiles:assigned_to (
                  full_name
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (updatedConversation) {
              setConversations((prev) => {
                const filtered = prev.filter((c) => {
                  if (statusFilter !== 'all' && updatedConversation.status !== statusFilter) {
                    return c.id !== updatedConversation.id
                  }
                  if (channelFilter !== 'all' && updatedConversation.channel !== channelFilter) {
                    return c.id !== updatedConversation.id
                  }
                  return true
                })

                const existingIndex = filtered.findIndex((c) => c.id === updatedConversation.id)
                if (existingIndex >= 0) {
                  const newList = [...filtered]
                  newList[existingIndex] = updatedConversation
                  return newList.sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                } else {
                  if (
                    (statusFilter === 'all' || updatedConversation.status === statusFilter) &&
                    (channelFilter === 'all' || updatedConversation.channel === channelFilter)
                  ) {
                    return [updatedConversation, ...filtered].sort(
                      (a, b) =>
                        new Date(b.last_message_at).getTime() -
                        new Date(a.last_message_at).getTime()
                    )
                  }
                  return filtered
                }
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id))
            if (selectedId === payload.old.id) {
              setSelectedId(undefined)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const conversationId = payload.new.conversation_id
          const { data: conversation } = await supabase
            .from('conversations')
            .select(`
              id,
              subject,
              status,
              channel,
              priority,
              ai_assistant_enabled,
              last_message_at,
              created_at,
              contact_id,
              assigned_to,
              contacts:contact_id (
                name,
                whatsapp,
                email
              ),
              user_profiles:assigned_to (
                full_name
              )
            `)
            .eq('id', conversationId)
            .single()

          if (conversation) {
            if (
              (statusFilter === 'all' || conversation.status === statusFilter) &&
              (channelFilter === 'all' || conversation.channel === channelFilter)
            ) {
              setConversations((prev) => {
                const existingIndex = prev.findIndex((c) => c.id === conversation.id)
                if (existingIndex >= 0) {
                  const newList = [...prev]
                  newList[existingIndex] = conversation
                  return newList.sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                } else {
                  return [conversation, ...prev].sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                }
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, supabase, statusFilter, channelFilter, selectedId])

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`/conversations?${params.toString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ConversationStatus.OPEN:
        return 'bg-green-100 text-green-800'
      case ConversationStatus.CLOSED:
        return 'bg-gray-100 text-gray-800'
      case ConversationStatus.WAITING:
        return 'bg-yellow-100 text-yellow-800'
      case ConversationStatus.TRANSFERRED:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case ConversationStatus.OPEN:
        return 'Aberta'
      case ConversationStatus.CLOSED:
        return 'Fechada'
      case ConversationStatus.WAITING:
        return 'Aguardando'
      case ConversationStatus.TRANSFERRED:
        return 'Transferida'
      default:
        return status
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      {/* Lista de conversas - lado esquerdo */}
      <div className="flex w-96 flex-col border-r border-gray-200 bg-white">
        {/* Filtros */}
        <div className="border-b border-gray-200 p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  const params = new URLSearchParams()
                  params.set('status', e.target.value)
                  if (channelFilter !== 'all') params.set('channel', channelFilter)
                  router.push(`/conversations?${params.toString()}`)
                }}
                className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              >
                <option value="all">Todos</option>
                <option value={ConversationStatus.OPEN}>Abertas</option>
                <option value={ConversationStatus.CLOSED}>Fechadas</option>
                <option value={ConversationStatus.WAITING}>Aguardando</option>
                <option value={ConversationStatus.TRANSFERRED}>Transferidas</option>
              </select>
            </div>
            <div>
              <label htmlFor="channel" className="block text-xs font-medium text-gray-700 mb-1">
                Canal
              </label>
              <select
                id="channel"
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value)
                  const params = new URLSearchParams()
                  if (statusFilter !== 'all') params.set('status', statusFilter)
                  params.set('channel', e.target.value)
                  router.push(`/conversations?${params.toString()}`)
                }}
                className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              >
                <option value="all">Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="phone">Telefone</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                    selectedId === conversation.id ? 'bg-gradient-to-r from-[#039155]/10 to-[#18B0BB]/10 border-r-2 border-[#039155]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.contacts?.name || 'Sem nome'}
                        </h3>
                        {conversation.status === ConversationStatus.OPEN && (
                          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          </span>
                        )}
                      </div>
                      {conversation.subject && (
                        <p className="text-xs text-gray-600 truncate mb-2">{conversation.subject}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(conversation.status)}`}
                        >
                          {getStatusLabel(conversation.status)}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{conversation.channel}</span>
                        {conversation.ai_assistant_enabled && (
                          <span className="text-xs">🤖</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conversation.last_message_at), 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visualização da conversa - lado direito */}
      <div className="flex-1 overflow-hidden">
        {selectedConversation ? (
          <ConversationDetailView
            conversation={selectedConversation}
            onClose={() => {
              setSelectedId(undefined)
              const params = new URLSearchParams(searchParams.toString())
              params.delete('id')
              router.push(`/conversations?${params.toString()}`)
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <div className="text-center">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Selecione uma conversa</h3>
              <p className="mt-2 text-sm text-gray-600">Clique em uma conversa na lista para visualizá-la</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

