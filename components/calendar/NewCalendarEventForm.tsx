'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCalendarEvent } from '@/app/actions/calendar'
import Link from 'next/link'

interface NewCalendarEventFormProps {
  initialDate?: string
  contacts: Array<{ id: string; name: string; email: string | null }>
}

export function NewCalendarEventForm({ initialDate, contacts }: NewCalendarEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAllDay, setIsAllDay] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Combinar data e hora
    const startDate = formData.get('start_at') as string
    const endDate = formData.get('end_at') as string
    
    if (isAllDay) {
      formData.set('start_at', `${startDate}T00:00:00`)
      formData.set('end_at', `${endDate}T23:59:59`)
      formData.set('is_all_day', 'true')
    } else {
      const startTime = formData.get('start_time') as string || '09:00'
      const endTime = formData.get('end_time') as string || '10:00'
      formData.set('start_at', `${startDate}T${startTime}:00`)
      formData.set('end_at', `${endDate}T${endTime}:00`)
      formData.set('is_all_day', 'false')
    }
    
    // Remover campos de hora que não são enviados
    formData.delete('start_time')
    formData.delete('end_time')

    const result = await createCalendarEvent(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      router.push('/calendar')
      router.refresh()
    }
  }

  const defaultDate = initialDate || new Date().toISOString().split('T')[0]
  const defaultStartTime = '09:00'
  const defaultEndTime = '10:00'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Reunião com cliente"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Detalhes do evento..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_at"
            name="start_at"
            required
            defaultValue={defaultDate}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>
        {!isAllDay && (
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora de Início
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              defaultValue={defaultStartTime}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="end_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data de Término <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="end_at"
            name="end_at"
            required
            defaultValue={defaultDate}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>
        {!isAllDay && (
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora de Término
            </label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              defaultValue={defaultEndTime}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_all_day"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155]"
        />
        <label htmlFor="is_all_day" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Dia inteiro
        </label>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Localização
        </label>
        <input
          type="text"
          id="location"
          name="location"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Sala de reuniões, Online, etc."
        />
      </div>

      <div>
        <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Relacionado a Contato
        </label>
        <select
          id="contact_id"
          name="contact_id"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        >
          <option value="">Nenhum</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name} {contact.email && `(${contact.email})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Visibilidade
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue="company"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        >
          <option value="private">Privado (apenas eu)</option>
          <option value="company">Empresa (todos da empresa)</option>
          <option value="public">Público</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/calendar"
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar Evento'}
        </button>
      </div>
    </form>
  )
}

