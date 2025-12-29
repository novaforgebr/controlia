'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ConversationStatus } from '@/lib/types/database'
import { ConversationDetailView } from './ConversationDetailView'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

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
  unread_count?: number // Contagem de mensagens não lidas
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

        // Transformar arrays de relacionamentos em objetos únicos
        const transformedConversations = (initialConversations || []).map((conv: any) => ({
          ...conv,
          contacts: Array.isArray(conv.contacts) ? (conv.contacts[0] || null) : conv.contacts,
          user_profiles: Array.isArray(conv.user_profiles) ? (conv.user_profiles[0] || null) : conv.user_profiles,
          unread_count: 0, // Será atualizado abaixo
        }))

        // Buscar contagem de mensagens não lidas para cada conversa
        const conversationsWithUnread = await Promise.all(
          transformedConversations.map(async (conv) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .in('direction', ['incoming', 'inbound'])
              .is('read_at', null)

            return {
              ...conv,
              unread_count: count || 0,
            }
          })
        )

        setConversations(conversationsWithUnread)
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
              // Transformar arrays de relacionamentos em objetos únicos
              const transformedConversation = {
                ...updatedConversation,
                contacts: Array.isArray(updatedConversation.contacts) 
                  ? (updatedConversation.contacts[0] || null) 
                  : updatedConversation.contacts,
                user_profiles: Array.isArray(updatedConversation.user_profiles) 
                  ? (updatedConversation.user_profiles[0] || null) 
                  : updatedConversation.user_profiles,
              }

              // Buscar contagem de não lidas antes de atualizar o estado
              setConversations((prev) => {
                const filtered = prev.filter((c) => {
                  if (statusFilter !== 'all' && transformedConversation.status !== statusFilter) {
                    return c.id !== transformedConversation.id
                  }
                  if (channelFilter !== 'all' && transformedConversation.channel !== channelFilter) {
                    return c.id !== transformedConversation.id
                  }
                  return true
                })

                const existingIndex = filtered.findIndex((c) => c.id === transformedConversation.id)
                
                // Manter contagem existente ou buscar se necessário
                let unreadCount = 0
                if (existingIndex >= 0) {
                  unreadCount = filtered[existingIndex].unread_count || 0
                } else {
                  // Para novas conversas, buscar contagem de forma assíncrona
                  supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', transformedConversation.id)
                    .in('direction', ['incoming', 'inbound'])
                    .is('read_at', null)
                    .then(({ count }) => {
                      setConversations((currentPrev) => {
                        const currentFiltered = currentPrev.filter((c) => {
                          if (statusFilter !== 'all' && transformedConversation.status !== statusFilter) {
                            return c.id !== transformedConversation.id
                          }
                          if (channelFilter !== 'all' && transformedConversation.channel !== channelFilter) {
                            return c.id !== transformedConversation.id
                          }
                          return true
                        })
                        const currentExistingIndex = currentFiltered.findIndex((c) => c.id === transformedConversation.id)
                        if (currentExistingIndex >= 0) {
                          const newList = [...currentFiltered]
                          newList[currentExistingIndex] = { ...transformedConversation, unread_count: count || 0 }
                          return newList.sort(
                            (a, b) =>
                              new Date(b.last_message_at).getTime() -
                              new Date(a.last_message_at).getTime()
                          )
                        }
                        return currentPrev
                      })
                    })
                }

                if (existingIndex >= 0) {
                  const newList = [...filtered]
                  newList[existingIndex] = { ...transformedConversation, unread_count: unreadCount }
                  return newList.sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                } else {
                  if (
                    (statusFilter === 'all' || transformedConversation.status === statusFilter) &&
                    (channelFilter === 'all' || transformedConversation.channel === channelFilter)
                  ) {
                    // Para novas conversas, adicionar temporariamente com 0 e atualizar depois
                    return [{ ...transformedConversation, unread_count: 0 }, ...filtered].sort(
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
          const newMessage = payload.new
          const conversationId = newMessage.conversation_id
          // Verificar tanto 'incoming' quanto 'inbound' para compatibilidade
          const isIncoming = newMessage.direction === 'incoming' || newMessage.direction === 'inbound'
          const isUnread = !newMessage.read_at
          
          console.log('📨 Nova mensagem recebida via Realtime:', {
            conversationId,
            isIncoming,
            isUnread,
            selectedId,
            direction: newMessage.direction
          })
          
          // Se a conversa não está selecionada e a mensagem é incoming e não lida, recalcular contador
          const shouldRecalculate = isIncoming && isUnread && conversationId !== selectedId

          if (shouldRecalculate) {
            console.log('🔄 Recalculando contador de não lidas para conversa:', conversationId)
            // Sempre recalcular o contador real quando uma nova mensagem não lida chega
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conversationId)
              .in('direction', ['incoming', 'inbound'])
              .is('read_at', null)

            if (countError) {
              console.error('❌ Erro ao contar mensagens não lidas:', countError)
            } else {
              console.log('✅ Contador de não lidas:', count)
            }

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
              // Transformar arrays de relacionamentos em objetos únicos
              const transformedConversation = {
                ...conversation,
                contacts: Array.isArray(conversation.contacts) 
                  ? (conversation.contacts[0] || null) 
                  : conversation.contacts,
                user_profiles: Array.isArray(conversation.user_profiles) 
                  ? (conversation.user_profiles[0] || null) 
                  : conversation.user_profiles,
              }

              if (
                (statusFilter === 'all' || transformedConversation.status === statusFilter) &&
                (channelFilter === 'all' || transformedConversation.channel === channelFilter)
              ) {
                setConversations((prev) => {
                  const existingIndex = prev.findIndex((c) => c.id === transformedConversation.id)
                  if (existingIndex >= 0) {
                    const newList = [...prev]
                    newList[existingIndex] = {
                      ...transformedConversation,
                      unread_count: count || 0
                    }
                    return newList.sort(
                      (a, b) =>
                        new Date(b.last_message_at).getTime() -
                        new Date(a.last_message_at).getTime()
                    )
                  } else {
                    // Se a conversa não está na lista, adicionar com contador correto
                    return [{
                      ...transformedConversation,
                      unread_count: count || 0
                    }, ...prev].sort(
                      (a, b) =>
                        new Date(b.last_message_at).getTime() -
                        new Date(a.last_message_at).getTime()
                    )
                  }
                })
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new
          const conversationId = updatedMessage.conversation_id
          
          // Se uma mensagem foi marcada como lida, recalcular contador
          if (updatedMessage.read_at && !payload.old.read_at) {
            // Recalcular contador para esta conversa
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conversationId)
              .in('direction', ['incoming', 'inbound'])
              .is('read_at', null)

            setConversations((prev) => {
              const existingIndex = prev.findIndex((c) => c.id === conversationId)
              if (existingIndex >= 0) {
                const newList = [...prev]
                newList[existingIndex] = {
                  ...newList[existingIndex],
                  unread_count: count || 0
                }
                return newList
              }
              return prev
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, supabase, statusFilter, channelFilter, selectedId])

  // Função para recalcular contador de mensagens não lidas
  const recalculateUnreadCount = async (conversationId: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .in('direction', ['incoming', 'inbound'])
      .is('read_at', null)

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unread_count: count || 0 } : conv
      )
    )
  }

  const handleSelectConversation = async (id: string) => {
    setSelectedId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`/conversations?${params.toString()}`)

    // Marcar todas as mensagens não lidas desta conversa como lidas
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .in('direction', ['incoming', 'inbound'])
      .is('read_at', null)

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
    } else {
      // Atualizar contador de não lidas para 0
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === id ? { ...conv, unread_count: 0 } : conv
        )
      )
    }
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
  const [isMobile, setIsMobile] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Em mobile, se há conversa selecionada, mostrar chat
      if (mobile && selectedId) {
        setShowChat(true)
      } else if (mobile && !selectedId) {
        setShowChat(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [selectedId])

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

  // Em mobile, mostrar apenas lista OU chat (não ambos)
  if (isMobile) {
    if (showChat && selectedConversation) {
      return (
        <div className="flex h-full flex-col overflow-hidden">
          <ConversationDetailView
            conversation={selectedConversation}
            onClose={async () => {
              const closedId = selectedId
              setShowChat(false)
              setSelectedId(undefined)
              const params = new URLSearchParams(searchParams.toString())
              params.delete('id')
              router.push(`/conversations?${params.toString()}`)
              
              // Recalcular contador de mensagens não lidas quando fechar a conversa
              if (closedId) {
                await recalculateUnreadCount(closedId)
              }
            }}
          />
        </div>
      )
    }

    // Mostrar lista em mobile
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Lista de conversas - mobile */}
        <div className="flex flex-col border-b md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full">
          {/* Filtros */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4">
          <div className="grid grid-cols-2 md:block md:space-y-3 gap-3 md:gap-0">
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2.5 md:py-1.5 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
              >
                <option value="all">Todos</option>
                <option value={ConversationStatus.OPEN}>Abertas</option>
                <option value={ConversationStatus.CLOSED}>Fechadas</option>
                <option value={ConversationStatus.WAITING}>Aguardando</option>
                <option value={ConversationStatus.TRANSFERRED}>Transferidas</option>
              </select>
            </div>
            <div>
              <label htmlFor="channel" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2.5 md:py-1.5 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
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
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      handleSelectConversation(conversation.id)
                      if (isMobile) {
                        setShowChat(true)
                      }
                    }}
                    className={`w-full text-left p-3 md:p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] ${
                      selectedId === conversation.id ? 'bg-gradient-to-r from-[#039155]/10 to-[#18B0BB]/10 dark:from-[#039155]/20 dark:to-[#18B0BB]/20 border-r-2 border-[#039155] dark:border-[#18B0BB]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {conversation.contacts?.name || 'Sem nome'}
                          </h3>
                          {conversation.status === ConversationStatus.OPEN && (
                            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400"></span>
                            </span>
                          )}
                          {/* Badge de mensagens não lidas - só exibe se > 0 */}
                          {(conversation.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-400">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                              </span>
                              <span>{(conversation.unread_count ?? 0) > 99 ? '99+' : conversation.unread_count}</span>
                            </span>
                          )}
                        </div>
                        {conversation.subject && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">{conversation.subject}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(conversation.status)}`}
                          >
                            {getStatusLabel(conversation.status)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{conversation.channel}</span>
                          {conversation.ai_assistant_enabled && (
                            <span className="text-xs">🤖</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
      </div>
    )
  }

  // Desktop: split view
  return (
    <div className="flex h-full gap-2 md:gap-4 overflow-hidden">
      {/* Lista de conversas - lado esquerdo */}
      <div className="flex w-72 md:w-80 lg:w-[250px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Header com Breadcrumb, Título e Descrição */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <Breadcrumb items={[{ label: 'Conversas' }]} />
          <div className="space-y-3">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap" style={{ width: '200px' }}>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Conversas</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-green-800 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                </span>
                <span className="hidden sm:inline">Tempo Real</span>
              </span>
            </div>
          </div>
        </div>
        {/* Filtros */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
              >
                <option value="all">Todos</option>
                <option value={ConversationStatus.OPEN}>Abertas</option>
                <option value={ConversationStatus.CLOSED}>Fechadas</option>
                <option value={ConversationStatus.WAITING}>Aguardando</option>
                <option value={ConversationStatus.TRANSFERRED}>Transferidas</option>
              </select>
            </div>
            <div>
              <label htmlFor="channel" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
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
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedId === conversation.id ? 'bg-gradient-to-r from-[#039155]/10 to-[#18B0BB]/10 dark:from-[#039155]/20 dark:to-[#18B0BB]/20 border-r-2 border-[#039155] dark:border-[#18B0BB]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {conversation.contacts?.name || 'Sem nome'}
                        </h3>
                        {conversation.status === ConversationStatus.OPEN && (
                          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400"></span>
                          </span>
                        )}
                        {/* Badge de mensagens não lidas - só exibe se > 0 */}
                        {(conversation.unread_count ?? 0) > 0 && (
                          <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-400">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                            </span>
                            <span>{(conversation.unread_count ?? 0) > 99 ? '99+' : conversation.unread_count}</span>
                          </span>
                        )}
                      </div>
                      {conversation.subject && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">{conversation.subject}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(conversation.status)}`}
                        >
                          {getStatusLabel(conversation.status)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{conversation.channel}</span>
                        {conversation.ai_assistant_enabled && (
                          <span className="text-xs">🤖</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
        {selectedConversation ? (
          <ConversationDetailView
            conversation={selectedConversation}
            onClose={async () => {
              const closedId = selectedId
              setSelectedId(undefined)
              const params = new URLSearchParams(searchParams.toString())
              params.delete('id')
              router.push(`/conversations?${params.toString()}`)
              
              // Recalcular contador de mensagens não lidas quando fechar a conversa
              if (closedId) {
                await recalculateUnreadCount(closedId)
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Selecione uma conversa</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Clique em uma conversa na lista para visualizá-la</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

