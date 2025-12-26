'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateContact } from '@/app/actions/contacts'
import { listPipelines } from '@/app/actions/pipelines'
import { useToast } from '@/lib/hooks/use-toast'
import { ContactStatus } from '@/lib/types/database'

interface ContactStatusEditorProps {
  contactId: string
  currentStatus: string
  currentPipelineId?: string | null
  currentPipelineStageId?: string | null
}

interface Pipeline {
  id: string
  name: string
  pipeline_stages: PipelineStage[]
}

interface PipelineStage {
  id: string
  name: string
  color: string
  display_order: number
}

export function ContactStatusEditor({ 
  contactId, 
  currentStatus,
  currentPipelineId,
  currentPipelineStageId 
}: ContactStatusEditorProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPipelines, setLoadingPipelines] = useState(true)
  const [status, setStatus] = useState(currentStatus)
  const [pipelineId, setPipelineId] = useState(currentPipelineId || '')
  const [stageId, setStageId] = useState(currentPipelineStageId || '')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [availableStages, setAvailableStages] = useState<PipelineStage[]>([])
  const router = useRouter()
  const toast = useToast()

  // Carregar pipelines apenas uma vez
  useEffect(() => {
    let mounted = true
    
    async function loadPipelines() {
      setLoadingPipelines(true)
      try {
        const result = await listPipelines()
        if (mounted && result.data) {
          setPipelines(result.data as Pipeline[])
          
          // Se já tem pipeline selecionado, carregar stages
          if (currentPipelineId) {
            const selectedPipeline = result.data.find((p: Pipeline) => p.id === currentPipelineId) as Pipeline
            if (selectedPipeline?.pipeline_stages) {
              const stages = Array.isArray(selectedPipeline.pipeline_stages) 
                ? selectedPipeline.pipeline_stages 
                : []
              setAvailableStages(stages.sort((a, b) => a.display_order - b.display_order))
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar pipelines:', error)
        if (mounted) {
          toast.error('Erro ao carregar pipelines')
        }
      } finally {
        if (mounted) {
          setLoadingPipelines(false)
        }
      }
    }
    
    loadPipelines()
    
    return () => {
      mounted = false
    }
  }, []) // Sem dependências para carregar apenas uma vez

  // Atualizar stages quando pipeline mudar
  useEffect(() => {
    if (pipelineId && pipelines.length > 0) {
      const selectedPipeline = pipelines.find(p => p.id === pipelineId)
      if (selectedPipeline?.pipeline_stages) {
        const stages = Array.isArray(selectedPipeline.pipeline_stages) 
          ? selectedPipeline.pipeline_stages 
          : []
        setAvailableStages(stages.sort((a, b) => a.display_order - b.display_order))
        // Limpar stage se não pertencer ao novo pipeline
        if (stageId && !stages.find(s => s.id === stageId)) {
          setStageId('')
        }
      } else {
        setAvailableStages([])
        setStageId('')
      }
    } else {
      setAvailableStages([])
      if (!pipelineId) {
        setStageId('')
      }
    }
  }, [pipelineId, pipelines]) // Removido stageId das dependências para evitar loop

  const handleSave = useCallback(async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('status', status)
      
      // Enviar pipeline_id apenas se tiver valor
      if (pipelineId) {
        formData.append('pipeline_id', pipelineId)
      } else {
        // Enviar string vazia para limpar o pipeline
        formData.append('pipeline_id', '')
      }
      
      // Enviar pipeline_stage_id apenas se tiver valor e pipeline_id também tiver
      if (stageId && pipelineId) {
        formData.append('pipeline_stage_id', stageId)
      } else {
        // Enviar string vazia para limpar o stage
        formData.append('pipeline_stage_id', '')
      }

      const result = await updateContact(contactId, formData)
      
      if (result.success) {
        toast.success('Status e pipeline atualizados com sucesso!')
        // Usar setTimeout para evitar refresh imediato
        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        const errorMessage = result.error || 'Erro ao atualizar'
        toast.error(errorMessage)
        console.error('Erro ao atualizar contato:', result)
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      toast.error('Erro ao atualizar status e pipeline')
    } finally {
      setLoading(false)
    }
  }, [contactId, status, pipelineId, stageId, router, toast])

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-4 md:p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Status e Pipeline</h2>
      <div className="space-y-3 md:space-y-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
          >
            <option value={ContactStatus.LEAD}>Lead</option>
            <option value={ContactStatus.PROSPECT}>Prospect</option>
            <option value={ContactStatus.CLIENT}>Cliente</option>
            <option value={ContactStatus.INACTIVE}>Inativo</option>
          </select>
        </div>

        <div>
          <label htmlFor="pipeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pipeline
          </label>
          {loadingPipelines ? (
            <div className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-500 dark:text-gray-400 min-h-[44px] md:min-h-0 flex items-center">
              Carregando pipelines...
            </div>
          ) : (
            <select
              id="pipeline"
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
            >
              <option value="">Selecione um pipeline...</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          )}
          {pipelines.length === 0 && !loadingPipelines && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Nenhum pipeline configurado. Configure pipelines em CRM → Pipelines.
            </p>
          )}
        </div>

        {pipelineId && (
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etapa do Pipeline
            </label>
            {availableStages.length === 0 ? (
              <div className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-500 dark:text-gray-400 min-h-[44px] md:min-h-0 flex items-center">
                Nenhuma etapa disponível para este pipeline
              </div>
            ) : (
              <select
                id="stage"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
              >
                <option value="">Selecione uma etapa...</option>
                {availableStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || loadingPipelines}
          className="w-full rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-3 md:py-2.5 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
