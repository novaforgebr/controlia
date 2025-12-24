'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateContact } from '@/app/actions/contacts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Pipeline {
  id: string
  name: string
  is_default: boolean
  pipeline_stages: Array<{
    id: string
    name: string
    color: string
    display_order: number
    is_closed: boolean
    is_lost: boolean
  }>
}

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  pipeline_id: string | null
  pipeline_stage_id: string | null
  last_interaction_at: string | null
  contacts?: any
}

interface KanbanViewProps {
  pipelines: Pipeline[]
  selectedPipelineId?: string
}

export function KanbanView({ pipelines, selectedPipelineId }: KanbanViewProps) {
  const router = useRouter()
  const [selectedPipeline, setSelectedPipeline] = useState<string | undefined>(selectedPipelineId)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(!!selectedPipelineId)
  const [draggedContact, setDraggedContact] = useState<string | null>(null)

  useEffect(() => {
    if (selectedPipeline) {
      loadContacts()
    } else {
      setContacts([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPipeline])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPipeline) {
        params.set('pipeline_id', selectedPipeline)
      }
      const response = await fetch(`/api/contacts?${params.toString()}`)
      const result = await response.json()
      if (result.data) {
        setContacts(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContact(contactId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (!draggedContact || !selectedPipeline) return

    const contact = contacts.find((c) => c.id === draggedContact)
    if (!contact || contact.pipeline_stage_id === stageId) {
      setDraggedContact(null)
      return
    }

    // Atualizar contato no estado imediatamente (otimistic update)
    const updatedContacts = contacts.map((c) =>
      c.id === draggedContact
        ? { ...c, pipeline_id: selectedPipeline, pipeline_stage_id: stageId }
        : c
    )
    setContacts(updatedContacts)
    setDraggedContact(null)

    // Atualizar no servidor
    try {
      const formData = new FormData()
      formData.append('pipeline_id', selectedPipeline)
      formData.append('pipeline_stage_id', stageId)

      const result = await updateContact(draggedContact, formData)
      if (result.error) {
        // Reverter em caso de erro
        setContacts(contacts)
        alert(result.error || 'Erro ao mover contato')
      } else {
        router.refresh()
      }
    } catch (error) {
      // Reverter em caso de erro
      setContacts(contacts)
      alert('Erro ao mover contato')
    }
  }

  const currentPipeline = pipelines.find((p) => p.id === selectedPipeline)
  const sortedStages = currentPipeline?.pipeline_stages
    ? [...currentPipeline.pipeline_stages].sort((a, b) => a.display_order - b.display_order)
    : []

  const getContactsForStage = (stageId: string) => {
    // Contatos que pertencem ao pipeline selecionado E estão neste estágio
    return contacts.filter((c) => c.pipeline_id === selectedPipeline && c.pipeline_stage_id === stageId)
  }

  const getContactsWithoutStage = () => {
    // Contatos que pertencem ao pipeline mas não têm estágio definido
    return contacts.filter((c) => c.pipeline_id === selectedPipeline && (!c.pipeline_stage_id || c.pipeline_stage_id === null))
  }

  if (pipelines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow dark:shadow-gray-900/50">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum pipeline encontrado</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Crie um pipeline primeiro para usar a visualização Kanban</p>
        <Link
          href="/crm/pipelines/new"
          className="mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
        >
          Criar Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Pipeline */}
      <div className="rounded-lg bg-white dark:bg-gray-900 p-4 shadow dark:shadow-gray-900/50">
        <label htmlFor="pipeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pipeline
        </label>
        <select
          id="pipeline"
          value={selectedPipeline || ''}
          onChange={(e) => {
            setSelectedPipeline(e.target.value)
            router.push(`/crm/kanban?pipeline_id=${e.target.value}`)
          }}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
        >
          <option value="">Selecione um pipeline...</option>
          {pipelines.map((pipeline) => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.name} {pipeline.is_default && '(Padrão)'}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
            <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">Carregando contatos...</p>
          </div>
        </div>
      ) : !selectedPipeline ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow dark:shadow-gray-900/50">
          <p className="text-gray-600 dark:text-gray-400">Selecione um pipeline para visualizar o Kanban</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Coluna: Sem estágio */}
          {getContactsWithoutStage().length > 0 && (
            <div className="flex-shrink-0 w-80">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Sem Estágio</h3>
                <div className="space-y-3">
                  {getContactsWithoutStage().map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      className="cursor-move rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Link href={`/contacts/${contact.id}`}>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</h4>
                        {contact.email && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{contact.phone}</p>
                        )}
                        {contact.last_interaction_at && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(contact.last_interaction_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Colunas dos estágios */}
          {sortedStages.map((stage) => {
            const stageContacts = getContactsForStage(stage.id)

            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div
                  className="rounded-lg border-2 border-dashed p-4 transition-colors"
                  style={{
                    borderColor: stage.color,
                    backgroundColor: `${stage.color}10`,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                    </div>
                    <span className="rounded-full bg-white dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {stageContacts.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {stageContacts.map((contact) => (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact.id)}
                        className="cursor-move rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Link href={`/contacts/${contact.id}`}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</h4>
                          {contact.email && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{contact.email}</p>
                          )}
                          {contact.phone && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{contact.phone}</p>
                          )}
                          {contact.last_interaction_at && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(contact.last_interaction_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </Link>
                      </div>
                    ))}
                    {stageContacts.length === 0 && (
                      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-sm text-gray-400 dark:text-gray-500">Arraste contatos aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

