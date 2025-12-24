'use client'

interface IntegrationStatusBadgeProps {
  status: string
  className?: string
}

export function IntegrationStatusBadge({ status, className = '' }: IntegrationStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Conectado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          icon: (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
          ),
        }
      case 'connecting':
        return {
          label: 'Conectando...',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          dotColor: 'bg-yellow-500',
          icon: (
            <div className="h-2 w-2 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
          ),
        }
      case 'error':
        return {
          label: 'Erro',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          icon: (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        }
      case 'disconnected':
      default:
        return {
          label: 'Desconectado',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
          icon: (
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
          ),
        }
    }
  }

  const config = getStatusConfig()

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

