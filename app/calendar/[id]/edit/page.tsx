import { getCalendarEvent } from '@/app/actions/calendar'
import ProtectedLayout from '@/app/layout-protected'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listContacts } from '@/app/actions/contacts'
import { EditCalendarEventForm } from '@/components/calendar/EditCalendarEventForm'

export default async function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: event } = await getCalendarEvent(id)
  const { data: contacts } = await listContacts()

  if (!event) {
    notFound()
  }

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
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Editar Evento</h1>
          <p className="mt-2 text-sm text-gray-600">Atualize os detalhes do evento</p>
        </div>

        <EditCalendarEventForm event={event} contacts={contacts || []} />
      </div>
    </ProtectedLayout>
  )
}

