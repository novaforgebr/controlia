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

      if (result.success) {
        setContent('')
        toast.success('Mensagem enviada com sucesso')
        if (onMessageSent) {
          onMessageSent()
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
    <div className="rounded-lg bg-white dark:bg-gray-900 p-4 shadow dark:shadow-gray-900/50">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-400">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={3}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2 text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}

