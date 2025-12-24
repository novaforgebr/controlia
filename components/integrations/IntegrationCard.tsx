'use client'

import { useState } from 'react'
import { connectChannel, disconnectChannel, checkConnectionStatus } from '@/app/actions/integrations'
import { QRCodeModal } from './QRCodeModal'

interface Channel {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

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

interface IntegrationCardProps {
  channel: Channel
  integration?: ChannelIntegration
  onUpdate: () => void
}

export function IntegrationCard({ channel, integration, onUpdate }: IntegrationCardProps) {
  const [loading, setLoading] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const isConnected = integration?.status === 'connected'
  const isConnecting = integration?.status === 'connecting'

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await connectChannel(channel.id)
      if (result.success && result.qrCode) {
        setQrCodeData(result.qrCode)
        setShowQRCode(true)
        // Iniciar polling de status
        startStatusPolling(result.integrationId)
      } else if (result.error) {
        alert('Erro ao conectar: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao conectar canal:', error)
      alert('Erro ao conectar canal')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!integration) return
    
    if (!confirm('Tem certeza que deseja desconectar este canal?')) {
      return
    }

    setLoading(true)
    try {
      const result = await disconnectChannel(integration.id)
      if (result.success) {
        onUpdate()
      } else {
        alert('Erro ao desconectar: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao desconectar canal:', error)
      alert('Erro ao desconectar canal')
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = async (integrationId: string) => {
    const pollInterval = setInterval(async () => {
      if (checkingStatus) return
      
      setCheckingStatus(true)
      try {
        const result = await checkConnectionStatus(integrationId)
        if (result.success) {
          if (result.status === 'connected') {
            clearInterval(pollInterval)
            setShowQRCode(false)
            setQrCodeData(null)
            onUpdate()
          } else if (result.status === 'error') {
            clearInterval(pollInterval)
            alert('Erro na conexão: ' + result.error)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      } finally {
        setCheckingStatus(false)
      }
    }, 3000) // Verificar a cada 3 segundos

    // Limpar após 5 minutos
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  const getStatusBadge = () => {
    switch (integration?.status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Conectado
          </span>
        )
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <div className="h-2 w-2 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
            Conectando...
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Erro
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
            Desconectado
          </span>
        )
    }
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${channel.color === 'green' ? 'text-green-500' : 'text-blue-500'}`}>
              {channel.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
              <p className="text-sm text-gray-500">{channel.description}</p>
            </div>
          </div>
        </div>

        {integration && (
          <div className="mb-4 space-y-2">
            {getStatusBadge()}
            {integration.channel_name && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nome:</span> {integration.channel_name}
              </p>
            )}
            {isConnected && integration.connected_at && (
              <p className="text-xs text-gray-500">
                Conectado em {new Date(integration.connected_at).toLocaleDateString('pt-BR')}
              </p>
            )}
            {isConnected && (
              <div className="flex gap-4 text-xs text-gray-600 pt-2">
                <span>
                  <span className="font-medium">{integration.total_messages}</span> mensagens
                </span>
                <span>
                  <span className="font-medium">{integration.total_conversations}</span> conversas
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!integration || !isConnected ? (
            <button
              onClick={handleConnect}
              disabled={loading || isConnecting}
              className="flex-1 rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Conectando...
                </span>
              ) : (
                'Conectar'
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Desconectando...' : 'Desconectar'}
            </button>
          )}
        </div>
      </div>

      {showQRCode && qrCodeData && (
        <QRCodeModal
          isOpen={showQRCode}
          onClose={() => {
            setShowQRCode(false)
            setQrCodeData(null)
          }}
          qrCodeData={qrCodeData}
          channelName={channel.name}
        />
      )}
    </>
  )
}

