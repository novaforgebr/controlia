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
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb items={[{ label: 'Contatos' }]} />
        </div>
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Contatos</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Gerencie seus contatos, leads e clientes</p>
          </div>
          <Link
            href="/contacts/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0 w-full sm:w-auto flex items-center justify-center"
          >
            + Novo Contato
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-4 md:mb-6 rounded-lg bg-white dark:bg-gray-900 p-3 md:p-4 shadow dark:shadow-gray-900/50">
          <form method="get" className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                placeholder="Digite o nome, email ou telefone..."
                defaultValue={params.search}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status || ''}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 min-h-[44px] md:min-h-0"
            >
              <option value="">Todos os status</option>
              <option value={ContactStatus.LEAD}>Lead</option>
              <option value={ContactStatus.PROSPECT}>Prospect</option>
              <option value={ContactStatus.CLIENT}>Cliente</option>
              <option value={ContactStatus.INACTIVE}>Inativo</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-700 dark:bg-gray-600 px-4 py-2.5 md:py-2 text-base md:text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors min-h-[44px] md:min-h-0 w-full sm:w-auto"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Lista de contatos */}
        <div className="rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Nenhum contato encontrado.</p>
              <Link href="/contacts/new" className="mt-4 inline-block text-[#039155] dark:text-[#18B0BB] hover:text-[#18B0BB] dark:hover:text-[#039155] font-medium transition-colors">
                Criar primeiro contato →
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      IA
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{contact.name}</div>
                        {contact.document && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{contact.document}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{contact.email || '-'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{contact.phone || contact.whatsapp || '-'}</div>
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
                                className="inline-flex rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {contact.ai_enabled ? (
                          <span className="inline-flex items-center text-xs font-medium text-[#039155] dark:text-[#18B0BB]">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ativa
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Desativada</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <ContactRowActions contactId={contact.id} contactName={contact.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {contact.name}
                          </h3>
                          {contact.ai_enabled && (
                            <span className="text-[#039155] dark:text-[#18B0BB]" title="IA Ativa">
                              🤖
                            </span>
                          )}
                        </div>
                        {contact.document && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{contact.document}</p>
                        )}
                        <div className="space-y-1">
                          {contact.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{contact.email}</p>
                          )}
                          {(contact.phone || contact.whatsapp) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone || contact.whatsapp}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              contact.status === 'client'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : contact.status === 'prospect'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : contact.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {contact.status}
                          </span>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">+{contact.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ContactRowActions contactId={contact.id} contactName={contact.name} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {page > 1 && (
                        <Link
                          href={`/contacts?page=${page - 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                          className="flex-1 sm:flex-initial rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center min-h-[44px] md:min-h-0 flex items-center justify-center"
                        >
                          Anterior
                        </Link>
                      )}
                      {page < totalPages && (
                        <Link
                          href={`/contacts?page=${page + 1}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                          className="flex-1 sm:flex-initial rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center min-h-[44px] md:min-h-0 flex items-center justify-center"
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

