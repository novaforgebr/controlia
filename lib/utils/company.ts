/**
 * Utilitários para gerenciamento de empresas (multi-tenant)
 */

import { createClient } from '@/lib/supabase/server'
import type { Company, CompanyUser } from '@/lib/types/database'

/**
 * Obtém a empresa atual do usuário autenticado
 * Retorna a primeira empresa ativa do usuário
 */
export async function getCurrentCompany(): Promise<Company | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Buscar empresa através do relacionamento company_users
  const { data: companyUser, error } = await supabase
    .from('company_users')
    .select('company_id, companies(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !companyUser) {
    return null
  }

  // companies pode ser um objeto único ou array, mas com .single() é sempre um objeto
  const companies = companyUser.companies
  if (Array.isArray(companies)) {
    return companies[0] as Company
  }
  return companies as Company
}

/**
 * Obtém todas as empresas do usuário autenticado
 */
export async function getUserCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('company_users')
    .select('company_id, companies(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error || !data) {
    return []
  }

  return data.map((item) => {
    const companies = item.companies
    if (Array.isArray(companies)) {
      return companies[0] as Company
    }
    return companies as Company
  })
}

/**
 * Verifica se o usuário pertence à empresa
 */
export async function userBelongsToCompany(companyId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('company_users')
    .select('id')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  return !error && !!data
}

/**
 * Obtém o papel do usuário na empresa
 */
export async function getUserRoleInCompany(companyId: string): Promise<CompanyUser['role'] | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('company_users')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.role as CompanyUser['role']
}

