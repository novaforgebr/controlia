#!/usr/bin/env tsx
/**
 * Script para verificar se a configuração do Chat Omnichannel está completa
 * 
 * Uso: npx tsx scripts/verify-setup.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface CheckResult {
  name: string
  status: 'ok' | 'error' | 'warning'
  message: string
}

const checks: CheckResult[] = []

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'N8N_WEBHOOK_URL',
    'N8N_SECRET',
  ]

  const missing: string[] = []
  const present: string[] = []

  required.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName)
    } else {
      missing.push(varName)
    }
  })

  if (missing.length === 0) {
    checks.push({
      name: 'Variáveis de Ambiente',
      status: 'ok',
      message: `Todas as variáveis necessárias estão configuradas (${present.length})`,
    })
  } else {
    checks.push({
      name: 'Variáveis de Ambiente',
      status: 'error',
      message: `Variáveis faltando: ${missing.join(', ')}`,
    })
  }
}

// Verificar estrutura do banco de dados
async function checkDatabaseStructure() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    checks.push({
      name: 'Estrutura do Banco de Dados',
      status: 'error',
      message: 'Não é possível verificar: credenciais do Supabase não configuradas',
    })
    return
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verificar tabela channel_integrations
    const { data: tableExists, error: tableError } = await supabase
      .from('channel_integrations')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      checks.push({
        name: 'Tabela channel_integrations',
        status: 'error',
        message: 'Tabela não existe. Execute a migração 001_optimize_chat_performance.sql',
      })
    } else if (tableError) {
      checks.push({
        name: 'Tabela channel_integrations',
        status: 'warning',
        message: `Erro ao verificar: ${tableError.message}`,
      })
    } else {
      checks.push({
        name: 'Tabela channel_integrations',
        status: 'ok',
        message: 'Tabela existe e está acessível',
      })
    }

    // Verificar trigger (verificação simplificada)
    // Como não temos acesso direto ao catálogo do PostgreSQL via Supabase,
    // vamos apenas verificar se conseguimos fazer uma query básica
    // O trigger será testado na prática quando uma mensagem for inserida
    checks.push({
      name: 'Trigger auto_disable_ai',
      status: 'warning',
      message: 'Execute a migração 001_optimize_chat_performance.sql para criar o trigger',
    })
  } catch (error) {
    checks.push({
      name: 'Estrutura do Banco de Dados',
      status: 'error',
      message: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
  }
}

// Verificar conectividade com n8n
async function checkN8nConnectivity() {
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  const n8nSecret = process.env.N8N_SECRET

  if (!n8nUrl || !n8nSecret) {
    checks.push({
      name: 'Conectividade n8n',
      status: 'error',
      message: 'N8N_WEBHOOK_URL ou N8N_SECRET não configurados',
    })
    return
  }

  try {
    const response = await fetch(`${n8nUrl}/health`, {
      method: 'GET',
      headers: {
        'X-N8N-Secret': n8nSecret,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      checks.push({
        name: 'Conectividade n8n',
        status: 'ok',
        message: 'n8n está acessível e respondendo',
      })
    } else {
      checks.push({
        name: 'Conectividade n8n',
        status: 'warning',
        message: `n8n respondeu com status ${response.status}. Verifique se está configurado corretamente.`,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      checks.push({
        name: 'Conectividade n8n',
        status: 'error',
        message: 'Timeout ao conectar com n8n. Verifique se o serviço está rodando e a URL está correta.',
      })
    } else {
      checks.push({
        name: 'Conectividade n8n',
        status: 'error',
        message: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      })
    }
  }
}

// Função principal
async function main() {
  console.log('🔍 Verificando configuração do Chat Omnichannel...\n')

  // Executar verificações
  checkEnvironmentVariables()
  await checkDatabaseStructure()
  await checkN8nConnectivity()

  // Exibir resultados
  console.log('📊 Resultados:\n')
  
  let hasErrors = false
  let hasWarnings = false

  checks.forEach((check) => {
    const icon = check.status === 'ok' ? '✅' : check.status === 'error' ? '❌' : '⚠️'
    const color = check.status === 'ok' ? '\x1b[32m' : check.status === 'error' ? '\x1b[31m' : '\x1b[33m'
    const reset = '\x1b[0m'
    
    console.log(`${icon} ${color}${check.name}${reset}`)
    console.log(`   ${check.message}\n`)

    if (check.status === 'error') hasErrors = true
    if (check.status === 'warning') hasWarnings = true
  })

  // Resumo
  console.log('\n' + '='.repeat(50))
  const okCount = checks.filter((c) => c.status === 'ok').length
  const errorCount = checks.filter((c) => c.status === 'error').length
  const warningCount = checks.filter((c) => c.status === 'warning').length

  console.log(`✅ OK: ${okCount}`)
  console.log(`⚠️  Avisos: ${warningCount}`)
  console.log(`❌ Erros: ${errorCount}`)

  if (hasErrors) {
    console.log('\n❌ Existem erros que precisam ser corrigidos antes de usar o sistema.')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('\n⚠️  Existem avisos. O sistema pode funcionar, mas recomenda-se corrigi-los.')
    process.exit(0)
  } else {
    console.log('\n✅ Todas as verificações passaram! O sistema está pronto para uso.')
    process.exit(0)
  }
}

// Executar
main().catch((error) => {
  console.error('Erro ao executar verificação:', error)
  process.exit(1)
})

