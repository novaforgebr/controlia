import { createCustomField } from '@/app/actions/custom-fields'
import { redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldsFormClient } from '@/components/contacts/CustomFieldsFormClient'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import Link from 'next/link'

export default function NewCustomFieldPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createCustomField(formData)
    if (result.success) {
      redirect('/contacts/custom-fields')
    } else {
      // Em produção, você pode usar um sistema de notificações melhor
      console.error('Erro:', result.error)
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Contatos', href: '/contacts' },
            { label: 'Campos Customizados', href: '/contacts/custom-fields' },
            { label: 'Novo Campo' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Campo Customizado</h1>
          <p className="mt-2 text-gray-600">Crie um campo personalizado para seus contatos</p>
        </div>

        <form action={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-6">
            {/* Chave do campo */}
            <div>
              <label htmlFor="field_key" className="block text-sm font-medium text-gray-700">
                Chave do Campo <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Apenas letras minúsculas, números e underscore. Ex: empresa, cargo, data_contratacao
              </p>
              <input
                type="text"
                id="field_key"
                name="field_key"
                required
                pattern="[a-z0-9_]+"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] font-mono text-sm"
                placeholder="Ex: empresa"
              />
            </div>

            {/* Label do campo */}
            <div>
              <label htmlFor="field_label" className="block text-sm font-medium text-gray-700">
                Nome do Campo <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Nome que será exibido nos formulários
              </p>
              <input
                type="text"
                id="field_label"
                name="field_label"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Ex: Empresa"
              />
            </div>

            {/* Tipo do campo */}
            <div>
              <label htmlFor="field_type" className="block text-sm font-medium text-gray-700">
                Tipo do Campo <span className="text-red-500">*</span>
              </label>
              <select
                id="field_type"
                name="field_type"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              >
                <option value="text">Texto</option>
                <option value="textarea">Texto Longo</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
                <option value="select">Seleção</option>
                <option value="boolean">Sim/Não</option>
              </select>
            </div>

            {/* Opções (apenas para select) */}
            <div id="options-field" className="hidden">
              <label htmlFor="field_options" className="block text-sm font-medium text-gray-700">
                Opções (separadas por vírgula)
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Ex: Opção 1, Opção 2, Opção 3
              </p>
              <input
                type="text"
                id="field_options"
                name="field_options"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Ex: Pequena, Média, Grande"
              />
            </div>

            {/* Ordem de exibição */}
            <div>
              <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
                Ordem de Exibição
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Campos com menor número aparecem primeiro
              </p>
              <input
                type="number"
                id="display_order"
                name="display_order"
                min="0"
                defaultValue="0"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_required"
                  value="true"
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">Campo obrigatório</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked
                  className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700">Campo ativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/contacts/custom-fields"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Criar Campo
            </button>
          </div>
        </form>

        <CustomFieldsFormClient />
      </div>
    </ProtectedLayout>
  )
}

