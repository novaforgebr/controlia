'use client'

import { useState } from 'react'
import { createMessage } from '@/app/actions/messages'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'

interface MessageFormProps {
  conversationId: string
  contactId: string
  onMessageSent?: () => void
}

export function MessageForm({ conversationId, contactId, onMessageSent }: MessageFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!content.trim()) {
      setError('Digite uma mensagem')
      toast.warning('Digite uma mensagem antes de enviar')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const loadingToast = toast.loading('Enviando mensagem...')

    const formData = new FormData()
    formData.append('conversation_id', conversationId)
    formData.append('contact_id', contactId)
    formData.append('content', content)
    formData.append('sender_type', 'human')
    formData.append('direction', 'outbound')
    formData.append('status', 'sent')

    try {
      const result = await createMessage(formData)
      toast.dismiss(loadingToast)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (result.success && result.data) {
        setContent('')
        toast.success('Mensagem enviada com sucesso')
        
        // Sempre chamar onMessageSent se disponível, senão refresh
        if (onMessageSent) {
          // Aguardar um pouco mais para garantir que a mensagem foi salva e o Realtime processou
          setTimeout(() => {
            onMessageSent()
          }, 1000)
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Erro ao enviar mensagem. Tente novamente.')
      setError('Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-2 md:p-4 shadow dark:shadow-gray-900/50">
      {error && (
        <div className="mb-2 md:mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-2 md:p-3 text-xs md:text-sm text-red-800 dark:text-red-400">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 md:gap-4 items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={2}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600 resize-none min-h-[44px] md:min-h-0"
          disabled={loading}
          onKeyDown={(e) => {
            // Permitir Enter para enviar (mas Shift+Enter para nova linha)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e as any)
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 md:px-6 py-2.5 md:py-2 text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0 flex items-center justify-center"
          aria-label="Enviar mensagem"
        >
          <span className="hidden md:inline">{loading ? 'Enviando...' : 'Enviar'}</span>
          <svg className="md:hidden h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}

