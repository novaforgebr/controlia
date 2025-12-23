'use client'

import { useState } from 'react'
import { updateCompanySettings } from '@/app/actions/companies'
import { IntegrationTutorialModal } from './IntegrationTutorialModal'

interface IntegrationSettingsProps {
  settings: Record<string, unknown>
}

export function IntegrationSettings({ settings }: IntegrationSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState<'whatsapp' | 'telegram' | 'email' | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await updateCompanySettings(formData)
    setLoading(false)
    if (result.success) {
      alert('Configurações de integração salvas com sucesso!')
      window.location.reload()
    } else {
      alert(result.error || 'Erro ao salvar configurações')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integrações</h2>
        <p className="mt-2 text-sm text-gray-600">Configure integrações externas e APIs</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* WhatsApp */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>
                <p className="text-sm text-gray-500">Configurações de integração com WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTutorialOpen('whatsapp')}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como configurar
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="whatsapp_api_url" className="block text-sm font-medium text-gray-700">
                API URL do WhatsApp
              </label>
              <input
                type="url"
                id="whatsapp_api_url"
                name="whatsapp_api_url"
                defaultValue={(settings.whatsapp_api_url as string) || ''}
                placeholder="https://api.whatsapp.com/..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="whatsapp_api_key" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="password"
                id="whatsapp_api_key"
                name="whatsapp_api_key"
                defaultValue={(settings.whatsapp_api_key as string) || ''}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>
            <div>
              <label htmlFor="whatsapp_webhook_secret" className="block text-sm font-medium text-gray-700">
                Webhook Secret
              </label>
              <input
                type="password"
                id="whatsapp_webhook_secret"
                name="whatsapp_webhook_secret"
                defaultValue={(settings.whatsapp_webhook_secret as string) || ''}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
                <p className="text-sm text-gray-500">Configurações de integração com Telegram Bot</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTutorialOpen('telegram')}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como configurar
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="telegram_bot_token" className="block text-sm font-medium text-gray-700">
                Bot Token
              </label>
              <input
                type="password"
                id="telegram_bot_token"
                name="telegram_bot_token"
                defaultValue={(settings.telegram_bot_token as string) || ''}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                Token do bot obtido através do @BotFather no Telegram
              </p>
            </div>
            <div>
              <label htmlFor="telegram_webhook_url" className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                type="url"
                id="telegram_webhook_url"
                name="telegram_webhook_url"
                defaultValue={(settings.telegram_webhook_url as string) || ''}
                placeholder="https://seu-dominio.com/api/webhooks/telegram"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL pública onde o Telegram enviará as mensagens recebidas
              </p>
            </div>
            <div>
              <label htmlFor="telegram_webhook_secret" className="block text-sm font-medium text-gray-700">
                Webhook Secret
              </label>
              <input
                type="password"
                id="telegram_webhook_secret"
                name="telegram_webhook_secret"
                defaultValue={(settings.telegram_webhook_secret as string) || ''}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
              <p className="mt-1 text-xs text-gray-500">
                Secret para validar requisições do webhook do Telegram
              </p>
            </div>
          </div>
        </div>

        {/* n8n */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">n8n</h3>
                <p className="text-sm text-gray-500">Configurações de integração com n8n (Automações)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="n8n_webhook_secret" className="block text-sm font-medium text-gray-700">
                Webhook Secret do n8n
              </label>
              <input
                type="password"
                id="n8n_webhook_secret"
                name="n8n_webhook_secret"
                defaultValue={(settings.n8n_webhook_secret as string) || ''}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
              <p className="mt-1 text-xs text-gray-500">
                Secret configurado no webhook do n8n para autenticação. Encontre nas configurações do nó &quot;Webhook&quot; no seu workflow n8n.
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                <p className="text-sm text-gray-500">Configurações de envio de email</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTutorialOpen('email')}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como configurar
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="email_smtp_host" className="block text-sm font-medium text-gray-700">
                SMTP Host
              </label>
              <input
                type="text"
                id="email_smtp_host"
                name="email_smtp_host"
                defaultValue={(settings.email_smtp_host as string) || ''}
                placeholder="smtp.gmail.com"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email_smtp_port" className="block text-sm font-medium text-gray-700">
                  Porta
                </label>
                <input
                  type="number"
                  id="email_smtp_port"
                  name="email_smtp_port"
                  defaultValue={(settings.email_smtp_port as number) || 587}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>
              <div>
                <label htmlFor="email_smtp_secure" className="block text-sm font-medium text-gray-700">
                  Seguro (TLS/SSL)
                </label>
                <select
                  id="email_smtp_secure"
                  name="email_smtp_secure"
                  defaultValue={(settings.email_smtp_secure as string) || 'tls'}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="false">Nenhum</option>
              </select>
              </div>
            </div>
            <div>
              <label htmlFor="email_smtp_user" className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <input
                type="text"
                id="email_smtp_user"
                name="email_smtp_user"
                defaultValue={(settings.email_smtp_user as string) || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>
            <div>
              <label htmlFor="email_smtp_password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                id="email_smtp_password"
                name="email_smtp_password"
                defaultValue={(settings.email_smtp_password as string) || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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

      {/* Tutorial Modals */}
      <IntegrationTutorialModal
        integration="whatsapp"
        isOpen={tutorialOpen === 'whatsapp'}
        onClose={() => setTutorialOpen(null)}
      />
      <IntegrationTutorialModal
        integration="telegram"
        isOpen={tutorialOpen === 'telegram'}
        onClose={() => setTutorialOpen(null)}
      />
      <IntegrationTutorialModal
        integration="email"
        isOpen={tutorialOpen === 'email'}
        onClose={() => setTutorialOpen(null)}
      />
    </div>
  )
}

