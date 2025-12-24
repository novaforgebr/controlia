'use client'

import { useState } from 'react'
import { createCompany } from '@/app/actions/companies'
import { useRouter } from 'next/navigation'

export default function CompanySetupPage() {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório')
      setLoading(false)
      return
    }

    const result = await createCompany(companyName.trim())

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Erro desconhecido ao criar empresa')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#039155] to-[#18B0BB]">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurar Empresa</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Crie ou configure sua empresa para começar a usar o Controlia CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                    {error.includes('recursion') && (
                      <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                        Este é um erro de configuração do banco de dados. Por favor, execute o script de correção no Supabase.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome da Empresa <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  setError(null) // Limpar erro ao digitar
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                placeholder="Minha Empresa"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Este será o nome da sua empresa no sistema
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#039155]/25 transition-all hover:shadow-xl hover:shadow-[#039155]/30 focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Configurando...
                </span>
              ) : (
                'Continuar'
              )}
            </button>
          </form>
        </div>

        {/* Link para ajuda */}
        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Voltar para login
          </a>
        </div>
      </div>
    </div>
  )
}

