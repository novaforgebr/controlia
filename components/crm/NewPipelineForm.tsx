'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPipeline } from '@/app/actions/pipelines'
import Link from 'next/link'

export function NewPipelineForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createPipeline(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      router.push('/crm/pipelines')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nome do Pipeline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Pipeline de Vendas"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Descreva o propósito deste pipeline..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_default"
          name="is_default"
          value="true"
          className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
        />
        <label htmlFor="is_default" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Definir como pipeline padrão
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/crm/pipelines"
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar Pipeline'}
        </button>
      </div>
    </form>
  )
}

