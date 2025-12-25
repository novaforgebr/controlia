'use client'

import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const lastItem = items[items.length - 1]
  const hasPrevious = items.length > 1
  
  return (
    <nav className="flex items-center mb-4" aria-label="Breadcrumb">
      {/* Mobile: mostrar apenas último item ou botão voltar */}
      <div className="md:hidden flex items-center gap-2 w-full">
        {hasPrevious && items.length > 0 && items[0].href && (
          <Link
            href={items[0].href}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Voltar"
          >
            <svg
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}
        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate flex-1">
          {lastItem?.label || 'Dashboard'}
        </span>
      </div>
      
      {/* Desktop: mostrar breadcrumb completo */}
      <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Link
          href="/dashboard"
          className="flex items-center hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors min-h-[44px] min-w-[44px] justify-center"
          title="Dashboard"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-[#039155] dark:hover:text-[#18B0BB] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

