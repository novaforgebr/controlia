'use client'

import { useRouter } from 'next/navigation'
import { toggleAutomation, pauseAutomation } from '@/app/actions/automations'
import { useState } from 'react'

interface ToggleAutomationButtonProps {
  automationId: string
  isActive: boolean
}

export function ToggleAutomationButton({ automationId, isActive }: ToggleAutomationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await toggleAutomation(automationId, !isActive)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isActive ? 'Desativar' : 'Ativar'}
    </button>
  )
}

interface PauseAutomationButtonProps {
  automationId: string
  isPaused: boolean
}

export function PauseAutomationButton({ automationId, isPaused }: PauseAutomationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePause = async () => {
    setLoading(true)
    await pauseAutomation(automationId, !isPaused)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handlePause}
      disabled={loading}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        isPaused
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isPaused ? 'Retomar' : 'Pausar'}
    </button>
  )
}

