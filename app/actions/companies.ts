'use server'

/**
 * Server Actions para gerenciamento de empresas
 */

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-session'
import { logHumanAction } from '@/lib/utils/audit'

/**
 * Criar empresa e associar usuário como admin
 */
export async function createCompany(name: string, slug?: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    // Verificar se o perfil do usuário existe, se não, criar
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Criar perfil do usuário se não existir
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
        })

      if (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError)
        return { error: 'Erro ao criar perfil. Por favor, faça logout e login novamente.' }
      }
    }

    // Gerar slug se não fornecido
    const companySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Verificar se slug já existe
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single()

    if (existing) {
      return { error: 'Este nome de empresa já está em uso. Escolha outro.' }
    }

    // Criar empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        slug: companySlug,
        is_active: true,
      })
      .select()
      .single()

    if (companyError || !company) {
      console.error('Erro ao criar empresa:', companyError)
      return { error: 'Erro ao criar empresa' }
    }

    // Associar usuário como admin
    // IMPORTANTE: Usar RPC ou inserir diretamente com bypass RLS se necessário
    const { error: userError } = await supabase
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: 'admin',
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      console.error('Erro ao associar usuário:', userError)
      // Tentar deletar empresa criada
      await supabase.from('companies').delete().eq('id', company.id)
      return { 
        error: 'Erro ao associar usuário à empresa',
        details: userError.message 
      }
    }

    // Registrar auditoria
    await logHumanAction(
      company.id,
      user.id,
      'create_company',
      'company',
      company.id,
      { created: company }
    )

    return { success: true, data: company }
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    return { error: 'Erro ao criar empresa' }
  }
}

/**
 * Buscar empresa atual do usuário
 */
export async function getCurrentCompany() {
  try {
    const user = await getUser()
    if (!user) {
      return null
    }

    const supabase = await createClient()

    const { data } = await supabase
      .from('company_users')
      .select('company_id, companies(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!data || !data.companies) {
      return null
    }

    return data.companies
  } catch (error) {
    console.error('Erro ao buscar empresa:', error)
    return null
  }
}

/**
 * Atualizar empresa
 */
export async function updateCompany(companyId: string, formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    // Verificar se usuário tem permissão
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!companyUser || companyUser.role !== 'admin') {
      return { error: 'Sem permissão para atualizar empresa' }
    }

    const updates: Record<string, unknown> = {}
    const name = formData.get('name')
    const email = formData.get('email')
    const phone = formData.get('phone')

    if (name) updates.name = name
    if (email !== null) updates.email = email || null
    if (phone !== null) updates.phone = phone || null

    const { data: updated, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar empresa:', error)
      return { error: 'Erro ao atualizar empresa' }
    }

    await logHumanAction(
      companyId,
      user.id,
      'update_company',
      'company',
      companyId,
      { updated }
    )

    return { success: true, data: updated }
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    return { error: 'Erro ao atualizar empresa' }
  }
}

/**
 * Atualizar configurações da empresa
 */
export async function updateCompanySettings(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    const supabase = await createClient()

    // Buscar empresa atual
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!companyUser || companyUser.role !== 'admin') {
      return { error: 'Sem permissão para atualizar configurações' }
    }

    // Buscar configurações atuais
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyUser.company_id)
      .single()

    const currentSettings = (company?.settings as Record<string, unknown>) || {}

    // Atualizar configurações do FormData
    const newSettings: Record<string, unknown> = { ...currentSettings }

    // Processar checkboxes e campos
    const fields = [
      'ai_global_enabled',
      'notifications_email_enabled',
      'notifications_new_conversation',
      'notifications_ai_actions',
      'data_retention_enabled',
      'whatsapp_api_url',
      'whatsapp_api_key',
      'whatsapp_webhook_secret',
      'telegram_bot_token',
      'telegram_webhook_url',
      'telegram_webhook_secret',
      'email_smtp_host',
      'email_smtp_port',
      'email_smtp_secure',
      'email_smtp_user',
      'email_smtp_password',
      'ai_default_model',
      'ai_temperature',
      'data_retention_days',
    ]

    fields.forEach((field) => {
      const value = formData.get(field)
      if (value !== null) {
        if (field.includes('enabled') || field.includes('_enabled')) {
          newSettings[field] = value === 'true'
        } else if (field === 'ai_temperature' || field === 'data_retention_days' || field === 'email_smtp_port') {
          newSettings[field] = value ? Number(value) : null
        } else {
          newSettings[field] = value || null
        }
      }
    })

    const { error } = await supabase
      .from('companies')
      .update({ settings: newSettings })
      .eq('id', companyUser.company_id)

    if (error) {
      console.error('Erro ao atualizar configurações:', error)
      return { error: 'Erro ao atualizar configurações' }
    }

    await logHumanAction(
      companyUser.company_id,
      user.id,
      'update_company_settings',
      'company',
      companyUser.company_id,
      { settings: newSettings }
    )

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return { error: 'Erro ao atualizar configurações' }
  }
}

