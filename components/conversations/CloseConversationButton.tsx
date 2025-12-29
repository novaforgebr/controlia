'use client'

import { useRouter } from 'next/navigation'
import { closeConversation } from '@/app/actions/conversations'
import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

interface CloseConversationButtonProps {
  conversationId: string
}

export function CloseConversationButton({ conversationId }: CloseConversationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleClose = async () => {
    setLoading(true)
    const loadingToast = toast.loading('Fechando conversa...')
    
    try {
      const result = await closeConversation(conversationId)
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success('Conversa fechada com sucesso')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao fechar conversa')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Erro ao fechar conversa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="rounded-[30px] bg-gray-600 dark:bg-gray-700 px-3 md:px-4 py-2 text-sm md:text-base text-white hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center"
      title="Fechar conversa"
      aria-label="Fechar conversa"
    >
      <span className="hidden md:inline" style={{ fontSize: '14px' }}>{loading ? 'Fechando...' : 'Fechar Conversa'}</span>
      <span className="md:hidden">{loading ? 'Fechando...' : 'Fechar'}</span>
    </button>
  )
}

