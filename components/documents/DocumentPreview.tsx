'use client'

import { useState, useEffect } from 'react'

interface File {
  id: string
  name: string
  file_url: string
  mime_type: string | null
}

interface DocumentPreviewProps {
  file: File
  onClose: () => void
}

export function DocumentPreview({ file, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mimeType = file.mime_type || ''

  useEffect(() => {
    setLoading(true)
    setError(null)
  }, [file.id])

  const renderPreview = () => {
    if (mimeType.startsWith('image/')) {
      return (
        <img
          src={file.file_url}
          alt={file.name}
          className="max-h-[80vh] max-w-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError('Erro ao carregar imagem')
          }}
        />
      )
    }

    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={file.file_url}
          className="h-[80vh] w-full"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError('Erro ao carregar PDF')
          }}
        />
      )
    }

    if (mimeType.startsWith('text/')) {
      return (
        <TextPreview
          url={file.file_url}
          onLoad={() => setLoading(false)}
          onError={(err) => {
            setLoading(false)
            setError(err)
          }}
        />
      )
    }

    return <p className="text-gray-500">Preview não disponível para este tipo de arquivo</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[80vh] overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#039155] border-r-transparent"></div>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-center">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {!loading && !error && renderPreview()}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abrir em Nova Aba
          </a>
          <button
            onClick={onClose}
            className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function TextPreview({
  url,
  onLoad,
  onError,
}: {
  url: string
  onLoad: () => void
  onError: (error: string) => void
}) {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar arquivo')
        return res.text()
      })
      .then((text) => {
        setContent(text)
        onLoad()
      })
      .catch((err) => {
        onError(err.message || 'Erro ao carregar arquivo de texto')
      })
  }, [url, onLoad, onError])

  return (
    <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 font-mono text-sm text-gray-900">
      {content}
    </pre>
  )
}




