import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Cria cliente Supabase com service role (bypass RLS)
 * Use apenas para operações internas como webhooks
 * 
 * IMPORTANTE: O service role client DEVE bypassar RLS automaticamente.
 * Se não estiver funcionando, verifique:
 * 1. Se a SUPABASE_SERVICE_ROLE_KEY está configurada corretamente
 * 2. Se é a service_role key (não a anon key)
 * 3. Se não há espaços extras na variável de ambiente
 */
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  
  // Validar que é uma service role key (começa com eyJ e é um JWT válido)
  if (!serviceRoleKey.startsWith('eyJ')) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY pode não ser válida (deve ser um JWT começando com eyJ)')
  }

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'controlia-service-role',
        },
      },
    }
  )

  return client
}

