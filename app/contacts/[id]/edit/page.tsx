import { getContact, updateContact } from '@/app/actions/contacts'
import { notFound, redirect } from 'next/navigation'
import { ContactStatus } from '@/lib/types/database'
import ProtectedLayout from '@/app/layout-protected'
import { CustomFieldsForm } from '@/components/contacts/CustomFieldsForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import Link from 'next/link'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getContact(id)

  if (!contact) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await updateContact(id, formData)
    if (result.success) {
      redirect(`/contacts/${id}`)
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Contatos', href: '/contacts' },
            { label: contact.name, href: `/contacts/${contact.id}` },
            { label: 'Editar' },
          ]}
        />
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Contato</h1>
            <p className="mt-2 text-gray-600">Atualize as informações do contato</p>
          </div>
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </Link>
        </div>

        <form action={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
              <svg className="h-5 w-5 text-[#039155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Informações Básicas</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={contact.name}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={contact.email || ''}
                    className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                    placeholder="contato@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={contact.phone || ''}
                    className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    defaultValue={contact.whatsapp || ''}
                    placeholder="+55 11 99999-9999"
                    className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  id="document"
                  name="document"
                  defaultValue={contact.document || ''}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Status e Classificação */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
              <svg className="h-5 w-5 text-[#039155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Status e Classificação</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={contact.status}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                >
                  <option value={ContactStatus.LEAD}>Lead</option>
                  <option value={ContactStatus.PROSPECT}>Prospect</option>
                  <option value={ContactStatus.CLIENT}>Cliente</option>
                  <option value={ContactStatus.INACTIVE}>Inativo</option>
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  Origem
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  defaultValue={contact.source || ''}
                  placeholder="Ex: Site, indicação, redes sociais..."
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
              </div>

              <div>
                <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                  Score <span className="text-gray-500 text-xs">(0-100)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="score"
                    name="score"
                    min="0"
                    max="100"
                    defaultValue={contact.score}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400 text-sm">/100</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  defaultValue={contact.tags?.join(', ') || ''}
                  placeholder="Ex: cliente-vip, interessado-em-x, seguimento-y"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
                />
                <p className="mt-1 text-xs text-gray-500">Separe múltiplas tags por vírgula</p>
              </div>
            </div>
          </div>

          {/* Observações e Configurações */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
              <svg className="h-5 w-5 text-[#039155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Observações e Configurações</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={5}
                  defaultValue={contact.notes || ''}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 resize-none"
                  placeholder="Adicione observações importantes sobre este contato..."
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  id="ai_enabled"
                  name="ai_enabled"
                  value="true"
                  defaultChecked={contact.ai_enabled}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#039155] focus:ring-[#039155]"
                />
                <div className="flex-1">
                  <label htmlFor="ai_enabled" className="block text-sm font-medium text-gray-900 cursor-pointer">
                    Inteligência Artificial Habilitada
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Permite que a IA interaja automaticamente com este contato através dos canais configurados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campos Customizados */}
          <CustomFieldsForm contactCustomFields={(contact.custom_fields as Record<string, unknown>) || {}} />

          {/* Footer com botões de ação */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-6 py-4 -mx-6 -mb-6">
            <Link
              href={`/contacts/${contact.id}`}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Voltar para detalhes
            </Link>
            <div className="flex gap-3">
              <Link
                href={`/contacts/${contact.id}`}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  )
}

