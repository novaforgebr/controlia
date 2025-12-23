'use server'

/**
 * Server Actions para o módulo de Usuários
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { getUser } from '@/lib/auth/get-session'
import { logHumanAction } from '@/lib/utils/audit'
import { revalidatePath } from 'next/cache'
import type { CompanyUserInsert, CompanyUser } from '@/lib/types/database'

/**
 * Listar usuários da empresa
 */
export async function listCompanyUsers() {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: [] }
    }

    const supabase = await createClient()

    const { data: companyUsers, error } = await supabase
      .from('company_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        created_at,
        user_profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao listar usuários:', error)
      return { error: 'Erro ao listar usuários', data: [] }
    }

    return { success: true, data: companyUsers || [] }
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return { error: 'Erro ao listar usuários', data: [] }
  }
}

/**
 * Convidar usuário para empresa
 */
export async function inviteUser(email: string, role: string = 'operator') {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    // Verificar se usuário tem permissão (apenas admin)
    const supabase = await createClient()
    const { data: currentUserCompany } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (currentUserCompany?.role !== 'admin') {
      return { error: 'Apenas administradores podem convidar usuários' }
    }

    // Verificar se email já existe no Supabase Auth
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)

    if (existingUser?.user) {
      // Usuário já existe, apenas adicionar à empresa
      const { data: existingCompanyUser } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', company.id)
        .eq('user_id', existingUser.user.id)
        .single()

      if (existingCompanyUser) {
        return { error: 'Usuário já faz parte desta empresa' }
      }

      // Adicionar usuário à empresa
      const { data: companyUser, error: insertError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: existingUser.user.id,
          role: role as 'admin' | 'operator' | 'observer',
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao adicionar usuário:', insertError)
        return { error: 'Erro ao adicionar usuário à empresa' }
      }

      await logHumanAction(
        company.id,
        user.id,
        'invite_user',
        'company_user',
        companyUser.id,
        { email, role }
      )

      revalidatePath('/users')
      return { success: true, data: companyUser }
    } else {
      // Usuário não existe, criar convite
      // TODO: Implementar sistema de convites por email
      return { error: 'Sistema de convites por email ainda não implementado' }
    }
  } catch (error) {
    console.error('Erro ao convidar usuário:', error)
    return { error: 'Erro ao convidar usuário' }
  }
}

/**
 * Atualizar papel do usuário
 */
export async function updateUserRole(companyUserId: string, role: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    // Verificar se usuário tem permissão (apenas admin)
    const supabase = await createClient()
    const { data: currentUserCompany } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (currentUserCompany?.role !== 'admin') {
      return { error: 'Apenas administradores podem alterar papéis' }
    }

    const { data: updatedUser, error } = await supabase
      .from('company_users')
      .update({
        role: role as 'admin' | 'operator' | 'observer',
      })
      .eq('id', companyUserId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar papel:', error)
      return { error: 'Erro ao atualizar papel do usuário' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'update_user_role',
      'company_user',
      companyUserId,
      { role }
    )

    revalidatePath('/users')
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error('Erro ao atualizar papel:', error)
    return { error: 'Erro ao atualizar papel do usuário' }
  }
}

/**
 * Ativar/Desativar usuário
 */
export async function toggleUserStatus(companyUserId: string, isActive: boolean) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    // Verificar se usuário tem permissão (apenas admin)
    const supabase = await createClient()
    const { data: currentUserCompany } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (currentUserCompany?.role !== 'admin') {
      return { error: 'Apenas administradores podem ativar/desativar usuários' }
    }

    const { data: updatedUser, error } = await supabase
      .from('company_users')
      .update({
        is_active: isActive,
      })
      .eq('id', companyUserId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return { error: 'Erro ao atualizar status do usuário' }
    }

    await logHumanAction(
      company.id,
      user.id,
      isActive ? 'activate_user' : 'deactivate_user',
      'company_user',
      companyUserId,
      { is_active: isActive }
    )

    revalidatePath('/users')
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return { error: 'Erro ao atualizar status do usuário' }
  }
}

/**
 * Remover usuário da empresa
 */
export async function removeUser(companyUserId: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada' }
    }

    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    // Verificar se usuário tem permissão (apenas admin)
    const supabase = await createClient()
    const { data: currentUserCompany } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (currentUserCompany?.role !== 'admin') {
      return { error: 'Apenas administradores podem remover usuários' }
    }

    // Verificar se não é o próprio usuário
    const { data: userToRemove } = await supabase
      .from('company_users')
      .select('user_id')
      .eq('id', companyUserId)
      .single()

    if (userToRemove?.user_id === user.id) {
      return { error: 'Você não pode remover a si mesmo' }
    }

    const { error } = await supabase
      .from('company_users')
      .delete()
      .eq('id', companyUserId)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao remover usuário:', error)
      return { error: 'Erro ao remover usuário' }
    }

    await logHumanAction(
      company.id,
      user.id,
      'remove_user',
      'company_user',
      companyUserId,
      {}
    )

    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('Erro ao remover usuário:', error)
    return { error: 'Erro ao remover usuário' }
  }
}

