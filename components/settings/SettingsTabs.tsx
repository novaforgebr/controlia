'use client'

import { useState } from 'react'
import { N8nSettings } from './N8nSettings'
import { GeneralSettings } from './GeneralSettings'
import { CompanySettings } from './CompanySettings'
import { IntegrationSettings } from './IntegrationSettings'

interface SettingsTabsProps {
  company: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  settings: Record<string, unknown>
  automations: Array<{
    id: string
    name: string
    n8n_webhook_url: string | null
    n8n_workflow_id: string | null
    is_active: boolean
  }>
}

const tabs = [
  { id: 'general', name: 'Geral', icon: '⚙️' },
  { id: 'company', name: 'Empresa', icon: '🏢' },
  { id: 'n8n', name: 'n8n', icon: '🔗' },
  { id: 'integrations', name: 'Integrações', icon: '🔌' },
]

export function SettingsTabs({ company, settings, automations }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <nav className="-mb-px flex space-x-2 md:space-x-8 px-4 md:px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-3 md:py-4 px-2 md:px-1 text-sm font-medium transition-colors min-h-[44px] md:min-h-0 ${
                activeTab === tab.id
                  ? 'border-[#039155] text-[#039155] dark:text-[#18B0BB]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-1 md:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {activeTab === 'general' && <GeneralSettings settings={settings} />}
        {activeTab === 'company' && <CompanySettings company={company} />}
        {activeTab === 'n8n' && <N8nSettings automations={automations} />}
        {activeTab === 'integrations' && <IntegrationSettings settings={settings} />}
      </div>
    </div>
  )
}

