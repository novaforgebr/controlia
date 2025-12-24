import { listCustomFields } from '@/app/actions/custom-fields'

interface CustomFieldsDisplayAllProps {
  customFields: Record<string, unknown>
}

export async function CustomFieldsDisplayAll({ customFields }: CustomFieldsDisplayAllProps) {
  const { data: fields } = await listCustomFields()

  if (!fields || fields.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Campos Customizados</h2>
        <p className="text-sm text-gray-500">Nenhum campo customizado configurado.</p>
      </div>
    )
  }

  // Filtrar apenas campos ativos e ordenar
  const activeFields = fields
    .filter((field: any) => field.is_active)
    .sort((a: any, b: any) => a.display_order - b.display_order)

  if (activeFields.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Campos Customizados</h2>
        <p className="text-sm text-gray-500">Nenhum campo customizado ativo.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Campos Customizados</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {activeFields.map((field: any) => {
          const value = customFields[field.field_key]

          let displayValue: string
          if (field.field_type === 'boolean') {
            if (value === true || value === 'true') {
              displayValue = 'Sim'
            } else if (value === false || value === 'false') {
              displayValue = 'Não'
            } else {
              displayValue = '-'
            }
          } else if (field.field_type === 'date' && value) {
            try {
              displayValue = new Date(value as string).toLocaleDateString('pt-BR')
            } catch {
              displayValue = String(value || '-')
            }
          } else {
            displayValue = value ? String(value) : '-'
          }

          return (
            <div key={field.id}>
              <dt className="text-sm font-medium text-gray-500">{field.field_label}</dt>
              <dd className={`mt-1 text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                {displayValue}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

