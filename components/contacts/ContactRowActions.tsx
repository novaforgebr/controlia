'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteContact } from '@/app/actions/contacts'
import { useToast } from '@/lib/hooks/use-toast'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface ContactRowActionsProps {
  contactId: string
  contactName: string
}

export function ContactRowActions({ contactId, contactName }: ContactRowActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteContact(contactId)
      if (result.success) {
        toast.success('Contato excluído com sucesso!')
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao excluir contato')
      }
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      toast.error('Erro ao excluir contato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href={`/contacts/${contactId}`}
          className="text-[#039155] hover:text-[#18B0BB] font-medium transition-colors"
        >
          Ver
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href={`/contacts/${contactId}/edit`}
          className="text-gray-600 hover:text-[#039155] font-medium transition-colors"
        >
          Editar
        </Link>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          Excluir
        </button>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o contato "${contactName}"? Esta ação é irreversível e todas as conversas e mensagens relacionadas também serão excluídas.`}
        confirmButtonText="Excluir"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        loading={loading}
      />
    </>
  )
}

