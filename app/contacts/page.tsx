import { listContacts } from '@/app/actions/contacts'
import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import { ContactStatus } from '@/lib/types/database'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ContactRowActions } from '@/components/contacts/ContactRowActions'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { data: contacts, count } = await listContacts({
    status: params.status,
    search: params.search,
    limit,
    offset,
  })

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Contatos' }]} />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
            <p className="mt-2 text-gray-600">Gerencie seus contatos, leads e clientes</p>
          </div>
          <Link
            href="/contacts/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            + Novo Contato
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form method="get" className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                placeholder="Digite o nome, email ou telefone do contato..."
                defaultValue={params.search}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155]"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status || ''}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos os status</option>
              <option value={ContactStatus.LEAD}>Lead</option>
              <option value={ContactStatus.PROSPECT}>Prospect</option>
              <option value={ContactStatus.CLIENT}>Cliente</option>
              <option value={ContactStatus.INACTIVE}>Inativo</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Lista de contatos */}
        <div className="rounded-lg bg-white shadow">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum contato encontrado.</p>
              <Link href="/contacts/new" className="mt-4 inline-block text-[#039155] hover:text-[#18B0BB] font-medium transition-colors">
                Criar primeiro contato →
              </Link>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      IA
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        {contact.document && (
                          <div className="text-xs text-gray-500">{contact.document}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{contact.email || '-'}</div>
                        <div className="text-xs text-gray-500">{contact.phone || contact.whatsapp || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            contact.status === 'client'
                              ? 'bg-green-100 text-green-800'
                              : contact.status === 'prospect'
                              ? 'bg-blue-100 text-blue-800'
                              : contact.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {contact.ai_enabled ? (
                          <span className="inline-flex items-center text-xs font-medium text-[#039155]">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ativa
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Desativada</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <ContactRowActions contactId={contact.id} contactName={contact.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      {page > 1 && (
                        <Link
                          href={`/contacts?page=${page - 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
                        </Link>
                      )}
                      {page < totalPages && (
                        <Link
                          href={`/contacts?page=${page + 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Próxima
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

