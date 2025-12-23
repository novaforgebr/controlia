'use client'

import { useRouter } from 'next/navigation'
import { closeConversation } from '@/app/actions/conversations'
import { useState } from 'react'

interface CloseConversationButtonProps {
  conversationId: string
}

export function CloseConversationButton({ conversationId }: CloseConversationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClose = async () => {
    setLoading(true)
    const result = await closeConversation(conversationId)
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
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

