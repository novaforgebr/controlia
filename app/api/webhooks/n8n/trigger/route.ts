import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint para disparar webhooks para n8n
 * Chamado quando eventos acontecem no CRM (nova mensagem, novo contato, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, company_id, data } = body

    if (!event || !company_id) {
      return NextResponse.json(
        { error: 'Evento e company_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar automações ativas para este evento
    const { data: automations } = await supabase
      .from('automations')
      .select('*')
      .eq('company_id', company_id)
      .eq('trigger_event', event)
      .eq('is_active', true)
      .eq('is_paused', false)

    if (!automations || automations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma automação ativa para este evento',
        triggered: 0,
      })
    }

    // Disparar webhooks para cada automação
    const results = await Promise.allSettled(
      automations.map(async (automation) => {
        if (!automation.n8n_webhook_url) {
          return { automation_id: automation.id, error: 'Webhook URL não configurada' }
        }

        try {
          const response = await fetch(automation.n8n_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event,
              company_id,
              automation_id: automation.id,
              ...data,
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          // Registrar log de execução
          await supabase.from('automation_logs').insert({
            company_id,
            automation_id: automation.id,
            trigger_event: event,
            trigger_data: data,
            status: 'success',
            completed_at: new Date().toISOString(),
          })

          // Atualizar contador de execuções
          await supabase
            .from('automations')
            .update({
              last_executed_at: new Date().toISOString(),
              execution_count: (automation.execution_count || 0) + 1,
            })
            .eq('id', automation.id)

          return { automation_id: automation.id, success: true }
        } catch (error) {
          // Registrar erro
          await supabase.from('automation_logs').insert({
            company_id,
            automation_id: automation.id,
            trigger_event: event,
            trigger_data: data,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            completed_at: new Date().toISOString(),
          })

          // Atualizar contador de erros
          await supabase
            .from('automations')
            .update({
              error_count: (automation.error_count || 0) + 1,
            })
            .eq('id', automation.id)

          return { automation_id: automation.id, error: error instanceof Error ? error.message : 'Erro desconhecido' }
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      triggered: successful,
      failed,
      total: automations.length,
    })
  } catch (error) {
    console.error('Erro ao disparar webhooks:', error)
    return NextResponse.json(
      { error: 'Erro ao disparar webhooks' },
      { status: 500 }
    )
  }
}

