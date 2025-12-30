'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentCompany } from '@/lib/utils/company'
import { revalidatePath } from 'next/cache'

/**
 * Listar eventos do calendário
 * @param startDate - Data de início (opcional)
 * @param endDate - Data de fim (opcional)
 * @param companyId - ID da empresa (opcional, para uso via API externa)
 */
export async function listCalendarEvents(startDate?: Date, endDate?: Date, companyId?: string) {
  try {
    let company = null
    let supabase = null

    // Se company_id foi fornecido, usar service role client (para APIs externas como n8n)
    if (companyId) {
      console.log('🔍 listCalendarEvents - Usando companyId:', companyId)
      try {
        // Verificar se a service role key está configurada
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
          return { error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada. Verifique as variáveis de ambiente no Vercel.', data: [] }
        }
        
        supabase = createServiceRoleClient()
        console.log('✅ Service role client criado')
        console.log('🔍 Service role key configurada:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
        console.log('🔍 Service role key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...')
        
        // Normalizar o ID removendo todos os espaços, quebras de linha e caracteres invisíveis
        const normalizedCompanyId = companyId
          .trim()
          .replace(/[\n\r\t]/g, '')
          .replace(/\s+/g, '')
          .split('\n')[0]
          .trim()
        
        // Validar formato UUID (36 caracteres com hífens ou 32 sem)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(normalizedCompanyId)) {
          console.error('❌ Formato de UUID inválido:', normalizedCompanyId)
          return { error: `Formato de company_id inválido. Deve ser um UUID válido. Recebido: ${normalizedCompanyId}`, data: [] }
        }
        
        console.log('🔍 ID original:', JSON.stringify(companyId))
        console.log('🔍 ID normalizado:', JSON.stringify(normalizedCompanyId))
        console.log('🔍 Tipo do ID:', typeof normalizedCompanyId)
        console.log('🔍 Tamanho do ID:', normalizedCompanyId.length)
        console.log('🔍 UUID válido:', uuidRegex.test(normalizedCompanyId))
        
        // Verificar se o service role client está funcionando corretamente
        // Primeiro, tentar uma query simples para verificar acesso
        const { data: testAccess, error: testError, count: testCount } = await supabase
          .from('companies')
          .select('id', { count: 'exact' })
          .limit(1)
        console.log('🔍 Teste de acesso à tabela companies:', { 
          testAccess, 
          testError,
          count: testCount,
          canAccess: !testError && testAccess !== null
        })
        
        if (testError) {
          console.error('❌ Erro ao acessar tabela companies:', testError)
          return { 
            error: `Erro ao acessar tabela companies. Service role pode não estar funcionando corretamente. Erro: ${testError.message} (código: ${testError.code})`, 
            data: [] 
          }
        }
        
        // Tentar buscar a empresa usando service role client
        // O service role DEVE bypassar RLS automaticamente, mas vamos tentar RPC primeiro
        let companyData = null
        let companyError = null
        
        console.log('🔍 Executando query para buscar empresa com ID:', normalizedCompanyId)
        
        // Primeiro, tentar usar a função RPC que garante bypass de RLS
        try {
          const rpcResult = await supabase.rpc('get_company_by_id', {
            company_uuid: normalizedCompanyId
          })
          
          console.log('🔍 RPC get_company_by_id resultado:', {
            hasData: !!rpcResult.data && rpcResult.data.length > 0,
            data: rpcResult.data,
            error: rpcResult.error,
            status: rpcResult.status,
            statusText: rpcResult.statusText
          })
          
          if (rpcResult.error) {
            console.warn('⚠️ RPC falhou, tentando query direta:', rpcResult.error.message)
          } else if (rpcResult.data && rpcResult.data.length > 0) {
            companyData = rpcResult.data[0]
            console.log('✅ Empresa encontrada via RPC:', companyData)
          }
        } catch (rpcErr) {
          console.warn('⚠️ Erro ao executar RPC, tentando query direta:', rpcErr)
        }
        
        // Se RPC não funcionou ou não encontrou, tentar query direta
        if (!companyData) {
          console.log('🔍 Tentando query direta na tabela companies')
          
          // Tentar com maybeSingle primeiro (retorna null se não encontrar, sem erro)
          const result = await supabase
            .from('companies')
            .select('id, name, is_active')
            .eq('id', normalizedCompanyId)
            .maybeSingle()
          
          companyData = result.data
          companyError = result.error
          
          console.log('🔍 Query maybeSingle resultado:', {
            hasData: !!result.data,
            data: result.data,
            error: result.error,
            status: result.status,
            statusText: result.statusText
          })
          
          // Se não encontrou e não há erro, tentar com single() para ver se há algum erro diferente
          if (!companyData && !companyError) {
            console.log('🔍 Nenhum dado encontrado com maybeSingle, tentando single() para debug')
            const result2 = await supabase
              .from('companies')
              .select('id, name, is_active')
              .eq('id', normalizedCompanyId)
              .single()
            
            console.log('🔍 Query single() resultado:', {
              hasData: !!result2.data,
              data: result2.data,
              error: result2.error,
              status: result2.status,
              statusText: result2.statusText
            })
            
            if (result2.error) {
              companyError = result2.error
            } else if (result2.data) {
              companyData = result2.data
            }
          }
        }
        
        console.log('🔍 Resultado da query empresa:', { 
          companyData, 
          companyError,
          hasData: !!companyData,
          errorCode: companyError?.code,
          errorMessage: companyError?.message,
          errorDetails: companyError?.details,
          errorHint: companyError?.hint
        })
        
        if (companyError) {
          console.error('❌ Erro ao buscar empresa:', companyError)
          
          // Se o erro for de RLS ou permissão, pode ser problema com service role
          if (companyError.code === 'PGRST116' || companyError.message?.includes('permission') || companyError.message?.includes('policy') || companyError.message?.includes('RLS')) {
            console.warn('⚠️ Possível problema com RLS - Service role pode não estar bypassando corretamente')
            
            // Tentar buscar todas as empresas para debug
            const { data: allCompanies, error: allError } = await supabase
              .from('companies')
              .select('id, name, is_active')
              .limit(10)
            console.log('🔍 Debug - Primeiras 10 empresas no banco:', allCompanies)
            console.log('🔍 Debug - Erro ao listar empresas:', allError)
            
            return { error: `Erro ao buscar empresa (possível problema de RLS): ${companyError.message}. Service role key pode não estar configurada corretamente ou RLS não está sendo bypassado. Verifique a variável SUPABASE_SERVICE_ROLE_KEY no Vercel.`, data: [] }
          } else {
            return { error: `Erro ao buscar empresa: ${companyError.message} (código: ${companyError.code})`, data: [] }
          }
        }
        
        if (!companyData) {
          console.error('❌ Empresa não encontrada com ID:', normalizedCompanyId)
          
          // Debug: Tentar buscar todas as empresas para verificar acesso
          const { data: allCompanies, error: allError } = await supabase
            .from('companies')
            .select('id, name, is_active')
            .limit(10)
          
          const companyIds = allCompanies?.map(c => c.id) || []
          const exactMatch = companyIds.some(id => id === normalizedCompanyId)
          const partialMatch = companyIds.some(id => id.includes(normalizedCompanyId.substring(0, 8)))
          
          console.log('🔍 Debug - Primeiras 10 empresas no banco:', allCompanies)
          console.log('🔍 Debug - IDs encontrados:', companyIds)
          console.log('🔍 Debug - ID procurado:', normalizedCompanyId)
          console.log('🔍 Debug - IDs coincidem exatamente?', exactMatch)
          console.log('🔍 Debug - IDs coincidem parcialmente?', partialMatch)
          console.log('🔍 Debug - Erro ao listar empresas:', allError)
          console.log('🔍 Debug - Service role key configurada:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
          console.log('🔍 Debug - Service role key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20))
          
          let errorMessage = `Empresa não encontrada com ID: ${normalizedCompanyId}.`
          
          if (allError) {
            errorMessage += ` Erro ao acessar tabela companies: ${allError.message}. Isso pode indicar problema com service role key ou RLS.`
          } else if (allCompanies && allCompanies.length > 0) {
            errorMessage += ` Acesso à tabela OK. Encontradas ${allCompanies.length} empresas, mas nenhuma com o ID especificado.`
            errorMessage += ` IDs disponíveis (primeiros 3): ${companyIds.slice(0, 3).join(', ')}`
          } else {
            errorMessage += ` Nenhuma empresa encontrada no banco. Verifique se há empresas cadastradas.`
          }
          
          errorMessage += ` Verifique o script supabase/test-company-exists.sql para mais detalhes.`
          
          return { error: errorMessage, data: [] }
        }
        
        console.log('✅ Empresa encontrada:', { id: companyData.id, name: companyData.name, is_active: companyData.is_active })
        company = { id: companyData.id }
      } catch (error) {
        console.error('❌ Erro ao criar service role client ou buscar empresa:', error)
        return { error: `Erro ao acessar banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, data: [] }
      }
    } else {
      // Caso contrário, usar autenticação normal (para requisições do frontend)
      company = await getCurrentCompany()
      if (!company) {
        return { error: 'Empresa não encontrada', data: [] }
      }
      supabase = await createClient()
    }

    let query = supabase
      .from('calendar_events')
      .select('*, contacts:contact_id(name, email), user_profiles:organizer_id(full_name)')
      .eq('company_id', company.id)
      .eq('status', 'scheduled')
      .order('start_at', { ascending: true })

    if (startDate && endDate) {
      query = query
        .gte('start_at', startDate.toISOString())
        .lte('end_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar eventos:', error)
      return { error: 'Erro ao listar eventos', data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao listar eventos', data: [] }
  }
}

/**
 * Obter um evento específico
 */
export async function getCalendarEvent(id: string) {
  try {
    const company = await getCurrentCompany()
    if (!company) {
      return { error: 'Empresa não encontrada', data: null }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, contacts:contact_id(name, email), user_profiles:organizer_id(full_name)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (error) {
      console.error('Erro ao buscar evento:', error)
      return { error: 'Evento não encontrado', data: null }
    }

    return { data }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao buscar evento', data: null }
  }
}

/**
 * Criar evento
 * @param formData - Dados do evento
 * @param companyId - ID da empresa (opcional, para uso via API externa)
 */
export async function createCalendarEvent(formData: FormData, companyId?: string) {
  try {
    let company = null
    let supabase = null
    let user = null

    // Se company_id foi fornecido, usar service role client (para APIs externas como n8n)
    if (companyId) {
      supabase = createServiceRoleClient()
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .single()
      
      if (!companyData) {
        return { error: 'Empresa não encontrada' }
      }
      company = { id: companyId }
      // Para requisições externas, usar o organizer_id fornecido ou null
      const organizerId = formData.get('organizer_id') as string
      user = organizerId ? { id: organizerId } : null
    } else {
      // Caso contrário, usar autenticação normal (para requisições do frontend)
      company = await getCurrentCompany()
      if (!company) {
        return { error: 'Empresa não encontrada' }
      }
      supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        return { error: 'Usuário não autenticado' }
      }
      user = authUser
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_at = formData.get('start_at') as string
    const end_at = formData.get('end_at') as string
    const is_all_day = formData.get('is_all_day') === 'true'
    const location = formData.get('location') as string
    const contact_id = formData.get('contact_id') as string
    const visibility = formData.get('visibility') as string || 'company'

    if (!title || !start_at || !end_at) {
      return { error: 'Título, data de início e fim são obrigatórios' }
    }

    const insertData: any = {
      company_id: company.id,
      title,
      description: description || null,
      start_at,
      end_at,
      is_all_day,
      location: location || null,
      contact_id: contact_id || null,
      visibility,
    }

    // Adicionar campos de usuário apenas se disponível
    if (user) {
      insertData.organizer_id = user.id
      insertData.created_by = user.id
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar evento:', error)
      return { error: 'Erro ao criar evento' }
    }

    revalidatePath('/calendar')
    return { success: true, data: event }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao criar evento' }
  }
}

/**
 * Atualizar evento
 * @param id - ID do evento
 * @param formData - Dados atualizados
 * @param companyId - ID da empresa (opcional, para uso via API externa)
 */
export async function updateCalendarEvent(id: string, formData: FormData, companyId?: string) {
  try {
    let company = null
    let supabase = null

    // Se company_id foi fornecido, usar service role client (para APIs externas como n8n)
    if (companyId) {
      supabase = createServiceRoleClient()
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .single()
      
      if (!companyData) {
        return { error: 'Empresa não encontrada' }
      }
      company = { id: companyId }
    } else {
      // Caso contrário, usar autenticação normal (para requisições do frontend)
      company = await getCurrentCompany()
      if (!company) {
        return { error: 'Empresa não encontrada' }
      }
      supabase = await createClient()
    }

    const updateData: any = {}
    if (formData.has('title')) updateData.title = formData.get('title') as string
    if (formData.has('description')) updateData.description = formData.get('description') as string || null
    if (formData.has('start_at')) updateData.start_at = formData.get('start_at') as string
    if (formData.has('end_at')) updateData.end_at = formData.get('end_at') as string
    if (formData.has('is_all_day')) updateData.is_all_day = formData.get('is_all_day') === 'true'
    if (formData.has('location')) updateData.location = formData.get('location') as string || null
    if (formData.has('contact_id')) updateData.contact_id = formData.get('contact_id') as string || null
    if (formData.has('visibility')) updateData.visibility = formData.get('visibility') as string
    if (formData.has('status')) updateData.status = formData.get('status') as string

    const { error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao atualizar evento:', error)
      return { error: 'Erro ao atualizar evento' }
    }

    revalidatePath('/calendar')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao atualizar evento' }
  }
}

/**
 * Deletar evento
 * @param id - ID do evento
 * @param companyId - ID da empresa (opcional, para uso via API externa)
 */
export async function deleteCalendarEvent(id: string, companyId?: string) {
  try {
    let company = null
    let supabase = null

    // Se company_id foi fornecido, usar service role client (para APIs externas como n8n)
    if (companyId) {
      supabase = createServiceRoleClient()
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .single()
      
      if (!companyData) {
        return { error: 'Empresa não encontrada' }
      }
      company = { id: companyId }
    } else {
      // Caso contrário, usar autenticação normal (para requisições do frontend)
      company = await getCurrentCompany()
      if (!company) {
        return { error: 'Empresa não encontrada' }
      }
      supabase = await createClient()
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id)

    if (error) {
      console.error('Erro ao deletar evento:', error)
      return { error: 'Erro ao deletar evento' }
    }

    revalidatePath('/calendar')
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    return { error: 'Erro ao deletar evento' }
  }
}

