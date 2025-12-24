import { NextResponse } from 'next/server'

/**
 * Endpoint de health check para integrações
 * GET /api/integrations/health
 */
export async function GET() {
  const checks: Record<string, { status: string; message: string }> = {}

  // Verificar variáveis de ambiente
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  const n8nSecret = process.env.N8N_SECRET

  checks.environment = {
    status: n8nUrl && n8nSecret ? 'ok' : 'error',
    message: n8nUrl && n8nSecret
      ? 'Variáveis de ambiente configuradas'
      : 'N8N_WEBHOOK_URL ou N8N_SECRET não configurados',
  }

  // Verificar conectividade com n8n (se configurado)
  if (n8nUrl && n8nSecret) {
    try {
      const response = await fetch(`${n8nUrl}/health`, {
        method: 'GET',
        headers: {
          'X-N8N-Secret': n8nSecret,
        },
        signal: AbortSignal.timeout(5000),
      })

      checks.n8n_connectivity = {
        status: response.ok ? 'ok' : 'warning',
        message: response.ok
          ? 'n8n está acessível'
          : `n8n respondeu com status ${response.status}`,
      }
    } catch (error) {
      checks.n8n_connectivity = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao conectar com n8n',
      }
    }
  } else {
    checks.n8n_connectivity = {
      status: 'skipped',
      message: 'Não verificado (variáveis não configuradas)',
    }
  }

  const allOk = Object.values(checks).every((check) => check.status === 'ok')
  const hasErrors = Object.values(checks).some((check) => check.status === 'error')

  return NextResponse.json({
    status: allOk ? 'healthy' : hasErrors ? 'unhealthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  })
}

