'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'

interface LiveConversation {
  id: string
  subject: string | null
  status: string
  channel: string
  priority: string
  ai_assistant_enabled: boolean
  last_message_at: string
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

export function LiveConversationsWrapper() {
  const [conversations, setConversations] = useState<LiveConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

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

        const { data: initialConversations, error } = await supabase
          .from('conversations')
          .select(`
            id,
            subject,
            status,
            channel,
            priority,
            ai_assistant_enabled,
            last_message_at,
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
          .eq('status', 'open')
          .order('last_message_at', { ascending: false })

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
  }, [supabase])

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('live-conversations')
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
                if (updatedConversation.status !== 'open') {
                  return prev.filter((c) => c.id !== updatedConversation.id)
                }

                const existingIndex = prev.findIndex((c) => c.id === updatedConversation.id)
                if (existingIndex >= 0) {
                  const newList = [...prev]
                  newList[existingIndex] = updatedConversation
                  return newList.sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                } else {
                  return [updatedConversation, ...prev].sort(
                    (a, b) =>
                      new Date(b.last_message_at).getTime() -
                      new Date(a.last_message_at).getTime()
                  )
                }
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id))
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
            .eq('status', 'open')
            .single()

          if (conversation) {
            setConversations((prev) => {
              const existingIndex = prev.findIndex((c) => c.id === conversation.id)
              if (existingIndex >= 0) {
                const newList = [...prev]
                newList[existingIndex] = conversation
                return [conversation, ...newList.filter((c) => c.id !== conversation.id)].sort(
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
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando conversas ativas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
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
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma conversa ativa</h3>
          <p className="mt-2 text-gray-600">
            Quando houver conversas abertas, elas aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#039155]/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/conversations/${conversation.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-[#039155] transition-colors"
                  >
                    {conversation.contacts?.name || 'Contato sem nome'}
                  </Link>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      conversation.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : conversation.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {conversation.priority}
                  </span>
                  <span className="text-xs font-medium text-gray-500 capitalize">
                    {conversation.channel}
                  </span>
                  {conversation.ai_assistant_enabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      IA Ativa
                    </span>
                  )}
                </div>
                {conversation.subject && (
                  <p className="mt-2 text-sm text-gray-600">{conversation.subject}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Última mensagem: {format(new Date(conversation.last_message_at), 'HH:mm:ss')}
                  </span>
                  {conversation.user_profiles && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {conversation.user_profiles.full_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <Link
                  href={`/conversations/${conversation.id}`}
                  className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Intervir
                </Link>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Contador de conversas ativas */}
      <div className="mt-6 rounded-lg bg-gradient-to-r from-[#039155]/5 to-[#18B0BB]/5 border border-[#039155]/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Total de conversas ativas</p>
            <p className="mt-1 text-2xl font-bold text-[#039155]">{conversations.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Atualizado em tempo real</p>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

