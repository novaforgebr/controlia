import { createAutomation } from '@/app/actions/automations'
import { redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default function NewAutomationPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createAutomation(formData)
    if (result.success) {
      redirect('/automations')
    } else {
      console.error('Erro:', result.error)
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Automações', href: '/automations' },
            { label: 'Nova Automação' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nova Automação</h1>
          <p className="mt-2 text-gray-600">Crie uma nova automação para integrar com n8n</p>
        </div>

        <form action={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Automação <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Ex: Agente IA - Mensagens"
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Descreva o que esta automação faz..."
              />
            </div>

            {/* Evento Trigger */}
            <div>
              <label htmlFor="trigger_event" className="block text-sm font-medium text-gray-700">
                Evento Trigger <span className="text-red-500">*</span>
              </label>
              <select
                id="trigger_event"
                name="trigger_event"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              >
                <option value="new_message">Nova Mensagem</option>
                <option value="new_contact">Novo Contato</option>
                <option value="contact_status_changed">Status do Contato Alterado</option>
                <option value="conversation_created">Nova Conversa</option>
                <option value="conversation_closed">Conversa Fechada</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Escolha o evento que disparará esta automação
              </p>
            </div>

            {/* Webhook URL do n8n */}
            <div>
              <label htmlFor="n8n_webhook_url" className="block text-sm font-medium text-gray-700">
                Webhook URL do n8n
              </label>
              <input
                type="url"
                id="n8n_webhook_url"
                name="n8n_webhook_url"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] font-mono text-sm"
                placeholder="https://seu-n8n.com/webhook/..."
              />
              <p className="mt-1 text-xs text-gray-500">
                URL do webhook do seu workflow n8n. Você pode configurar isso depois também.
              </p>
            </div>

            {/* Workflow ID */}
            <div>
              <label htmlFor="n8n_workflow_id" className="block text-sm font-medium text-gray-700">
                Workflow ID do n8n (opcional)
              </label>
              <input
                type="text"
                id="n8n_workflow_id"
                name="n8n_workflow_id"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Ex: 123"
              />
              <p className="mt-1 text-xs text-gray-500">
                ID numérico do workflow no n8n (opcional, apenas para referência)
              </p>
            </div>

            {/* Ativo */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">Ativar automação imediatamente</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <a
              href="/automations"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Criar Automação
            </button>
          </div>
        </form>

        {/* Informações */}
        <div className="mt-6 rounded-lg bg-gradient-to-r from-[#039155]/5 to-[#18B0BB]/5 border border-[#039155]/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Como funciona?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Crie o workflow no n8n primeiro e obtenha a URL do webhook</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cole a URL do webhook nesta automação</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Quando o evento acontecer, o Controlia enviará os dados para o n8n</span>
            </li>
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  )
}

