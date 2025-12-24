import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .select('*, companies(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Convite inválido ou não encontrado' }, { status: 404 })
    }

    // Verificar se expirou
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
    }

    // Verificar se já foi aceito
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Convite já foi aceito' }, { status: 400 })
    }

    // Verificar se o email corresponde
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Este convite é para outro e-mail' },
        { status: 403 }
      )
    }

    // Verificar se usuário já está na empresa
    const { data: existingCompanyUser } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', invitation.company_id)
      .eq('user_id', user.id)
      .single()

    if (existingCompanyUser) {
      // Já está na empresa, apenas marcar convite como aceito
      await supabase
        .from('user_invitations')
        .update({
          accepted_at: new Date().toISOString(),
          user_id: user.id,
          is_active: false,
        })
        .eq('id', invitation.id)

      return NextResponse.json({ success: true, message: 'Usuário já está na empresa' })
    }

    // Criar associação empresa-usuário
    const { data: companyUser, error: companyUserError } = await supabase
      .from('company_users')
      .insert({
        company_id: invitation.company_id,
        user_id: user.id,
        role: invitation.role,
        is_active: true,
        invited_by: invitation.invited_by,
        invited_at: invitation.invited_at,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (companyUserError) {
      console.error('Erro ao associar usuário à empresa:', companyUserError)
      return NextResponse.json(
        { error: 'Erro ao associar usuário à empresa' },
        { status: 500 }
      )
    }

    // Marcar convite como aceito
    await supabase
      .from('user_invitations')
      .update({
        accepted_at: new Date().toISOString(),
        user_id: user.id,
        is_active: false,
      })
      .eq('id', invitation.id)

    revalidatePath('/users')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      data: companyUser,
    })
  } catch (error) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

