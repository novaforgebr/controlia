import { getCustomField, updateCustomField } from '@/app/actions/custom-fields'
import { notFound, redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldsFormClient } from '@/components/contacts/CustomFieldsFormClient'
import Link from 'next/link'

export default async function EditCustomFieldPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: field } = await getCustomField(id)

  if (!field) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    'use server'
    const { id: fieldId } = await params
    const result = await updateCustomField(fieldId, formData)
    if (result.success) {
      redirect('/contacts/custom-fields')
    } else {
      console.error('Erro:', result.error)
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Editar Campo Customizado</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Atualize as informações do campo</p>
        </div>

        <form action={handleSubmit} className="space-y-6 rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-6">
            {/* Chave do campo (readonly) */}
            <div>
              <label htmlFor="field_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chave do Campo
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A chave não pode ser alterada após a criação
              </p>
              <input
                type="text"
                id="field_key"
                name="field_key"
                value={field.field_key}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 shadow-sm font-mono text-sm text-gray-500 dark:text-gray-400"
              />
            </div>

            {/* Label do campo */}
            <div>
              <label htmlFor="field_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do Campo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="field_label"
                name="field_label"
                required
                defaultValue={field.field_label}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            {/* Tipo do campo */}
            <div>
              <label htmlFor="field_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo do Campo <span className="text-red-500">*</span>
              </label>
              <select
                id="field_type"
                name="field_type"
                required
                defaultValue={field.field_type}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
            <div id="options-field" className={field.field_type === 'select' ? '' : 'hidden'}>
              <label htmlFor="field_options" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Opções (separadas por vírgula)
              </label>
              <input
                type="text"
                id="field_options"
                name="field_options"
                defaultValue={field.field_options?.join(', ') || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                placeholder="Ex: Opção 1, Opção 2, Opção 3"
              />
            </div>

            {/* Ordem de exibição */}
            <div>
              <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ordem de Exibição
              </label>
              <input
                type="number"
                id="display_order"
                name="display_order"
                min="0"
                defaultValue={field.display_order}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_required"
                  value="true"
                  defaultChecked={field.is_required}
                  className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Campo obrigatório</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked={field.is_active}
                  className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Campo ativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/contacts/custom-fields"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>

        <CustomFieldsFormClient />
      </div>
    </ProtectedLayout>
  )
}

