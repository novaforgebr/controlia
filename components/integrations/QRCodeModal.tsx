'use client'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrCodeData: string
  channelName: string
}

export function QRCodeModal({ isOpen, onClose, qrCodeData, channelName }: QRCodeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Escaneie o QR Code - {channelName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={`data:image/png;base64,${qrCodeData}`}
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>

          <p className="text-sm text-gray-600 text-center">
            Abra o {channelName} no seu celular e escaneie este código para conectar
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span>Aguardando conexão...</span>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

