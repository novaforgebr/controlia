'use client'

import { useState } from 'react'
import { inviteUser } from '@/app/actions/users'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um e-mail válido')
      return
    }

    setLoading(true)
    try {
      const result = await inviteUser(email.toLowerCase(), 'operator')
      
      if (result.success) {
        toast.success('Convite enviado com sucesso!')
        setEmail('')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao enviar convite')
      }
    } catch (error) {
      toast.error('Erro ao enviar convite. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Convidar Usuário</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail do usuário
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              required
              disabled={loading}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              O usuário receberá um e-mail com o link para se cadastrar e será adicionado como Operador.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

