'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function NewDocumentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!file) {
      setError('Selecione um arquivo')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('name', formData.get('name') as string)
    uploadFormData.append('is_knowledge_base', 'true')

    // Adicionar campos opcionais se existirem
    const description = formData.get('description')
    const category = formData.get('category')
    const tags = formData.get('tags')
    
    if (description) uploadFormData.append('description', description as string)
    if (category) uploadFormData.append('category', category as string)
    if (tags) uploadFormData.append('tags', tags as string)

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Erro ao fazer upload do arquivo'
        setError(errorMessage)
        setLoading(false)
        return
      }

      router.push('/documents')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do arquivo. Verifique sua conexão e tente novamente.')
      setLoading(false)
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
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Manual do Produto"
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
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Descreva o conteúdo deste documento..."
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          Arquivo <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          id="file"
          name="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
          accept=".pdf,.doc,.docx,.txt,.md"
        />
        <p className="mt-1 text-xs text-gray-500">Formatos aceitos: PDF, DOC, DOCX, TXT, MD</p>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <input
          type="text"
          id="category"
          name="category"
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
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: produto, suporte, vendas"
        />
        <p className="mt-1 text-xs text-gray-500">Separe múltiplas tags por vírgula</p>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/documents"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Documento'}
        </button>
      </div>
    </form>
  )
}

