'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePipeline, createPipelineStage, updatePipelineStage, deletePipelineStage } from '@/app/actions/pipelines'
import Link from 'next/link'
import { PipelineStageForm } from './PipelineStageForm'

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
  pipeline_stages: Array<{
    id: string
    name: string
    description: string | null
    color: string
    is_closed: boolean
    is_lost: boolean
    display_order: number
  }>
}

interface EditPipelineFormProps {
  pipeline: Pipeline
}

export function EditPipelineForm({ pipeline }: EditPipelineFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [showNewStage, setShowNewStage] = useState(false)
  const [stages, setStages] = useState(pipeline.pipeline_stages || [])

  const handleUpdatePipeline = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updatePipeline(pipeline.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleCreateStage = async (formData: FormData) => {
    const result = await createPipelineStage(pipeline.id, formData)
    if (result.success && result.data) {
      setStages([...stages, result.data])
      setShowNewStage(false)
      router.refresh()
    } else {
      alert(result.error || 'Erro ao criar estágio')
    }
  }

  const handleUpdateStage = async (stageId: string, formData: FormData) => {
    const result = await updatePipelineStage(stageId, formData)
    if (result.success) {
      setEditingStageId(null)
      router.refresh()
    } else {
      alert(result.error || 'Erro ao atualizar estágio')
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Tem certeza que deseja deletar este estágio?')) return

    const result = await deletePipelineStage(stageId)
    if (result.success) {
      setStages(stages.filter((s) => s.id !== stageId))
      router.refresh()
    } else {
      alert(result.error || 'Erro ao deletar estágio')
    }
  }

  const sortedStages = [...stages].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="space-y-6">
      {/* Formulário do Pipeline */}
      <form onSubmit={handleUpdatePipeline} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome do Pipeline <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={pipeline.name}
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
            defaultValue={pipeline.description || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_default"
            name="is_default"
            value="true"
            defaultChecked={pipeline.is_default}
            className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
          />
          <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
            Definir como pipeline padrão
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Gerenciamento de Estágios */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Estágios do Pipeline</h2>
          {!showNewStage && (
            <button
              onClick={() => setShowNewStage(true)}
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              + Novo Estágio
            </button>
          )}
        </div>

        {showNewStage && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <PipelineStageForm
              pipelineId={pipeline.id}
              onSubmit={handleCreateStage}
              onCancel={() => setShowNewStage(false)}
            />
          </div>
        )}

        {sortedStages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">Nenhum estágio configurado</p>
            <p className="mt-2 text-xs">Crie estágios para organizar seus contatos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStages.map((stage) => (
              <div key={stage.id} className="rounded-lg border border-gray-200 p-4">
                {editingStageId === stage.id ? (
                  <PipelineStageForm
                    pipelineId={pipeline.id}
                    stage={stage}
                    onSubmit={(formData) => handleUpdateStage(stage.id, formData)}
                    onCancel={() => setEditingStageId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                        {stage.description && (
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        )}
                        <div className="mt-1 flex gap-2">
                          {stage.is_closed && (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Fechado/Ganho
                            </span>
                          )}
                          {stage.is_lost && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Perdido
                            </span>
                          )}
                          <span className="text-xs text-gray-500">Ordem: {stage.display_order}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingStageId(stage.id)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

