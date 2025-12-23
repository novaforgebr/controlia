import { requireAuth } from '@/lib/auth/require-auth'
import { getCurrentCompany } from '@/lib/utils/company'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/SidebarLayout'

/**
 * Layout para rotas protegidas
 * Aplica autenticação e verificação de empresa
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  // Verificar se usuário tem empresa
  let company = await getCurrentCompany()

  // Se não tem empresa, redirecionar para setup
  if (!company) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Verificar se já tem perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Redirecionar para setup de empresa
        redirect('/setup/company')
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Nenhuma empresa encontrada</h1>
          <p className="mt-2 text-gray-600">
            Você precisa estar associado a uma empresa para acessar o sistema.
          </p>
          <a
            href="/setup/company"
            className="mt-4 inline-block rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Configurar Empresa
          </a>
        </div>
      </div>
    )
  }

  return <SidebarLayout companyName={company.name}>{children}</SidebarLayout>
}

