'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'
import Link from 'next/link'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  is_all_day: boolean
  location: string | null
  contact_id: string | null
  visibility: string
  status: string
}

interface EditCalendarEventFormProps {
  event: CalendarEvent
  contacts: Array<{ id: string; name: string; email: string | null }>
}

export function EditCalendarEventForm({ event, contacts }: EditCalendarEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAllDay, setIsAllDay] = useState(event.is_all_day)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const startDate = new Date(event.start_at)
  const endDate = new Date(event.end_at)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Combinar data e hora
    const startDateInput = formData.get('start_at') as string
    const endDateInput = formData.get('end_at') as string
    
    if (isAllDay) {
      formData.set('start_at', `${startDateInput}T00:00:00`)
      formData.set('end_at', `${endDateInput}T23:59:59`)
      formData.set('is_all_day', 'true')
    } else {
      const startTime = formData.get('start_time') as string || '09:00'
      const endTime = formData.get('end_time') as string || '10:00'
      formData.set('start_at', `${startDateInput}T${startTime}:00`)
      formData.set('end_at', `${endDateInput}T${endTime}:00`)
      formData.set('is_all_day', 'false')
    }
    
    formData.delete('start_time')
    formData.delete('end_time')

    const result = await updateCalendarEvent(event.id, formData)

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

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setLoading(true)
    const result = await deleteCalendarEvent(event.id)

    if (result.success) {
      router.push('/calendar')
      router.refresh()
    } else {
      alert(result.error || 'Erro ao deletar evento')
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={event.title}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={event.description || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_at" className="block text-sm font-medium text-gray-700">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_at"
            name="start_at"
            required
            defaultValue={format(startDate, 'yyyy-MM-dd')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>
        {!isAllDay && (
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
              Hora de Início
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              defaultValue={format(startDate, 'HH:mm')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="end_at" className="block text-sm font-medium text-gray-700">
            Data de Término <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="end_at"
            name="end_at"
            required
            defaultValue={format(endDate, 'yyyy-MM-dd')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>
        {!isAllDay && (
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
              Hora de Término
            </label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              defaultValue={format(endDate, 'HH:mm')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
          className="rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
        />
        <label htmlFor="is_all_day" className="ml-2 text-sm text-gray-700">
          Dia inteiro
        </label>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Localização
        </label>
        <input
          type="text"
          id="location"
          name="location"
          defaultValue={event.location || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          placeholder="Ex: Sala de reuniões, Online, etc."
        />
      </div>

      <div>
        <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
          Relacionado a Contato
        </label>
        <select
          id="contact_id"
          name="contact_id"
          defaultValue={event.contact_id || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
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
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
          Visibilidade
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={event.visibility}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        >
          <option value="private">Privado (apenas eu)</option>
          <option value="company">Empresa (todos da empresa)</option>
          <option value="public">Público</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={event.status}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
        >
          <option value="scheduled">Agendado</option>
          <option value="confirmed">Confirmado</option>
          <option value="cancelled">Cancelado</option>
          <option value="completed">Concluído</option>
        </select>
      </div>

      <div className="flex justify-between gap-3">
        <div>
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deletando...' : 'Confirmar Exclusão'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Deletar Evento
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/calendar"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </form>
  )
}

