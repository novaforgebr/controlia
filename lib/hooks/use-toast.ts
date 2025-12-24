/**
 * Hook customizado para usar notificações toast
 * Wrapper em torno do react-hot-toast com mensagens padronizadas
 */

import toast from 'react-hot-toast'

export function useToast() {
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #86efac',
      },
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
    })
  }

  const showError = (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    })
  }

  const showInfo = (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #93c5fd',
      },
    })
  }

  const showWarning = (message: string) => {
    toast(message, {
      duration: 3500,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#fffbeb',
        color: '#92400e',
        border: '1px solid #fde047',
      },
    })
  }

  const showLoading = (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    })
  }

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId)
  }

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    loading: showLoading,
    dismiss,
  }
}

