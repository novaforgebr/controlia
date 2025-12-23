'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarFiltersProps {
  onFilterChange: (filters: {
    startDate?: Date
    endDate?: Date
    status?: string
    contactId?: string
    visibility?: string
  }) => void
  contacts: Array<{ id: string; name: string; email: string | null }>
}

export function CalendarFilters({ onFilterChange, contacts }: CalendarFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    startDate?: string
    endDate?: string
    status?: string
    contactId?: string
    visibility?: string
  }>({})

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)

    onFilterChange({
      startDate: newFilters.startDate ? new Date(newFilters.startDate) : undefined,
      endDate: newFilters.endDate ? new Date(newFilters.endDate) : undefined,
      status: newFilters.status,
      contactId: newFilters.contactId,
      visibility: newFilters.visibility,
    })
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((v) => v)

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-[#039155] px-2 py-0.5 text-xs font-medium text-white">
              {Object.values(filters).filter((v) => v).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-[#039155]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Data Início
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Data Fim
            </label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700">
              Contato
            </label>
            <select
              id="contactId"
              value={filters.contactId || ''}
              onChange={(e) => handleFilterChange('contactId', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
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
              value={filters.visibility || ''}
              onChange={(e) => handleFilterChange('visibility', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todas</option>
              <option value="private">Privado</option>
              <option value="company">Empresa</option>
              <option value="public">Público</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

