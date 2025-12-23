'use client'

import { useEffect } from 'react'

/**
 * Componente Client para mostrar/ocultar campo de opções baseado no tipo de campo
 */
export function CustomFieldsFormClient() {
  useEffect(() => {
    const fieldType = document.getElementById('field_type') as HTMLSelectElement
    const optionsField = document.getElementById('options-field') as HTMLDivElement
    const fieldOptionsInput = document.getElementById('field_options') as HTMLInputElement

    if (!fieldType || !optionsField) return

    const toggleOptionsField = () => {
      if (fieldType.value === 'select') {
        optionsField.classList.remove('hidden')
        if (fieldOptionsInput) {
          fieldOptionsInput.required = true
        }
      } else {
        optionsField.classList.add('hidden')
        if (fieldOptionsInput) {
          fieldOptionsInput.required = false
        }
      }
    }

    fieldType.addEventListener('change', toggleOptionsField)
    
    // Verificar estado inicial
    toggleOptionsField()

    return () => {
      fieldType.removeEventListener('change', toggleOptionsField)
    }
  }, [])

  return null
}

