import { getContact, deleteContact } from '@/app/actions/contacts'
import { notFound, redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'

export default async function DeleteContactPage({
  params,
}: {
  params: { id: string }
}) {
  const contact = await getContact(params.id)

  if (!contact) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    const result = await deleteContact(params.id)
    if (result.success) {
      redirect('/contacts')
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">Confirmar Exclusão</h1>
          <p className="mt-4 text-gray-600">
            Tem certeza que deseja excluir o contato <strong>{contact.name}</strong>?
          </p>
          <p className="mt-2 text-sm text-red-600">
            Esta ação não pode ser desfeita. Todas as conversas e mensagens relacionadas também serão afetadas.
          </p>

          <form action={handleDelete} className="mt-6 flex justify-end gap-4">
            <a
              href={`/contacts/${contact.id}`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Excluir Contato
            </button>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}

