#!/usr/bin/env tsx
/**
 * Script para corrigir automaticamente as automações no banco de dados
 * 
 * Uso: npx tsx scripts/corrigir-automacoes-automatico.ts
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
  console.log('🔧 Corrigindo automações automaticamente...\n')

  // Buscar todas as empresas
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .limit(100)

  if (companiesError || !companies) {
    console.error('❌ Erro ao buscar empresas:', companiesError)
    process.exit(1)
  }

  for (const company of companies) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🏢 Empresa: ${company.name || company.id}`)
    console.log(`${'='.repeat(60)}\n`)

    // Buscar todas as automações da empresa
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('id, name, trigger_event, is_active, is_paused, n8n_webhook_url, n8n_workflow_id')
      .eq('company_id', company.id)

    if (automationsError) {
      console.error(`❌ Erro ao buscar automações: ${automationsError.message}`)
      continue
    }

    if (!automations || automations.length === 0) {
      console.log('⚠️  Nenhuma automação encontrada')
      continue
    }

    // 1. Ativar "Atendimento com IA - Mensagens Recebidas"
    const mensagensRecebidas = automations.find(a => 
      a.name.includes('Mensagens Recebidas') || 
      (a.name.includes('Atendimento com IA') && a.name.includes('Mensagens'))
    )

    if (mensagensRecebidas) {
      console.log(`📝 Corrigindo: ${mensagensRecebidas.name}`)
      
      const updates: Record<string, unknown> = {}
      let needsUpdate = false

      if (mensagensRecebidas.trigger_event !== 'new_message') {
        updates.trigger_event = 'new_message'
        needsUpdate = true
      }
      if (!mensagensRecebidas.is_active) {
        updates.is_active = true
        needsUpdate = true
      }
      if (mensagensRecebidas.is_paused) {
        updates.is_paused = false
        needsUpdate = true
      }
      if (!mensagensRecebidas.n8n_webhook_url || !mensagensRecebidas.n8n_webhook_url.includes('secret=')) {
        updates.n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025'
        needsUpdate = true
      }
      if (!mensagensRecebidas.n8n_workflow_id) {
        updates.n8n_workflow_id = 'EW96u6Ji0AqtS7up'
        needsUpdate = true
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('automations')
          .update(updates)
          .eq('id', mensagensRecebidas.id)

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
        } else {
          console.log(`   ✅ Atualizada com sucesso`)
          if (updates.trigger_event) console.log(`      - trigger_event: ${updates.trigger_event}`)
          if (updates.is_active !== undefined) console.log(`      - is_active: ${updates.is_active}`)
          if (updates.is_paused !== undefined) console.log(`      - is_paused: ${updates.is_paused}`)
          if (updates.n8n_webhook_url) console.log(`      - n8n_webhook_url: Configurada`)
          if (updates.n8n_workflow_id) console.log(`      - n8n_workflow_id: ${updates.n8n_workflow_id}`)
        }
      } else {
        console.log(`   ✅ Já está configurada corretamente`)
      }
    } else {
      console.log('⚠️  Automação "Atendimento com IA - Mensagens Recebidas" não encontrada')
      console.log('   💡 Crie esta automação em: Configurações > n8n')
    }

    // 2. Pausar "Envia Mensagens do App"
    const enviaMensagens = automations.find(a => 
      a.name.includes('Envia Mensagens do App') || 
      a.name.includes('Envia Mensagens')
    )

    if (enviaMensagens) {
      console.log(`\n📝 Corrigindo: ${enviaMensagens.name}`)
      
      if (!enviaMensagens.is_paused) {
        const { error: updateError } = await supabase
          .from('automations')
          .update({ is_paused: true })
          .eq('id', enviaMensagens.id)

        if (updateError) {
          console.error(`   ❌ Erro ao pausar: ${updateError.message}`)
        } else {
          console.log(`   ✅ Pausada com sucesso (não processa mensagens recebidas)`)
        }
      } else {
        console.log(`   ✅ Já está pausada corretamente`)
      }
    }

    // 3. Pausar "Atendimento com IA" duplicada (sem "Mensagens Recebidas")
    const atendimentoIA = automations.find(a => 
      a.name === 'Atendimento com IA' && 
      !a.name.includes('Mensagens Recebidas') &&
      a.id !== mensagensRecebidas?.id
    )

    if (atendimentoIA) {
      console.log(`\n📝 Corrigindo: ${atendimentoIA.name}`)
      
      if (!atendimentoIA.is_paused) {
        const { error: updateError } = await supabase
          .from('automations')
          .update({ is_paused: true })
          .eq('id', atendimentoIA.id)

        if (updateError) {
          console.error(`   ❌ Erro ao pausar: ${updateError.message}`)
        } else {
          console.log(`   ✅ Pausada com sucesso (duplicada)`)
        }
      } else {
        console.log(`   ✅ Já está pausada corretamente`)
      }
    }

    // 4. Verificar resultado final
    console.log(`\n📊 Status final das automações:`)
    const { data: finalAutomations } = await supabase
      .from('automations')
      .select('id, name, trigger_event, is_active, is_paused, n8n_webhook_url')
      .eq('company_id', company.id)
      .eq('trigger_event', 'new_message')

    if (finalAutomations) {
      for (const auto of finalAutomations) {
        const status = auto.is_active && !auto.is_paused ? '✅ Ativa' : '⏸️  Pausada'
        const hasSecret = auto.n8n_webhook_url?.includes('secret=') ? '✅' : '⚠️'
        console.log(`   ${auto.name}`)
        console.log(`     Status: ${status}`)
        console.log(`     Secret: ${hasSecret}`)
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Correção completa!')
  console.log(`${'='.repeat(60)}\n`)
}

main().catch((error) => {
  console.error('❌ Erro:', error)
  process.exit(1)
})


