import { getCurrentCompany } from '@/lib/utils/company'
import ProtectedLayout from '@/app/layout-protected'
import { CalendarView } from '@/components/calendar/CalendarView'
import { listCalendarEvents } from '@/app/actions/calendar'
import { listContacts } from '@/app/actions/contacts'
import { startOfMonth, endOfMonth } from 'date-fns'

export default async function CalendarPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  // Carregar eventos do mês atual
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const { data: initialEvents } = await listCalendarEvents(monthStart, monthEnd)
  const { data: contacts } = await listContacts()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
            <p className="mt-2 text-sm text-gray-600">Visualize e gerencie suas agendas e eventos</p>
          </div>
        </div>

        <CalendarView initialEvents={initialEvents || []} contacts={contacts || []} />
      </div>
    </ProtectedLayout>
  )
}

