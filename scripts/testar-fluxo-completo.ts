#!/usr/bin/env tsx
/**
 * Script para testar o fluxo completo de mensagens
 * 
 * Uso: npx tsx scripts/testar-fluxo-completo.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Carregar variáveis de ambiente
try {
  const envPath = join(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  // Ignorar
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Credenciais do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🧪 Testando fluxo completo de mensagens...\n')

  // 1. Buscar empresas
  console.log('📋 1. Buscando empresas...')
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, settings')
    .limit(10)

  if (companiesError || !companies || companies.length === 0) {
    console.error('❌ Erro ao buscar empresas:', companiesError)
    process.exit(1)
  }

  console.log(`✅ Encontradas ${companies.length} empresa(s)\n`)

  for (const company of companies) {
    console.log(`${'='.repeat(60)}`)
    console.log(`🏢 Empresa: ${company.name || company.id}`)
    console.log(`${'='.repeat(60)}\n`)

    // 2. Buscar conversas
    console.log('📋 2. Buscando conversas...')
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, subject, channel, status, contact_id, company_id')
      .eq('company_id', company.id)
      .order('last_message_at', { ascending: false })
      .limit(5)

    if (convError) {
      console.error(`❌ Erro ao buscar conversas: ${convError.message}`)
      continue
    }

    if (!conversations || conversations.length === 0) {
      console.log('⚠️  Nenhuma conversa encontrada')
      continue
    }

    console.log(`✅ Encontradas ${conversations.length} conversa(s)\n`)

    // 3. Para cada conversa, verificar mensagens
    for (const conversation of conversations) {
      console.log(`\n📨 Conversa: ${conversation.subject || conversation.id}`)
      console.log(`   - Channel: ${conversation.channel}`)
      console.log(`   - Status: ${conversation.status}`)

      // Buscar mensagens usando service role (bypass RLS)
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, content, direction, sender_type, created_at, company_id, conversation_id')
        .eq('conversation_id', conversation.id)
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })
        .limit(10)

      if (msgError) {
        console.error(`   ❌ Erro ao buscar mensagens: ${msgError.message}`)
        continue
      }

      if (!messages || messages.length === 0) {
        console.log(`   ⚠️  Nenhuma mensagem encontrada`)
        continue
      }

      console.log(`   ✅ Encontradas ${messages.length} mensagem(ns):`)

      // Agrupar por direção e tipo
      const inbound = messages.filter(m => m.direction === 'inbound')
      const outbound = messages.filter(m => m.direction === 'outbound')
      const human = messages.filter(m => m.sender_type === 'human')
      const ai = messages.filter(m => m.sender_type === 'ai')

      console.log(`      - Inbound: ${inbound.length}`)
      console.log(`      - Outbound: ${outbound.length}`)
      console.log(`      - Human: ${human.length}`)
      console.log(`      - AI: ${ai.length}`)

      // Verificar problemas
      const problems: string[] = []

      // Verificar se há mensagens inbound com sender_type incorreto
      const wrongInbound = inbound.filter(m => m.sender_type !== 'human')
      if (wrongInbound.length > 0) {
        problems.push(`⚠️  ${wrongInbound.length} mensagem(ns) inbound com sender_type incorreto (deveria ser 'human')`)
      }

      // Verificar se há mensagens outbound da IA com sender_type incorreto
      const wrongOutboundAI = outbound.filter(m => m.sender_type !== 'ai')
      if (wrongOutboundAI.length > 0) {
        problems.push(`⚠️  ${wrongOutboundAI.length} mensagem(ns) outbound da IA com sender_type incorreto (deveria ser 'ai')`)
      }

      // Verificar se há mensagens sem company_id
      const noCompanyId = messages.filter(m => !m.company_id)
      if (noCompanyId.length > 0) {
        problems.push(`❌ ${noCompanyId.length} mensagem(ns) sem company_id`)
      }

      // Verificar se há mensagens sem conversation_id
      const noConversationId = messages.filter(m => !m.conversation_id)
      if (noConversationId.length > 0) {
        problems.push(`❌ ${noConversationId.length} mensagem(ns) sem conversation_id`)
      }

      if (problems.length > 0) {
        console.log(`\n   ⚠️  Problemas encontrados:`)
        problems.forEach(p => console.log(`      ${p}`))
      } else {
        console.log(`\n   ✅ Todas as mensagens estão corretas`)
      }

      // Mostrar últimas 3 mensagens
      console.log(`\n   📝 Últimas 3 mensagens:`)
      const lastMessages = messages.slice(-3)
      lastMessages.forEach((msg, idx) => {
        console.log(`      ${idx + 1}. [${msg.direction}] [${msg.sender_type}] ${msg.content?.substring(0, 50)}...`)
        console.log(`         ID: ${msg.id}`)
        console.log(`         Data: ${msg.created_at}`)
      })
    }

    // 4. Verificar automações
    console.log(`\n📋 3. Verificando automações...`)
    const { data: automations, error: autoError } = await supabase
      .from('automations')
      .select('id, name, trigger_event, is_active, is_paused, n8n_webhook_url')
      .eq('company_id', company.id)

    if (autoError) {
      console.error(`❌ Erro ao buscar automações: ${autoError.message}`)
    } else if (automations && automations.length > 0) {
      console.log(`✅ Encontradas ${automations.length} automação(ões):`)
      automations.forEach(auto => {
        const status = auto.is_active && !auto.is_paused ? '✅ Ativa' : '⏸️  Pausada'
        const hasUrl = auto.n8n_webhook_url ? '✅' : '❌'
        console.log(`   - ${auto.name}`)
        console.log(`     Status: ${status}`)
        console.log(`     Trigger: ${auto.trigger_event}`)
        console.log(`     Webhook URL: ${hasUrl}`)
      })
    } else {
      console.log(`⚠️  Nenhuma automação encontrada`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Teste completo finalizado!')
  console.log(`${'='.repeat(60)}\n`)
}

main().catch((error) => {
  console.error('❌ Erro:', error)
  process.exit(1)
})

