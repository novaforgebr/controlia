import { listCustomFields } from '@/app/actions/custom-fields'

interface CustomField {
  id: string
  field_key: string
  field_label: string
  field_type: string
  field_options?: string[]
  is_required: boolean
  is_active: boolean
  display_order: number
}

interface CustomFieldsFormProps {
  contactCustomFields?: Record<string, unknown>
}

export async function CustomFieldsForm({ contactCustomFields = {} }: CustomFieldsFormProps) {
  const { data: fields } = await listCustomFields()

  // Filtrar apenas campos ativos e ordenar
  const activeFields = (fields || [])
    .filter((field: CustomField) => field.is_active)
    .sort((a: CustomField, b: CustomField) => a.display_order - b.display_order)

  if (activeFields.length === 0) {
    return null
  }

  return (
    <>
      <div className="sm:col-span-2 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campos Customizados</h3>
      </div>

      {activeFields.map((field: CustomField) => {
        const fieldValue = contactCustomFields[field.field_key] || ''

        switch (field.field_type) {
          case 'text':
            return (
              <div key={field.id} className="sm:col-span-2">
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                />
              </div>
            )

          case 'textarea':
            return (
              <div key={field.id} className="sm:col-span-2">
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  rows={3}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                />
              </div>
            )

          case 'number':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={fieldValue ? Number(fieldValue) : ''}
                  required={field.is_required}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                />
              </div>
            )

          case 'date':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="date"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={fieldValue ? String(fieldValue).split('T')[0] : ''}
                  required={field.is_required}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
                />
              </div>
            )

          case 'select':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                >
                  <option value="">Selecione...</option>
                  {field.field_options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )

          case 'boolean':
            return (
              <div key={field.id} className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id={`custom_${field.field_key}`}
                    name={`custom_${field.field_key}`}
                    value="true"
                    defaultChecked={fieldValue === true || fieldValue === 'true'}
                    className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              </div>
            )

          default:
            return null
        }
      })}
    </>
  )
}

