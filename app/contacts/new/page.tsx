import { createContact } from '@/app/actions/contacts'
import { redirect } from 'next/navigation'
import { ContactStatus } from '@/lib/types/database'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldsForm } from '@/components/contacts/CustomFieldsForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default function NewContactPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createContact(formData)
    if (result.success) {
      redirect('/contacts')
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Contatos', href: '/contacts' },
            { label: 'Novo Contato' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Contato</h1>
          <p className="mt-2 text-gray-600">Adicione um novo contato ao sistema</p>
        </div>

        <form action={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                WhatsApp
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                placeholder="Ex: +5511999999999"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700">
                CPF/CNPJ
              </label>
              <input
                type="text"
                id="document"
                name="document"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={ContactStatus.LEAD}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              >
                <option value={ContactStatus.LEAD}>Lead</option>
                <option value={ContactStatus.PROSPECT}>Prospect</option>
                <option value={ContactStatus.CLIENT}>Cliente</option>
                <option value={ContactStatus.INACTIVE}>Inativo</option>
              </select>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Origem
              </label>
              <input
                type="text"
                id="source"
                name="source"
                placeholder="Ex: Site, indicação, redes sociais..."
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div>
              <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                Score (0-100)
              </label>
              <input
                type="number"
                id="score"
                name="score"
                min="0"
                max="100"
                defaultValue="0"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                placeholder="Ex: cliente-vip, interessado-em-x, seguimento-y"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ai_enabled"
                  value="true"
                  defaultChecked
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">IA habilitada para este contato</span>
              </label>
            </div>

            {/* Campos Customizados */}
            <CustomFieldsForm />
          </div>

          <div className="flex justify-end gap-4">
            <a
              href="/contacts"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Criar Contato
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  )
}

