import ProtectedLayout from '@/app/layout-protected'
import { NewCalendarEventForm } from '@/components/calendar/NewCalendarEventForm'
import { listContacts } from '@/app/actions/contacts'
import Link from 'next/link'

export default async function NewCalendarEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const { data: contacts } = await listContacts()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/calendar"
            className="text-sm font-medium text-gray-600 hover:text-[#039155] transition-colors"
          >
            ← Voltar para calendário
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Novo Evento</h1>
          <p className="mt-2 text-sm text-gray-600">Crie um novo evento no calendário</p>
        </div>

        <NewCalendarEventForm initialDate={date} contacts={contacts || []} />
      </div>
    </ProtectedLayout>
  )
}

