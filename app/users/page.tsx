import { listCompanyUsers } from '@/app/actions/users'
import { getCurrentCompany } from '@/lib/utils/company'
import { format } from 'date-fns'
import ProtectedLayout from '@/app/layout-protected'
import { UserManagementActions } from '@/components/users/UserManagementActions'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function UsersPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const { data: users } = await listCompanyUsers()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Usuários' }]} />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="mt-2 text-gray-600">Gerencie usuários e permissões da sua empresa</p>
          </div>
        </div>

        {/* Lista de usuários */}
        <div className="rounded-lg bg-white shadow">
          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-2 text-gray-600">Comece adicionando usuários à sua empresa</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((companyUser: any) => (
                <div
                  key={companyUser.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#039155] to-[#18B0BB] text-white font-semibold">
                        {companyUser.user_profiles?.full_name
                          ? companyUser.user_profiles.full_name.charAt(0).toUpperCase()
                          : companyUser.user_profiles?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {companyUser.user_profiles?.full_name || 'Sem nome'}
                        </h3>
                        <p className="text-sm text-gray-500">{companyUser.user_profiles?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              companyUser.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : companyUser.role === 'operator'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {companyUser.role === 'admin'
                              ? 'Administrador'
                              : companyUser.role === 'operator'
                              ? 'Operador'
                              : 'Observador'}
                          </span>
                          {companyUser.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-gray-500">
                        <p>Adicionado em</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(companyUser.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <UserManagementActions
                        companyUserId={companyUser.id}
                        currentRole={companyUser.role}
                        isActive={companyUser.is_active}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

