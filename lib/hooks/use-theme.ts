'use client'

import { useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  const getSystemTheme = useCallback((): Theme => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Verificar preferência salva
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Usar tema do sistema
      const systemTheme = getSystemTheme()
      setTheme(systemTheme)
      applyTheme(systemTheme)
    }
  }, [applyTheme, getSystemTheme])

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }, [theme, applyTheme])

  const setThemeMode = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }, [applyTheme])

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted,
  }
}

