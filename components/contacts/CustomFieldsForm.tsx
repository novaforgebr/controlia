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
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
        <svg className="h-5 w-5 text-[#039155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900">Campos Customizados</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

      {activeFields.map((field: CustomField) => {
        const fieldValue = contactCustomFields[field.field_key] || ''

        switch (field.field_type) {
          case 'text':
            return (
              <div key={field.id} className="sm:col-span-2">
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>
            )

          case 'textarea':
            return (
              <div key={field.id} className="sm:col-span-2">
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  rows={4}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 resize-none"
                />
              </div>
            )

          case 'number':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={fieldValue ? Number(fieldValue) : ''}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>
            )

          case 'date':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="date"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={fieldValue ? String(fieldValue).split('T')[0] : ''}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>
            )

          case 'datetime':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="datetime-local"
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={fieldValue ? (() => {
                    try {
                      const date = new Date(fieldValue as string)
                      // Formato datetime-local: YYYY-MM-DDTHH:mm
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const hours = String(date.getHours()).padStart(2, '0')
                      const minutes = String(date.getMinutes()).padStart(2, '0')
                      return `${year}-${month}-${day}T${hours}:${minutes}`
                    } catch {
                      return ''
                    }
                  })() : ''}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>
            )

          case 'select':
            return (
              <div key={field.id}>
                <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  id={`custom_${field.field_key}`}
                  name={`custom_${field.field_key}`}
                  defaultValue={String(fieldValue)}
                  required={field.is_required}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <input
                    type="checkbox"
                    id={`custom_${field.field_key}`}
                    name={`custom_${field.field_key}`}
                    value="true"
                    defaultChecked={fieldValue === true || fieldValue === 'true'}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                  />
                  <div className="flex-1">
                    <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                      {field.field_label}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                </div>
              </div>
            )

          default:
            return null
        }
      })}
      </div>
    </div>
  )
}

