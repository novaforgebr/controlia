'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { togglePromptStatus, deleteAIPrompt } from '@/app/actions/ai-prompts'
import { useToast } from '@/lib/hooks/use-toast'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import type { AIPrompt } from '@/lib/types/database'

interface PromptCardProps {
  prompt: AIPrompt
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const toast = useToast()

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu])

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      const result = await togglePromptStatus(prompt.id, !prompt.is_active)
      if (result.success) {
        toast.success(`Prompt ${prompt.is_active ? 'desativado' : 'ativado'} com sucesso!`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao alterar status do prompt')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteAIPrompt(prompt.id)
      if (result.success) {
        toast.success('Prompt excluído com sucesso!')
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao excluir prompt')
      }
    } catch (error) {
      console.error('Erro ao excluir prompt:', error)
      toast.error('Erro ao excluir prompt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
              {prompt.is_default && (
                <span className="rounded-full bg-[#039155] px-2 py-0.5 text-xs font-medium text-white">
                  Padrão
                </span>
              )}
            </div>
            {prompt.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{prompt.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {prompt.context_type && (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {prompt.context_type}
                </span>
              )}
              {prompt.channel && (
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                  {prompt.channel}
                </span>
              )}
              <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                v{prompt.version}
              </span>
            </div>
          </div>
          <div className="ml-4 flex items-center gap-2">
            {prompt.is_active ? (
              <span className="inline-flex h-2 w-2 rounded-full bg-green-400" title="Ativo" />
            ) : (
              <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" title="Inativo" />
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-500">
            Modelo: {prompt.model}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/ai/prompts/${prompt.id}`}
              className="text-sm font-semibold text-[#039155] hover:text-[#18B0BB] transition-colors"
            >
              Ver detalhes
            </Link>
          </div>
        </div>

        {/* Menu de ações */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-md bg-white p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2"
              aria-label="Menu de ações"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <Link
                    href={`/ai/prompts/${prompt.id}/edit`}
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      handleToggleStatus()
                    }}
                    disabled={loading}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {prompt.is_active ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {prompt.is_active ? 'Desativar' : 'Ativar'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    disabled={loading}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o prompt "${prompt.name}"? Esta ação é irreversível e todas as versões relacionadas também serão excluídas.`}
        confirmButtonText="Excluir"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        loading={loading}
      />
    </>
  )
}

