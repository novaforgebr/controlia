'use client'

import { useState } from 'react'

interface PipelineStage {
  id: string
  name: string
  description: string | null
  color: string
  is_closed: boolean
  is_lost: boolean
  display_order: number
}

interface PipelineStageFormProps {
  pipelineId: string
  stage?: PipelineStage
  onSubmit: (formData: FormData) => void
  onCancel: () => void
}

export function PipelineStageForm({ pipelineId, stage, onSubmit, onCancel }: PipelineStageFormProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome do Estágio <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={stage?.name || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            placeholder="Ex: Qualificação"
          />
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cor
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              id="color"
              name="color"
              defaultValue={stage?.color || '#039155'}
              className="h-10 w-20 rounded-md border border-gray-300 dark:border-gray-700"
            />
            <input
              type="text"
              defaultValue={stage?.color || '#039155'}
              onChange={(e) => {
                const colorInput = document.getElementById('color') as HTMLInputElement
                if (colorInput) colorInput.value = e.target.value
              }}
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              placeholder="#039155"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={stage?.description || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Descreva este estágio..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ordem de Exibição
          </label>
          <input
            type="number"
            id="display_order"
            name="display_order"
            min="0"
            defaultValue={stage?.display_order || 0}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_closed"
            name="is_closed"
            value="true"
            defaultChecked={stage?.is_closed || false}
            className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
          />
          <label htmlFor="is_closed" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Representa &quot;Fechado/Ganho&quot;
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_lost"
            name="is_lost"
            value="true"
            defaultChecked={stage?.is_lost || false}
            className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
          />
          <label htmlFor="is_lost" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Representa &quot;Perdido&quot;
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando...' : stage ? 'Atualizar' : 'Criar'} Estágio
        </button>
      </div>
    </form>
  )
}

