'use client'

import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

interface PromptIdDisplayProps {
  promptId: string
}

export function PromptIdDisplay({ promptId }: PromptIdDisplayProps) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptId)
      setCopied(true)
      toast.success('ID copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast.error('Erro ao copiar ID')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
      <div className="flex-1">
        <label className="text-xs font-medium text-gray-500">ID do Prompt (para n8n)</label>
        <div className="mt-1 font-mono text-sm text-gray-900">{promptId}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2"
      >
        {copied ? '✓ Copiado' : 'Copiar ID'}
      </button>
    </div>
  )
}

