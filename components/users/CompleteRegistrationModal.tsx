'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'

interface CompleteRegistrationModalProps {
  invitation: any
  userEmail: string
  userId: string | null
}

export function CompleteRegistrationModal({
  invitation,
  userEmail,
  userId,
}: CompleteRegistrationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'complete'>('register')
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Se já tem userId, pular para completar cadastro
    if (userId) {
      setStep('complete')
    }
  }, [userId])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Criar conta no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (signUpError) {
        toast.error(signUpError.message)
        return
      }

      if (authData.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: authData.user.id,
          email: userEmail,
          full_name: formData.fullName,
          phone: formData.phone || null,
        })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          toast.error('Erro ao criar perfil. Tente novamente.')
          return
        }

        // Continuar para completar cadastro
        setStep('complete')
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast.error('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Usuário não autenticado')
        setLoading(false)
        return
      }

      // Atualizar perfil com dados adicionais
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError)
        toast.error('Erro ao atualizar perfil')
        setLoading(false)
        return
      }

      // Aceitar convite e associar à empresa
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitation.token,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Erro ao aceitar convite')
        setLoading(false)
        return
      }

      toast.success('Cadastro concluído com sucesso!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Erro ao completar cadastro:', error)
      toast.error('Erro ao completar cadastro. Tente novamente.')
      setLoading(false)
    }
  }

  if (step === 'register') {
    return (
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo!</h1>
          <p className="mt-2 text-gray-600">
            Você foi convidado para se juntar à <strong>{invitation.companies?.name}</strong>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Crie sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              disabled={loading}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={userEmail}
              disabled
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
              minLength={6}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
              placeholder="Digite a senha novamente"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Complete seu Cadastro</h1>
        <p className="mt-2 text-gray-600">
          Preencha seus dados para finalizar o cadastro em <strong>{invitation.companies?.name}</strong>
        </p>
      </div>

      <form onSubmit={handleCompleteRegistration} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            disabled={loading}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={userEmail}
            disabled
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={loading}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 disabled:bg-gray-50"
            placeholder="(00) 00000-0000"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Finalizando...' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  )
}

