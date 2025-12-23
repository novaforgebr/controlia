'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFile, deleteFile } from '@/app/actions/files'
import Link from 'next/link'

interface File {
  id: string
  name: string
  description: string | null
  category: string | null
  tags: string[]
  is_knowledge_base: boolean
}

interface EditDocumentFormProps {
  file: File
}

export function EditDocumentForm({ file }: EditDocumentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateFile(file.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      router.push('/documents')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setLoading(true)
    const result = await deleteFile(file.id)

    if (result.success) {
      router.push('/documents')
      router.refresh()
    } else {
      alert(result.error || 'Erro ao deletar documento')
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome do Documento <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={file.name}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={file.description || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Descreva o conteúdo deste documento..."
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <input
          type="text"
          id="category"
          name="category"
          defaultValue={file.category || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Manual, Política, FAQ..."
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (separadas por vírgula)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          defaultValue={file.tags?.join(', ') || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: produto, suporte, vendas"
        />
        <p className="mt-1 text-xs text-gray-500">Separe múltiplas tags por vírgula</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_knowledge_base"
          name="is_knowledge_base"
          value="true"
          defaultChecked={file.is_knowledge_base}
          className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
        />
        <label htmlFor="is_knowledge_base" className="ml-2 text-sm text-gray-700">
          Incluir na base de conhecimento para IA
        </label>
      </div>

      <div className="flex justify-between gap-3">
        <div>
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deletando...' : 'Confirmar Exclusão'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Deletar Documento
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/documents"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </form>
  )
}

