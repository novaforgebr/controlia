'use client'

import { useState } from 'react'
import { deleteCustomField } from '@/app/actions/custom-fields'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/lib/hooks/use-toast'

interface CustomFieldActionsProps {
  fieldId: string
}

export function CustomFieldActions({ fieldId }: CustomFieldActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleDelete = async () => {
    setLoading(true)
    const loadingToast = toast.loading('Removendo campo...')
    
    try {
      const result = await deleteCustomField(fieldId)
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success('Campo customizado removido com sucesso')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao remover campo')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Erro ao remover campo. Tente novamente.')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/contacts/custom-fields/${fieldId}/edit`}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Editar
      </Link>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={loading}
        className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        Remover
      </button>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar Remoção</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tem certeza que deseja remover este campo customizado? Os valores existentes nos contatos serão preservados, mas o campo não aparecerá mais nos formulários.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

