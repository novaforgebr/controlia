/**
 * Helper para proteger rotas - requer autenticação
 * Redireciona para login se não autenticado
 */

import { redirect } from 'next/navigation'
import { getSession } from './get-session'

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

