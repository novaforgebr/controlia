'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface SidebarLayoutProps {
  companyName: string
  children: React.ReactNode
}

export function SidebarLayout({ companyName, children }: SidebarLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256)

  useEffect(() => {
    const sidebar = document.querySelector('aside')
    if (!sidebar) return

    const observer = new MutationObserver(() => {
      if (sidebar.classList.contains('w-16')) {
        setSidebarWidth(64)
      } else {
        setSidebarWidth(256)
      }
    })

    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })

    // Verificar estado inicial
    if (sidebar.classList.contains('w-16')) {
      setSidebarWidth(64)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar companyName={companyName} />
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
        id="main-content"
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6">
          <div className="flex-1">
            {/* Breadcrumb ou título da página pode ir aqui */}
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{companyName}</span>
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto py-8 px-6 bg-gray-50 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  )
}

