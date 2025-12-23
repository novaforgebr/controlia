'use client'

import { useState } from 'react'
import { deletePipeline } from '@/app/actions/pipelines'
import { useRouter } from 'next/navigation'

interface PipelineActionsProps {
  pipelineId: string
  isDefault: boolean
}

export function PipelineActions({ pipelineId, isDefault }: PipelineActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    const result = await deletePipeline(pipelineId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Erro ao deletar pipeline')
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Deletando...' : 'Confirmar'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDefault}
      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title={isDefault ? 'Não é possível deletar o pipeline padrão' : 'Deletar pipeline'}
    >
      Deletar
    </button>
  )
}

