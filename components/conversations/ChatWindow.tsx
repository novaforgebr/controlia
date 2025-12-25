'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { CloseConversationButton } from './CloseConversationButton'
import { MessageForm } from './MessageForm'
import { ContactDetailsModal } from './ContactDetailsModal'
import { toggleConversationAI } from '@/app/actions/conversations'
import { listMessages } from '@/app/actions/messages'
import { Switch } from '@/components/ui/Switch'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'

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

interface ChatWindowProps {
  conversation: Conversation
  onClose?: () => void
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(conversation.ai_assistant_enabled)
  const [optimisticAiEnabled, setOptimisticAiEnabled] = useState(conversation.ai_assistant_enabled)
  const [showContactModal, setShowContactModal] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const router = useRouter()
  const toast = useToast()

  // Memoizar subscription key para evitar re-subscriptions
  const subscriptionKey = useMemo(() => `conversation-${conversation.id}`, [conversation.id])


  // Carregar mensagens iniciais
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      
      // IMPORTANTE: Usar server action para buscar mensagens
      // Isso contorna problemas de RLS no cliente
      const result = await listMessages(conversation.id, 100)
      
      if (result.error) {
        console.error('Erro ao carregar mensagens:', result.error)
        
        // Fallback: tentar buscar diretamente do cliente
        
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select('company_id')
          .eq('id', conversation.id)
          .single()
        
        if (convError || !conversationData) {
          console.error('Erro ao buscar conversa:', convError)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('messages')
          .select('*, user_profiles:sender_id(full_name)')
          .eq('conversation_id', conversation.id)
          .eq('company_id', conversationData.company_id)
          .order('created_at', { ascending: true })
          .limit(100)

        if (error) {
          console.error('Erro ao buscar mensagens:', error)
          setLoading(false)
          return
        }

        setMessages(data || [])
        setLoading(false)
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return
      }

      const data = result.data || []

      // Transformar dados para garantir formato correto
      const transformedMessages = (data || []).map((msg: any) => ({
        ...msg,
        user_profiles: msg.user_profiles || null,
        created_at: msg.created_at || new Date().toISOString(),
      }))
      
      // Ordenar mensagens por data (ascendente)
      const sortedMessages = transformedMessages.sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
      
      setMessages(sortedMessages as Message[])
      setLoading(false)
      
      // Scroll após um pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } catch (error) {
      console.error('Erro:', error)
      setLoading(false)
    }
  }, [conversation.id, supabase])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Configurar Realtime subscription
  useEffect(() => {
    if (!conversation.id) return

    // Buscar company_id da conversa primeiro e configurar subscription
    const setupSubscription = async () => {
      try {
        const { data: conversationData } = await supabase
          .from('conversations')
          .select('company_id')
          .eq('id', conversation.id)
          .single()

        if (!conversationData) {
          console.error('Erro: Conversa não encontrada para subscription')
          return
        }

        // Configurar subscription com filtro por conversation_id
        const newChannel = supabase
          .channel(subscriptionKey)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversation.id}`,
            },
            async (payload) => {
              console.log('🆕 Realtime: Nova mensagem recebida:', {
                message_id: payload.new.id,
                conversation_id: payload.new.conversation_id,
                direction: payload.new.direction,
                sender_type: payload.new.sender_type,
              })
              
              const newMessage = payload.new as any
              
              // Buscar company_id da conversa para garantir RLS
              const { data: convData } = await supabase
                .from('conversations')
                .select('company_id')
                .eq('id', conversation.id)
                .single()
              
              if (!convData) {
                console.error('Erro: Conversa não encontrada para nova mensagem')
                return
              }
              
              // Buscar dados completos da mensagem com relacionamentos
              const { data: fullMessage, error: messageError } = await supabase
                .from('messages')
                .select('*, user_profiles:sender_id(full_name)')
                .eq('id', newMessage.id)
                .eq('company_id', convData.company_id)
                .single()

              if (messageError) {
                console.error('❌ Erro ao buscar mensagem completa:', messageError)
                console.error('   - message_id:', newMessage.id)
                console.error('   - company_id:', convData.company_id)
                // Tentar recarregar todas as mensagens como fallback
                setTimeout(() => loadMessages(), 500)
                return
              }

              if (fullMessage) {
                console.log('✅ Realtime: Mensagem adicionada ao estado:', {
                  id: fullMessage.id,
                  direction: fullMessage.direction,
                  sender_type: fullMessage.sender_type,
                  content_preview: fullMessage.content?.substring(0, 50),
                })
                
                setMessages((prev) => {
                  // Evitar duplicatas
                  if (prev.some((m) => m.id === fullMessage.id)) {
                    console.log('⚠️ Realtime: Mensagem já existe, ignorando:', fullMessage.id)
                    return prev
                  }
                  
                  // Adicionar mensagem e ordenar por created_at
                  const updated = [...prev, fullMessage as Message].sort((a, b) => {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  })
                  
                  console.log('✅ Realtime: Total de mensagens após adicionar:', updated.length)
                  return updated
                })
                setTimeout(() => scrollToBottom(), 100)
              } else {
                console.warn('⚠️ Mensagem não encontrada após Realtime event:', newMessage.id)
                // Tentar recarregar todas as mensagens como fallback
                setTimeout(() => loadMessages(), 500)
              }
            }
          )
        
        // Armazenar channel antes de subscribe
        channelRef.current = newChannel
        
        // Subscribe retorna Promise, mas não precisamos aguardar
        newChannel.subscribe()
      } catch (error) {
        console.error('Erro ao configurar subscription:', error)
      }
    }

    setupSubscription()

    // Escutar mudanças no ai_assistant_enabled da conversa
    const conversationChannel = supabase
      .channel(`conversation-status-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as Conversation
          if (updated.ai_assistant_enabled !== aiEnabled) {
            setAiEnabled(updated.ai_assistant_enabled)
            setOptimisticAiEnabled(updated.ai_assistant_enabled)
          }
        }
      )
      .subscribe()

    return () => {
      // Cleanup será feito quando o componente desmontar
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (conversationChannel) {
        supabase.removeChannel(conversationChannel)
      }
    }
  }, [conversation.id, subscriptionKey, supabase, aiEnabled])

  // Scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleMessageSent = useCallback(() => {
    console.log('🔄 handleMessageSent chamado - recarregando mensagens...')
    // Recarregar mensagens após envio
    // Usar um delay maior para garantir que a mensagem foi salva no banco e o Realtime processou
    setTimeout(() => {
      console.log('🔄 Executando loadMessages após delay...')
      loadMessages()
    }, 1200)
  }, [loadMessages])

  // Toggle IA com Optimistic Update
  const handleToggleAI = useCallback(async () => {
    const newValue = !optimisticAiEnabled
    
    // Optimistic update
    setOptimisticAiEnabled(newValue)
    setTogglingAI(true)

    const loadingToast = toast.loading(newValue ? 'Ativando IA...' : 'Desativando IA...')

    try {
      const result = await toggleConversationAI(conversation.id, newValue)
      toast.dismiss(loadingToast)
      
      if (result.success) {
        setAiEnabled(newValue)
        toast.success(newValue ? 'IA ativada com sucesso' : 'IA desativada com sucesso')
        router.refresh()
      } else {
        // Reverter em caso de erro
        setOptimisticAiEnabled(optimisticAiEnabled)
        toast.error(result.error || 'Erro ao atualizar IA')
      }
    } catch (error) {
      // Reverter em caso de erro
      toast.dismiss(loadingToast)
      setOptimisticAiEnabled(optimisticAiEnabled)
      console.error('Erro ao atualizar IA:', error)
      toast.error('Erro ao atualizar IA. Tente novamente.')
    } finally {
      setTogglingAI(false)
    }
  }, [conversation.id, optimisticAiEnabled, router, toast])

  // Agrupar mensagens por data para melhor visualização
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) {
      return []
    }

    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''

    messages.forEach((message) => {
      try {
        if (!message.created_at) {
          return
        }

        const messageDate = format(new Date(message.created_at), 'dd/MM/yyyy')
        
        if (messageDate !== currentDate) {
          currentDate = messageDate
          groups.push({ date: messageDate, messages: [message] })
        } else {
          if (groups.length > 0) {
            groups[groups.length - 1].messages.push(message)
          } else {
            groups.push({ date: messageDate, messages: [message] })
            currentDate = messageDate
          }
        }
      } catch (error) {
        // Ignorar mensagens com erro de data
      }
    })

    return groups
  }, [messages])


  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {conversation.contacts?.name || 'Contato sem nome'}
              </h2>
              {conversation.status === 'open' && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                </span>
              )}
            </div>
            {conversation.subject && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">{conversation.subject}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{conversation.channel}</span>
              <span>•</span>
              <span className="capitalize">{conversation.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            {/* Toggle IA com Switch */}
            <Switch
              checked={optimisticAiEnabled}
              onCheckedChange={handleToggleAI}
              disabled={togglingAI}
              label="IA Ativa"
              description={optimisticAiEnabled ? 'IA responderá automaticamente' : 'Apenas respostas manuais'}
            />

            {/* Botão Ver Detalhes do Contato */}
            <button
              onClick={() => setShowContactModal(true)}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Ver detalhes do contato"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            {conversation.status !== 'closed' && (
              <CloseConversationButton conversationId={conversation.id} />
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-6 min-h-0 bg-gray-50 dark:bg-gray-950"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
            <span className="ml-3 text-sm text-gray-500">Carregando mensagens...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="mt-1 text-xs">Envie a primeira mensagem abaixo</p>
            </div>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Erro ao agrupar mensagens</p>
              <p className="mt-1 text-xs">Total de mensagens: {messages.length}</p>
              <p className="mt-1 text-xs">Verifique o console para mais detalhes</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6" data-testid="messages-container">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Separador de data */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-800"></div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{group.date}</span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-800"></div>
                </div>

                {/* Mensagens do dia */}
                <div className="space-y-4">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          message.direction === 'outbound'
                            ? 'bg-gradient-to-r from-[#039155] to-[#18B0BB] text-white'
                            : message.sender_type === 'ai'
                            ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
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
                              className={`text-xs underline ${message.direction === 'outbound' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                              Ver mídia
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Formulário de mensagem */}
      {conversation.status !== 'closed' && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
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
          loadMessages()
        }}
      />
    </div>
  )
}

