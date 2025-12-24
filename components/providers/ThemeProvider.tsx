'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/hooks/use-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mounted } = useTheme()

  // Prevenir flash de conteúdo não estilizado
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

