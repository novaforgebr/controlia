'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

import { CalendarFilters } from './CalendarFilters'

interface CalendarViewProps {
  initialEvents?: any[]
  contacts?: Array<{ id: string; name: string; email: string | null }>
}

export function CalendarView({ initialEvents = [], contacts = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<any[]>(initialEvents)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState<{
    startDate?: Date
    endDate?: Date
    status?: string
    contactId?: string
    visibility?: string
  }>({})

  const loadEvents = async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      const params = new URLSearchParams()
      params.set('start', (filters.startDate || monthStart).toISOString())
      params.set('end', (filters.endDate || monthEnd).toISOString())
      if (filters.status) params.set('status', filters.status)
      if (filters.contactId) params.set('contact_id', filters.contactId)
      if (filters.visibility) params.set('visibility', filters.visibility)

      const response = await fetch(`/api/calendar/events?${params.toString()}`)
      const result = await response.json()
      if (result.data) {
        setEvents(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [currentDate, filters])

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start_at)
      const eventEnd = new Date(event.end_at)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      return (eventStart >= dayStart && eventStart <= dayEnd) || 
             (eventEnd >= dayStart && eventEnd <= dayEnd) ||
             (eventStart <= dayStart && eventEnd >= dayEnd)
    })
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adicionar dias do início da semana antes do mês
  const firstDayOfWeek = monthStart.getDay()
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - firstDayOfWeek + i)
    return date
  })

  // Adicionar dias do fim da semana após o mês
  const lastDayOfWeek = monthEnd.getDay()
  const daysAfterMonth = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i + 1)
    return date
  })

  const allDays = [...daysBeforeMonth, ...daysInMonth, ...daysAfterMonth]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <CalendarFilters onFilterChange={setFilters} contacts={contacts} />

      {/* Header do calendário */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={previousMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={nextMonth}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              →
            </button>
          </div>
          <button
            onClick={goToToday}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Hoje
          </button>
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}

          {/* Dias do calendário */}
          {allDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[80px] rounded-md border p-2 text-left transition-colors ${
                  isCurrentMonth
                    ? isSelected
                      ? 'border-[#039155] bg-[#039155]/10'
                      : isToday
                      ? 'border-[#039155] bg-[#039155]/5'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50 text-gray-400'
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    isToday ? 'text-[#039155]' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {getEventsForDate(day).slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="truncate rounded bg-[#039155] px-1 py-0.5 text-xs text-white"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {getEventsForDate(day).length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{getEventsForDate(day).length - 2} mais
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de eventos (se houver data selecionada) */}
      {selectedDate && (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Eventos em {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <Link
              href={`/calendar/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              + Criar Evento
            </Link>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">Carregando eventos...</p>
            </div>
          ) : getEventsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Nenhum evento agendado para esta data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {format(new Date(event.start_at), "HH:mm", { locale: ptBR })} -{' '}
                          {format(new Date(event.end_at), "HH:mm", { locale: ptBR })}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                        {event.contacts && (
                          <span>👤 {event.contacts.name}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/calendar/${event.id}/edit`}
                      className="ml-4 text-sm text-[#039155] hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

