'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface SidebarLayoutProps {
  companyName: string
  children: React.ReactNode
}

export function SidebarLayout({ companyName, children }: SidebarLayoutProps) {
  // Estado inicial: menu começa recolhido (64px) em desktop, fechado em mobile
  const [sidebarWidth, setSidebarWidth] = useState(64)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const sidebar = document.querySelector('aside')
    if (!sidebar) return

    const updateWidth = () => {
      // Em mobile, sidebar não ocupa espaço (é overlay)
      if (window.innerWidth < 768) {
        setSidebarWidth(0)
        return
      }

      // Verificar a largura atual do sidebar através do CSS computado
      // Isso captura tanto o estado permanente quanto o hover
      const computedStyle = window.getComputedStyle(sidebar)
      const width = parseInt(computedStyle.width, 10)
      
      // Usar a largura real do sidebar
      // Se estiver recolhido (w-16 = 64px), usar 64px
      // Se estiver expandido (w-64 = 256px) ou no hover, usar 256px
      setSidebarWidth(width)
    }

    const handleResize = () => {
      updateWidth()
      // Fechar menu mobile ao redimensionar para desktop
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    const observer = new MutationObserver(updateWidth)
    observer.observe(sidebar, { 
      attributes: true, 
      attributeFilter: ['class'],
      subtree: false
    })

    // Verificar estado inicial
    updateWidth()

    // Atualizar quando o mouse entrar ou sair do sidebar (para capturar hover) - apenas desktop
    if (window.innerWidth >= 768) {
      sidebar.addEventListener('mouseenter', updateWidth)
      sidebar.addEventListener('mouseleave', updateWidth)
    }
    
    // Atualizar também quando a transição CSS terminar
    sidebar.addEventListener('transitionend', updateWidth)
    
    // Atualizar ao redimensionar
    window.addEventListener('resize', handleResize)

    return () => {
      observer.disconnect()
      sidebar.removeEventListener('mouseenter', updateWidth)
      sidebar.removeEventListener('mouseleave', updateWidth)
      sidebar.removeEventListener('transitionend', updateWidth)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar 
        companyName={companyName} 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div
        className="flex-1 flex flex-col transition-all duration-300 w-full md:ml-0"
        style={{ marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : '0' }}
        id="main-content"
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 flex-1">
            {/* Menu hambúrguer para mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden rounded-md p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Logo/Title em mobile */}
            <Link href="/dashboard" className="md:hidden flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#039155] to-[#18B0BB] bg-clip-text text-transparent">
                Controlia
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{companyName}</span>
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors min-h-[44px] px-3 md:px-0"
              >
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto py-4 md:py-8 px-4 md:px-6 bg-gray-50 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  )
}

