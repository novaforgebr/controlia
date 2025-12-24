'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IntegrationCard } from './IntegrationCard'

interface ChannelIntegration {
  id: string
  channel: string
  channel_name: string | null
  status: string
  connection_data: Record<string, unknown>
  n8n_instance_id: string | null
  connected_at: string | null
  total_messages: number
  total_conversations: number
  auto_reply_enabled: boolean
  created_at: string
}

export function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadIntegrations()

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('integrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_integrations',
        },
        () => {
          loadIntegrations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar company_id do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!companyUser) return

      const { data, error } = await supabase
        .from('channel_integrations')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar integrações:', error)
        return
      }

      setIntegrations((data as ChannelIntegration[]) || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
      </div>
    )
  }

  // Canais disponíveis
  const availableChannels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Conecte sua conta WhatsApp Business via Evolution API',
      icon: '📱',
      color: 'green',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Conecte seu bot do Telegram',
      icon: '✈️',
      color: 'blue',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Canais disponíveis */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Canais Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableChannels.map((channel) => {
            const existingIntegration = integrations.find((i) => i.channel === channel.id)
            return (
              <IntegrationCard
                key={channel.id}
                channel={channel}
                integration={existingIntegration}
                onUpdate={loadIntegrations}
              />
            )
          })}
        </div>
      </div>

      {/* Integrações existentes */}
      {integrations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Suas Integrações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const channelInfo = availableChannels.find((c) => c.id === integration.channel)
              if (!channelInfo) return null

              return (
                <IntegrationCard
                  key={integration.id}
                  channel={channelInfo}
                  integration={integration}
                  onUpdate={loadIntegrations}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

