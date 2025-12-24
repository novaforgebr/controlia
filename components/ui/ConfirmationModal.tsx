'use client'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: '🔴',
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: '⚠️',
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'ℹ️',
    },
  }

  const style = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-gray-900/50 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <div className="text-2xl">{style.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors ${style.button}`}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

