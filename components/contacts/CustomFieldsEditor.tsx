'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateContact } from '@/app/actions/contacts'
import { useToast } from '@/lib/hooks/use-toast'

interface CustomField {
  id: string
  field_key: string
  field_label: string
  field_type: string
  is_required: boolean
  display_order: number
}

interface CustomFieldsEditorProps {
  contactId: string
  customFields: Record<string, unknown>
  fields: CustomField[]
}

export function CustomFieldsEditor({ contactId, customFields, fields }: CustomFieldsEditorProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const router = useRouter()
  const toast = useToast()

  // Inicializar formData com valores existentes
  useEffect(() => {
    const initialData: Record<string, string | boolean> = {}
    fields.forEach((field) => {
      const value = customFields[field.field_key]
      if (field.field_type === 'boolean') {
        initialData[field.field_key] = value === true || value === 'true' || false
      } else {
        initialData[field.field_key] = value ? String(value) : ''
      }
    })
    setFormData(initialData)
  }, [customFields, fields])

  const handleFieldChange = (fieldKey: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const form = new FormData()
      
      // Adicionar campos customizados
      Object.entries(formData).forEach(([key, value]) => {
        form.append(`custom_${key}`, String(value))
      })

      const result = await updateContact(contactId, form)
      if (result.success) {
        toast.success('Campos customizados atualizados com sucesso!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao atualizar campos')
      }
    } catch (error) {
      console.error('Erro ao atualizar campos:', error)
      toast.error('Erro ao atualizar campos customizados')
    } finally {
      setLoading(false)
    }
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Campos Customizados</h2>
        <p className="text-sm text-gray-500">Nenhum campo customizado configurado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Editar Campos Customizados</h2>
      <div className="space-y-4">
        {fields.map((field) => {
          const value = formData[field.field_key] ?? (customFields[field.field_key] || '')

          switch (field.field_type) {
            case 'text':
              return (
                <div key={field.id}>
                  <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    id={`custom_${field.field_key}`}
                    value={String(value)}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    required={field.is_required}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  />
                </div>
              )

            case 'textarea':
              return (
                <div key={field.id}>
                  <label htmlFor={`custom_${field.field_key}`} className="block text-sm font-medium text-gray-700">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    id={`custom_${field.field_key}`}
                    value={String(value)}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    required={field.is_required}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
                    value={String(value)}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    required={field.is_required}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
                    value={value ? new Date(value as string).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    required={field.is_required}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  />
                </div>
              )

            case 'boolean':
              return (
                <div key={field.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`custom_${field.field_key}`}
                    checked={value === true || value === 'true'}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
                    className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                  />
                  <label htmlFor={`custom_${field.field_key}`} className="ml-2 text-sm font-medium text-gray-700">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              )

            default:
              return null
          }
        })}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Salvar Campos Customizados'}
        </button>
      </div>
    </div>
  )
}

