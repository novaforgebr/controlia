import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompleteRegistrationModal } from '@/components/users/CompleteRegistrationModal'

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Buscar convite
  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .select('*, companies(name), user_profiles:invited_by(full_name, email)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !invitation) {
    redirect('/login?error=invite_invalid')
  }

  // Verificar se o convite expirou
  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    redirect('/login?error=invite_expired')
  }

  // Verificar se já foi aceito
  if (invitation.accepted_at) {
    redirect('/login?error=invite_already_accepted')
  }

  // Verificar se usuário já está logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && user.email) {
    // Usuário já está logado, verificar se é o mesmo email
    if (user.email.toLowerCase() === invitation.email.toLowerCase()) {
      // Mesmo email, mostrar modal de conclusão
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <div className="w-full max-w-md">
            <CompleteRegistrationModal
              invitation={invitation}
              userEmail={user.email}
              userId={user.id}
            />
          </div>
        </div>
      )
    } else {
      // Email diferente, fazer logout e mostrar modal
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <CompleteRegistrationModal
          invitation={invitation}
          userEmail={invitation.email}
          userId={null}
        />
      </div>
    </div>
  )
}

