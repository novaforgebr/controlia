'use client'

import { useState } from 'react'
import { connectChannel, disconnectChannel, checkConnectionStatus } from '@/app/actions/integrations'
import { QRCodeModal } from './QRCodeModal'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'
import { useToast } from '@/lib/hooks/use-toast'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

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
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const toast = useToast()

  const isConnected = integration?.status === 'connected'
  const isConnecting = integration?.status === 'connecting'

  const handleConnect = async () => {
    setLoading(true)
    const loadingToast = toast.loading(`Conectando ${channel.name}...`)
    
    try {
      const result = await connectChannel(channel.id)
      toast.dismiss(loadingToast)
      
      if (result.success && result.qrCode) {
        setQrCodeData(result.qrCode)
        setShowQRCode(true)
        toast.success(`QR Code gerado! Escaneie para conectar ${channel.name}`)
        // Iniciar polling de status
        startStatusPolling(result.integrationId)
      } else if (result.error) {
        toast.error(`Erro ao conectar: ${result.error}`)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erro ao conectar canal:', error)
      toast.error('Erro ao conectar canal. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!integration) return
    
    setLoading(true)
    const loadingToast = toast.loading(`Desconectando ${channel.name}...`)
    
    try {
      const result = await disconnectChannel(integration.id)
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success(`${channel.name} desconectado com sucesso`)
        setShowDisconnectConfirm(false)
        onUpdate()
      } else {
        toast.error(`Erro ao desconectar: ${result.error}`)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erro ao desconectar canal:', error)
      toast.error('Erro ao desconectar canal. Tente novamente.')
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
            toast.success(`${channel.name} conectado com sucesso!`)
            onUpdate()
          } else if (result.status === 'error') {
            clearInterval(pollInterval)
            toast.error(`Erro na conexão: ${result.error || 'Erro desconhecido'}`)
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


  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/50 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${channel.color === 'green' ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
              {channel.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{channel.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{channel.description}</p>
            </div>
          </div>
        </div>

        {integration && (
          <div className="mb-4 space-y-2">
            <IntegrationStatusBadge status={integration.status} />
            {integration.channel_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Nome:</span> {integration.channel_name}
              </p>
            )}
            {isConnected && integration.connected_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Conectado em {new Date(integration.connected_at).toLocaleDateString('pt-BR')}
              </p>
            )}
            {isConnected && (
              <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2">
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
              className="flex-1 rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={loading}
              className="flex-1 rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmação de desconexão */}
      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        title="Desconectar Canal"
        message={`Tem certeza que deseja desconectar ${channel.name}? As mensagens não serão mais recebidas até reconectar.`}
        confirmText="Desconectar"
        cancelText="Cancelar"
        variant="warning"
        loading={loading}
      />

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

