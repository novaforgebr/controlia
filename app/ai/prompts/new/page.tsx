import { createAIPrompt } from '@/app/actions/ai-prompts'
import { redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default function NewAIPromptPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createAIPrompt(formData)
    if (result.success) {
      redirect('/ai/prompts')
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'IA', href: '/ai' },
            { label: 'Prompts', href: '/ai/prompts' },
            { label: 'Novo Prompt' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Prompt de IA</h1>
          <p className="mt-2 text-gray-600">Crie um novo prompt para inteligência artificial</p>
        </div>

        <form action={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
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
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="context_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Contexto
                </label>
                <select
                  id="context_type"
                  name="context_type"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                >
                  <option value="">Selecione...</option>
                  <option value="conversation">Conversa</option>
                  <option value="contact">Contato</option>
                  <option value="general">Geral</option>
                </select>
              </div>

              <div>
                <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
                  Canal
                </label>
                <select
                  id="channel"
                  name="channel"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                >
                  <option value="">Todos</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="prompt_text" className="block text-sm font-medium text-gray-700">
                Texto do Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                id="prompt_text"
                name="prompt_text"
                rows={10}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
                placeholder="Ex: Você é um assistente virtual especializado em atendimento ao cliente..."
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text"
                id="model"
                name="model"
                defaultValue="gpt-4"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">Ativo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  value="true"
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">Padrão</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <a
              href="/ai/prompts"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-white hover:shadow-lg transition-all"
            >
              Criar Prompt
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  )
}

