'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DocumentPreview } from './DocumentPreview'

interface File {
  id: string
  name: string
  description: string | null
  file_type: string
  file_size: number
  file_url: string
  mime_type: string | null
  category: string | null
  tags: string[]
  created_at: string
  user_profiles?: { full_name: string | null }
}

interface DocumentsListProps {
  files: File[]
}

export function DocumentsList({ files }: DocumentsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    router.push(`/documents?${params.toString()}`)
  }

  const categories = Array.from(new Set(files.map((f) => f.category).filter(Boolean))) as string[]

  const canPreview = (file: File) => {
    const mimeType = file.mime_type || ''
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    )
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow dark:shadow-gray-900/50">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum documento encontrado</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Comece adicionando documentos à base de conhecimento para a IA
        </p>
        <Link
          href="/documents/new"
          className="mt-6 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
        >
          Adicionar Primeiro Documento
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca e Filtros */}
      <form onSubmit={handleSearch} className="rounded-lg bg-white dark:bg-gray-900 p-4 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="sr-only">
              Buscar documentos
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>
          <div>
            <label htmlFor="category" className="sr-only">
              Categoria
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Lista de Documentos */}
      <div className="rounded-lg bg-white dark:bg-gray-900 shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Enviado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</div>
                        {file.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{file.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-200">
                      {file.file_type || 'documento'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.user_profiles?.full_name || 'Sistema'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(file.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canPreview(file) && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="text-[#039155] dark:text-[#18B0BB] hover:text-[#027a47] dark:hover:text-[#039155] mr-4 transition-colors"
                      >
                        Preview
                      </button>
                    )}
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#039155] dark:text-[#18B0BB] hover:text-[#027a47] dark:hover:text-[#039155] mr-4 transition-colors"
                    >
                      Ver
                    </a>
                    <Link href={`/documents/${file.id}/edit`} className="text-[#039155] dark:text-[#18B0BB] hover:text-[#027a47] dark:hover:text-[#039155] transition-colors">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Preview */}
      {previewFile && (
        <DocumentPreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}

