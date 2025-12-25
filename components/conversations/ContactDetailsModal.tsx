'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateContact } from '@/app/actions/contacts'
import { format } from 'date-fns'
import { useToast } from '@/lib/hooks/use-toast'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  document: string | null
  status: string
  source: string | null
  score: number
  notes: string | null
  tags: string[] | null
  custom_fields: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface ContactDetailsModalProps {
  contactId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function ContactDetailsModal({ contactId, isOpen, onClose, onUpdate }: ContactDetailsModalProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    if (isOpen && contactId) {
      loadContact()
    }
  }, [isOpen, contactId])

  const loadContact = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (error) {
        console.error('Erro ao carregar contato:', error)
        return
      }

      if (data) {
        setContact(data as Contact)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          document: data.document || '',
          status: data.status || 'lead',
          source: data.source || '',
          score: data.score?.toString() || '0',
          notes: data.notes || '',
          tags: (data.tags as string[])?.join(', ') || '',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const loadingToast = toast.loading('Salvando alterações...')

    try {
      const formDataObj = new FormData()
      Object.keys(formData).forEach((key) => {
        formDataObj.append(key, formData[key])
      })

      const result = await updateContact(contactId, formDataObj)
      toast.dismiss(loadingToast)

      if (result.success) {
        toast.success('Contato atualizado com sucesso!')
        if (onUpdate) {
          onUpdate()
        }
        await loadContact()
        // Não fechar o modal, apenas atualizar os dados
      } else {
        toast.error('Erro ao atualizar contato: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar contato. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end md:items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-2xl rounded-t-2xl md:rounded-lg bg-white dark:bg-gray-900 shadow-xl dark:shadow-gray-900/50 border-t md:border border-gray-200 dark:border-gray-800 max-h-[95vh] md:max-h-[90vh] flex flex-col m-0 md:m-4">
          <div className="border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 flex-shrink-0 sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Detalhes do Contato</h2>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#039155] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fechar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-gray-50 dark:bg-gray-950">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
              </div>
            ) : contact ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="document" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      CPF/CNPJ
                    </label>
                    <input
                      type="text"
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    >
                      <option value="lead">Lead</option>
                      <option value="customer">Cliente</option>
                      <option value="prospect">Prospect</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Origem
                    </label>
                    <input
                      type="text"
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Score
                    </label>
                    <input
                      type="number"
                      id="score"
                      min="0"
                      max="100"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="ex: importante, vip, retorno"
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Observações
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-[#039155] focus:outline-none focus:ring-[#039155] dark:focus:ring-[#039155]/20"
                    />
                  </div>
                </div>

                {/* Campos customizados */}
                {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Campos Customizados</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {Object.entries(contact.custom_fields).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{key}</label>
                          <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações do sistema */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Informações do Sistema</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Criado em</dt>
                      <dd className="mt-1 text-gray-900 dark:text-gray-100">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm')}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Atualizado em</dt>
                      <dd className="mt-1 text-gray-900 dark:text-gray-100">
                        {format(new Date(contact.updated_at), 'dd/MM/yyyy HH:mm')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-6 flex-shrink-0 sticky bottom-0 bg-gray-50 dark:bg-gray-950 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 md:pb-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 md:py-2 text-base md:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors min-h-[44px] md:min-h-0 w-full md:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-3 md:py-2 text-base md:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0 w-full md:w-auto"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Contato não encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

