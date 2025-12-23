'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ViewMode = 'list' | 'kanban' | 'pipelines' | 'fields'

export function CRMDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [pipelines, setPipelines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      const response = await fetch('/api/pipelines')
      const result = await response.json()
      if (result.data) {
        setPipelines(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs de navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('list')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'border-[#039155] text-[#039155]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Lista de Contatos
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'border-[#039155] text-[#039155]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('pipelines')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              viewMode === 'pipelines'
                ? 'border-[#039155] text-[#039155]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Pipelines
          </button>
          <button
            onClick={() => setViewMode('fields')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              viewMode === 'fields'
                ? 'border-[#039155] text-[#039155]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Campos Personalizados
          </button>
        </nav>
      </div>

      {/* Conteúdo baseado na view selecionada */}
      <div className="mt-6">
        {viewMode === 'list' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Lista de Contatos</h2>
              <Link
                href="/contacts/new"
                className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                + Novo Contato
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Visualize todos os contatos em formato de lista.
            </p>
            <Link
              href="/contacts"
              className="inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Acessar Página Completa de Contatos →
            </Link>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Visualização Kanban</h2>
              <Link
                href="/contacts/new"
                className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                + Novo Contato
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Visualize contatos organizados por estágios do pipeline em formato Kanban.
            </p>
            <Link
              href="/crm/kanban"
              className="inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Acessar Visualização Kanban Completa →
            </Link>
          </div>
        )}

        {viewMode === 'pipelines' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Pipelines</h2>
              <Link
                href="/crm/pipelines/new"
                className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                + Novo Pipeline
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure e gerencie pipelines de vendas com estágios personalizados.
            </p>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <p className="text-sm">Carregando pipelines...</p>
              </div>
            ) : pipelines.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Nenhum pipeline configurado</p>
                <Link
                  href="/crm/pipelines/new"
                  className="mt-4 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Criar Primeiro Pipeline
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{pipeline.name}</h3>
                          {pipeline.is_default && (
                            <span className="inline-flex rounded-full bg-[#039155] px-2 py-0.5 text-xs font-medium text-white">
                              Padrão
                            </span>
                          )}
                        </div>
                        {pipeline.description && (
                          <p className="mt-1 text-sm text-gray-600">{pipeline.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {pipeline.pipeline_stages?.length || 0} estágios
                        </p>
                      </div>
                      <Link
                        href={`/crm/pipelines/${pipeline.id}/edit`}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Gerenciar
                      </Link>
                    </div>
                  </div>
                ))}
                <Link
                  href="/crm/pipelines"
                  className="mt-4 inline-block text-sm text-[#039155] hover:underline"
                >
                  Ver todos os pipelines →
                </Link>
              </div>
            )}
          </div>
        )}

        {viewMode === 'fields' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Campos Personalizados</h2>
              <Link
                href="/contacts/custom-fields/new"
                className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                + Novo Campo
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Gerencie todos os campos personalizados disponíveis para contatos.
            </p>
            <Link
              href="/contacts/custom-fields"
              className="inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Acessar Página Completa de Campos Personalizados →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

