'use client'

import { useRouter } from 'next/navigation'
import { togglePromptStatus } from '@/app/actions/ai-prompts'
import { useState } from 'react'

interface TogglePromptButtonProps {
  promptId: string
  isActive: boolean
}

export function TogglePromptButton({ promptId, isActive }: TogglePromptButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await togglePromptStatus(promptId, !isActive)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isActive ? 'Desativar' : 'Ativar'}
    </button>
  )
}

