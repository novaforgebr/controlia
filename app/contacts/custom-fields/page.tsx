import { listCustomFields, deleteCustomField } from '@/app/actions/custom-fields'
import { getCurrentCompany } from '@/lib/utils/company'
import Link from 'next/link'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldActions } from '@/components/contacts/CustomFieldActions'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export default async function CustomFieldsPage() {
  const company = await getCurrentCompany()
  if (!company) {
    return null
  }

  const { data: fields } = await listCustomFields()

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb
            items={[
              { label: 'Contatos', href: '/contacts' },
              { label: 'Campos Customizados' },
            ]}
          />
        </div>
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Campos Customizados</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
              Crie campos personalizados para seus contatos. Estes campos aparecerão nos formulários de criação e edição.
            </p>
          </div>
          <Link
            href="/contacts/custom-fields/new"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all min-h-[44px] md:min-h-0 w-full sm:w-auto flex items-center justify-center"
          >
            + Novo Campo
          </Link>
        </div>

        {/* Lista de campos */}
        <div className="rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          {fields.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum campo customizado</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Comece criando seu primeiro campo personalizado</p>
              <Link
                href="/contacts/custom-fields/new"
                className="mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                Criar Primeiro Campo
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {fields.map((field: any) => (
                <div
                  key={field.id}
                  className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{field.field_label}</h3>
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-400">
                          {field.field_type}
                        </span>
                        {field.is_required && (
                          <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-400">
                            Obrigatório
                          </span>
                        )}
                        {field.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-500 dark:bg-gray-400"></span>
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <span className="break-all">Chave: <code className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs font-mono text-gray-900 dark:text-gray-100 break-all">{field.field_key}</code></span>
                        {field.field_options && field.field_options.length > 0 && (
                          <span>
                            Opções: {field.field_options.length} {field.field_options.length === 1 ? 'opção' : 'opções'}
                          </span>
                        )}
                        <span>Ordem: {field.display_order}</span>
                      </div>
                      {field.field_options && field.field_options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {field.field_options.map((option: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <CustomFieldActions fieldId={field.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="mt-4 md:mt-6 rounded-lg bg-gradient-to-r from-[#039155]/5 to-[#18B0BB]/5 dark:from-[#039155]/10 dark:to-[#18B0BB]/10 border border-[#039155]/20 dark:border-[#039155]/30 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Como funciona?</h3>
          <ul className="space-y-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Os campos customizados aparecem automaticamente nos formulários de criação e edição de contatos</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Use a chave do campo para referenciá-lo em automações e integrações</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-[#039155] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Campos inativos não aparecem nos formulários, mas os dados existentes são preservados</span>
            </li>
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  )
}

