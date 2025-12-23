import ProtectedLayout from '@/app/layout-protected'
import { NewCalendarEventForm } from '@/components/calendar/NewCalendarEventForm'
import { listContacts } from '@/app/actions/contacts'

export default async function NewCalendarEventPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const { data: contacts } = await listContacts()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a
            href="/calendar"
            className="text-sm font-medium text-gray-600 hover:text-[#039155] transition-colors"
          >
            ← Voltar para calendário
          </a>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Novo Evento</h1>
          <p className="mt-2 text-sm text-gray-600">Crie um novo evento no calendário</p>
        </div>

        <NewCalendarEventForm initialDate={searchParams.date} contacts={contacts || []} />
      </div>
    </ProtectedLayout>
  )
}

