'use client'

import { useState } from 'react'
import { updateCompanySettings } from '@/app/actions/companies'

interface GeneralSettingsProps {
  settings: Record<string, unknown>
}

export function GeneralSettings({ settings }: GeneralSettingsProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await updateCompanySettings(formData)
    setLoading(false)
    if (result.success) {
      alert('Configurações salvas com sucesso!')
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao salvar configurações')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configurações Gerais</h2>
        <p className="mt-2 text-sm text-gray-600">Configure as preferências gerais da plataforma</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Configurações de IA */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inteligência Artificial</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="ai_global_enabled"
                value="true"
                defaultChecked={settings.ai_global_enabled === true}
                className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
              />
              <span className="ml-2 text-sm text-gray-700">IA habilitada globalmente</span>
            </label>
            <div>
              <label htmlFor="ai_default_model" className="block text-sm font-medium text-gray-700">
                Modelo padrão de IA
              </label>
              <select
                id="ai_default_model"
                name="ai_default_model"
                defaultValue={(settings.ai_default_model as string) || 'gpt-4'}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            <div>
              <label htmlFor="ai_temperature" className="block text-sm font-medium text-gray-700">
                Temperature (0-2)
              </label>
              <input
                type="number"
                id="ai_temperature"
                name="ai_temperature"
                min="0"
                max="2"
                step="0.1"
                defaultValue={(settings.ai_temperature as number) || 0.7}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Notificações */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications_email_enabled"
                value="true"
                defaultChecked={settings.notifications_email_enabled === true}
                className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
              />
              <span className="ml-2 text-sm text-gray-700">Notificações por email</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications_new_conversation"
                value="true"
                defaultChecked={settings.notifications_new_conversation === true}
                className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
              />
              <span className="ml-2 text-sm text-gray-700">Notificar sobre novas conversas</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications_ai_actions"
                value="true"
                defaultChecked={settings.notifications_ai_actions === false}
                className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
              />
              <span className="ml-2 text-sm text-gray-700">Notificar sobre ações da IA</span>
            </label>
          </div>
        </div>

        {/* Configurações de Privacidade */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacidade e Segurança</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="data_retention_enabled"
                value="true"
                defaultChecked={settings.data_retention_enabled === true}
                className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
              />
              <span className="ml-2 text-sm text-gray-700">Retenção automática de dados</span>
            </label>
            <div>
              <label htmlFor="data_retention_days" className="block text-sm font-medium text-gray-700">
                Dias de retenção de dados (0 = indefinido)
              </label>
              <input
                type="number"
                id="data_retention_days"
                name="data_retention_days"
                min="0"
                defaultValue={(settings.data_retention_days as number) || 0}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}

