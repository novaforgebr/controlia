'use client'

import { useState } from 'react'
import { updateAutomationN8nConfig } from '@/app/actions/automations'

interface N8nSettingsProps {
  automations: Array<{
    id: string
    name: string
    n8n_webhook_url: string | null
    n8n_workflow_id: string | null
    is_active: boolean
  }>
}

export function N8nSettings({ automations }: N8nSettingsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (automationId: string, formData: FormData) => {
    setLoading(true)
    const result = await updateAutomationN8nConfig(automationId, formData)
    setLoading(false)
    if (result.success) {
      setEditingId(null)
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao salvar configuração')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuração n8n</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure os webhooks e IDs de workflows do n8n para suas automações
        </p>
      </div>

      {automations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma automação encontrada</h3>
          <p className="mt-2 text-gray-600">Crie automações para configurar webhooks do n8n</p>
          <a
            href="/automations"
            className="mt-4 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Criar Automação
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    {automation.n8n_workflow_id && (
                      <div>
                        <span className="font-medium text-gray-500">Workflow ID:</span>{' '}
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                          {automation.n8n_workflow_id}
                        </code>
                      </div>
                    )}
                    {automation.n8n_webhook_url && (
                      <div>
                        <span className="font-medium text-gray-500">Webhook URL:</span>{' '}
                        <code className="block mt-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800 break-all">
                          {automation.n8n_webhook_url}
                        </code>
                      </div>
                    )}
                    {!automation.n8n_webhook_url && !automation.n8n_workflow_id && (
                      <p className="text-gray-500">Nenhuma configuração do n8n definida</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(editingId === automation.id ? null : automation.id)}
                  className="ml-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {editingId === automation.id ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editingId === automation.id && (
                <form
                  action={(formData) => handleSave(automation.id, formData)}
                  className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div>
                    <label htmlFor={`workflow_id_${automation.id}`} className="block text-sm font-medium text-gray-700">
                      Workflow ID do n8n
                    </label>
                    <input
                      type="text"
                      id={`workflow_id_${automation.id}`}
                      name="n8n_workflow_id"
                      defaultValue={automation.n8n_workflow_id || ''}
                      placeholder="Ex: 123"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      ID numérico do workflow no n8n
                    </p>
                  </div>

                  <div>
                    <label htmlFor={`webhook_url_${automation.id}`} className="block text-sm font-medium text-gray-700">
                      Webhook URL do n8n
                    </label>
                    <input
                      type="url"
                      id={`webhook_url_${automation.id}`}
                      name="n8n_webhook_url"
                      defaultValue={automation.n8n_webhook_url || ''}
                      placeholder="https://seu-n8n.com/webhook/..."
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL completa do webhook do n8n para esta automação
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Informações sobre n8n */}
      <div className="mt-8 rounded-lg bg-gradient-to-r from-[#039155]/5 to-[#18B0BB]/5 border border-[#039155]/20 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Como configurar o n8n</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Crie um workflow no n8n com um nó de Webhook</li>
          <li>Copie o ID do workflow (número) e a URL do webhook</li>
          <li>Cole essas informações na automação correspondente acima</li>
          <li>O CRM enviará eventos para o webhook configurado automaticamente</li>
        </ol>
      </div>
    </div>
  )
}

