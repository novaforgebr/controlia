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
      className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? 'Fechando...' : 'Fechar Conversa'}
    </button>
  )
}

