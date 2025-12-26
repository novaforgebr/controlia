'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateContact } from '@/app/actions/contacts'
import { listCustomFields } from '@/app/actions/custom-fields'
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

interface CustomField {
  id: string
  field_key: string
  field_label: string
  field_type: string
  is_active: boolean
  is_required: boolean
  display_order: number
  field_options?: string[]
}

export function ContactDetailsModal({ contactId, isOpen, onClose, onUpdate }: ContactDetailsModalProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showFieldInfo, setShowFieldInfo] = useState<string | null>(null)
  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    if (isOpen && contactId) {
      loadContact()
    } else {
      setShowFieldInfo(null)
    }
  }, [isOpen, contactId])

  // Carregar campos customizados após o contato ser carregado
  useEffect(() => {
    if (contact && isOpen && contactId) {
      loadCustomFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact, isOpen, contactId])

  // Fechar tooltip ao clicar fora
  useEffect(() => {
    if (!showFieldInfo) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-field-info]')) {
        setShowFieldInfo(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFieldInfo])

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
        const customFieldsData = (data.custom_fields as Record<string, unknown>) || {}
        
        // Inicializar formData com campos padrão
        const initialFormData: Record<string, string> = {
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
        }
        
        // Adicionar campos customizados ao formData
        // Os valores serão inicializados quando os campos customizados forem carregados
        setFormData(initialFormData)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomFields = async () => {
    try {
      const result = await listCustomFields()
      if (result.success && result.data) {
        const fields = result.data as CustomField[]
        setCustomFields(fields)
        
        // Inicializar valores dos campos customizados no formData
        if (contact) {
          const customFieldsData = (contact.custom_fields as Record<string, unknown>) || {}
          const updatedFormData = { ...formData }
          
          fields.forEach((field) => {
            const key = `custom_${field.field_key}`
            const value = customFieldsData[field.field_key]
            
            if (field.field_type === 'boolean') {
              updatedFormData[key] = value === true || value === 'true' ? 'true' : 'false'
            } else if (field.field_type === 'date' && value) {
              // Converter data ISO para formato YYYY-MM-DD
              try {
                const date = new Date(value as string)
                updatedFormData[key] = date.toISOString().split('T')[0]
              } catch {
                updatedFormData[key] = String(value || '')
              }
            } else {
              updatedFormData[key] = value ? String(value) : ''
            }
          })
          
          setFormData(updatedFormData)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar campos customizados:', error)
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'customer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'prospect':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end md:items-center justify-center p-0 md:p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl rounded-t-2xl md:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl dark:shadow-gray-900/50 border-t md:border border-gray-200 dark:border-gray-800 max-h-[95vh] md:max-h-[90vh] flex flex-col m-0 md:m-4 overflow-hidden">
          {/* Header elegante com gradiente */}
          <div className="relative bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 md:px-6 py-5 md:py-6 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#039155]/90 to-[#18B0BB]/90"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar do contato */}
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
                  <span className="text-xl md:text-2xl font-bold text-white">
                    {contact?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                    {contact?.name || 'Carregando...'}
                  </h2>
                  {contact && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeColor(contact.status)}`}>
                        {contact.status === 'customer' ? 'Cliente' : contact.status === 'prospect' ? 'Prospect' : contact.status === 'inactive' ? 'Inativo' : 'Lead'}
                      </span>
                      {contact.score > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Score: {contact.score}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg hover:shadow-xl"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Carregando informações...</p>
                </div>
              </div>
            ) : contact ? (
              <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
                {/* Seção: Informações de Contato */}
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações de Contato</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="Nome do contato"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Telefone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        WhatsApp
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <input
                          type="tel"
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="document" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        CPF/CNPJ
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="document"
                          value={formData.document}
                          onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="block w-full pl-10 appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                        >
                          <option value="lead">Lead</option>
                          <option value="customer">Cliente</option>
                          <option value="prospect">Prospect</option>
                          <option value="inactive">Inativo</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="source" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Origem
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="source"
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="Site, indicação, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="score" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Score de Qualificação
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          id="score"
                          min="0"
                          max="100"
                          value={formData.score}
                          onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="tags"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="ex: importante, vip, retorno"
                          className="block w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                        />
                      </div>
                      {formData.tags && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.tags.split(',').map((tag, idx) => {
                            const trimmedTag = tag.trim()
                            return trimmedTag ? (
                              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-[#039155]/10 dark:bg-[#039155]/20 px-3 py-1 text-xs font-medium text-[#039155] dark:text-[#18B0BB]">
                                {trimmedTag}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Adicione observações sobre este contato..."
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Campos Customizados */}
                {customFields.length > 0 && (
                  <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campos Customizados</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {customFields
                        .filter((field) => field.is_active && field.field_type)
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                        .map((fieldInfo) => {
                          const fieldKey = `custom_${fieldInfo.field_key}`
                          const currentValue = formData[fieldKey] || ''
                          
                          const renderField = () => {
                            switch (fieldInfo.field_type) {
                              case 'text':
                                return (
                                  <input
                                    type="text"
                                    id={fieldKey}
                                    value={currentValue}
                                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                                  />
                                )
                              
                              case 'textarea':
                                return (
                                  <textarea
                                    id={fieldKey}
                                    value={currentValue}
                                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    rows={3}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20 resize-none"
                                  />
                                )
                              
                              case 'number':
                                return (
                                  <input
                                    type="number"
                                    id={fieldKey}
                                    value={currentValue}
                                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                                  />
                                )
                              
                              case 'date':
                                return (
                                  <input
                                    type="date"
                                    id={fieldKey}
                                    value={currentValue}
                                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                                  />
                                )
                              
                              case 'boolean':
                                return (
                                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <input
                                      type="checkbox"
                                      id={fieldKey}
                                      checked={currentValue === 'true'}
                                      onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.checked ? 'true' : 'false' })}
                                      className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-[#039155] focus:ring-[#039155] transition-colors"
                                    />
                                    <label htmlFor={fieldKey} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                      {currentValue === 'true' ? 'Sim' : 'Não'}
                                    </label>
                                  </div>
                                )
                              
                              case 'select':
                                const options = fieldInfo.field_options || []
                                return (
                                  <div className="relative">
                                    <select
                                      id={fieldKey}
                                      value={currentValue}
                                      onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                      className="block w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                                    >
                                      <option value="">Selecione...</option>
                                      {options.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                )
                              
                              default:
                                return (
                                  <input
                                    type="text"
                                    id={fieldKey}
                                    value={currentValue}
                                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 dark:focus:ring-[#039155]/20"
                                  />
                                )
                            }
                          }
                          
                          return (
                            <div key={fieldInfo.id} className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <label htmlFor={fieldKey} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  {fieldInfo.field_label}
                                  {fieldInfo.is_required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="relative" data-field-info>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowFieldInfo(showFieldInfo === fieldInfo.id ? null : fieldInfo.id)
                                    }}
                                    className="text-gray-400 hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#039155] rounded-full p-1 min-h-[24px] min-w-[24px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                                    aria-label="Informações do campo"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  {showFieldInfo === fieldInfo.id && (
                                    <div className="absolute left-0 top-8 z-50 w-80 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-4 text-xs before:absolute before:-top-1.5 before:left-5 before:w-3 before:h-3 before:bg-white dark:before:bg-gray-800 before:border-l before:border-t before:border-gray-200 dark:before:border-gray-700 before:rotate-45">
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Informações do Campo</h4>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setShowFieldInfo(null)
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            aria-label="Fechar"
                                          >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="flex-1 space-y-2.5">
                                          <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">ID:</span>
                                            <span className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">{fieldInfo.id}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Nome Identificador:</span>
                                            <span className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">{fieldInfo.field_key}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Tipo:</span>
                                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400 capitalize">
                                              {fieldInfo.field_type}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {renderField()}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Seção: Informações do Sistema */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                      <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">Informações do Sistema</h3>
                  </div>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Criado em</dt>
                        <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm')}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Atualizado em</dt>
                        <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(contact.updated_at), 'dd/MM/yyyy HH:mm')}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Footer com botões */}
                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-6 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 md:pb-0 bg-gray-50 dark:bg-gray-950 sticky bottom-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-3 md:py-2.5 text-base md:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all min-h-[44px] md:min-h-0 w-full md:w-auto shadow-sm hover:shadow"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-3 md:py-2.5 text-base md:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0 w-full md:w-auto flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Salvar Alterações</span>
                      </>
                    )}
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

