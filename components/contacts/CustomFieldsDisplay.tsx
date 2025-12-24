import { listCustomFields } from '@/app/actions/custom-fields'

interface CustomFieldsDisplayProps {
  customFields: Record<string, unknown>
}

export async function CustomFieldsDisplay({ customFields }: CustomFieldsDisplayProps) {
  const { data: fields } = await listCustomFields()

  if (!fields || fields.length === 0 || !customFields || Object.keys(customFields).length === 0) {
    return null
  }

  // Filtrar apenas campos ativos que têm valores
  const activeFieldsWithValues = fields
    .filter((field: any) => field.is_active && customFields[field.field_key] !== null && customFields[field.field_key] !== undefined && customFields[field.field_key] !== '')
    .sort((a: any, b: any) => a.display_order - b.display_order)

  if (activeFieldsWithValues.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Campos Customizados</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {activeFieldsWithValues.map((field: any) => {
          const value = customFields[field.field_key]

          let displayValue: string
          if (field.field_type === 'boolean') {
            displayValue = value === true || value === 'true' ? 'Sim' : 'Não'
          } else if (field.field_type === 'date' && value) {
            try {
              displayValue = new Date(value as string).toLocaleDateString('pt-BR')
            } catch {
              displayValue = String(value)
            }
          } else {
            displayValue = String(value)
          }

          return (
            <div key={field.id}>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{field.field_label}</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{displayValue}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

