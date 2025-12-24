import { getContact } from '@/app/actions/contacts'
import { listCustomFields } from '@/app/actions/custom-fields'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldsDisplayAll } from '@/components/contacts/CustomFieldsDisplayAll'
import { CustomFieldsEditor } from '@/components/contacts/CustomFieldsEditor'
import { ContactStatusEditor } from '@/components/contacts/ContactStatusEditor'
import { ContactConversations } from '@/components/contacts/ContactConversations'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

async function CustomFieldsEditorWrapper({ contactId, customFields }: { contactId: string; customFields: Record<string, unknown> }) {
  const { data: fields } = await listCustomFields()
  return <CustomFieldsEditor contactId={contactId} customFields={customFields} fields={fields || []} />
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getContact(id)

  if (!contact) {
    notFound()
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Contatos', href: '/contacts' },
            { label: contact.name },
          ]}
        />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{contact.name}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Detalhes do contato</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Editar
            </Link>
            <Link
              href="/contacts"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Voltar
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Informações principais */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Informações de Contato</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.whatsapp || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CPF/CNPJ</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.document || '-'}</dd>
                </div>
              </dl>
            </div>

            {contact.notes && (
              <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Observações</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}

            {/* Campos Customizados - Visualização */}
            <CustomFieldsDisplayAll customFields={(contact.custom_fields as Record<string, unknown>) || {}} />

            {/* Campos Customizados - Edição */}
            <CustomFieldsEditorWrapper contactId={contact.id} customFields={(contact.custom_fields as Record<string, unknown>) || {}} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status e Pipeline - Editor */}
            <ContactStatusEditor 
              contactId={id} 
              currentStatus={contact.status}
              currentPipelineId={(contact as any).pipeline_id}
              currentPipelineStageId={(contact as any).pipeline_stage_id}
            />

            {/* Conversas do Contato */}
            <ContactConversations contactId={contact.id} />

            {/* Informações Adicionais */}
            <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Informações Adicionais</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.score}/100</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Origem</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contact.source || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">IA Habilitada</dt>
                  <dd className="mt-1">
                    {contact.ai_enabled ? (
                      <span className="inline-flex items-center text-sm font-medium text-[#039155] dark:text-[#18B0BB]">
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Habilitada
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">Desabilitada</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Informações do Sistema</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Criado em</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {format(new Date(contact.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </dd>
                </div>
                {contact.last_interaction_at && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Última interação</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {format(new Date(contact.last_interaction_at), "dd/MM/yyyy 'às' HH:mm")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

