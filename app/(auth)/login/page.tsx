'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        // Verificar se usuário tem empresa
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (!companyUser) {
          // Redirecionar para setup de empresa
          router.push('/setup/company')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#039155] to-[#18B0BB] shadow-lg">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Controlia CRM</h1>
          </Link>
          <p className="mt-3 text-lg font-medium text-gray-600 dark:text-gray-400">Bem-vindo de volta</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Faça login para acessar sua conta</p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleLogin} className="space-y-6">
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
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155] dark:bg-gray-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[#039155] dark:text-[#18B0BB] hover:text-[#18B0BB] dark:hover:text-[#039155] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#039155]/25 transition-all hover:shadow-xl hover:shadow-[#039155]/30 focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Ou</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <Link href="/register" className="font-medium text-[#039155] dark:text-[#18B0BB] hover:text-[#18B0BB] dark:hover:text-[#039155] transition-colors">
                    Registre-se gratuitamente
                  </Link>
                </p>
              </div>
            </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
