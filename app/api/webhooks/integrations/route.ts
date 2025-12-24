import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const N8N_SECRET = process.env.N8N_SECRET || ''

/**
 * Webhook recebido do n8n para atualizar status de integrações
 * POST /api/webhooks/integrations
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret
    const secret = request.headers.get('X-N8N-Secret')
    if (secret !== N8N_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = body

    const supabase = await createClient()

    switch (event) {
      case 'channel.connected':
        // Atualizar status para connected
        await supabase
          .from('channel_integrations')
          .update({
            status: 'connected',
            connected_at: new Date().toISOString(),
            qr_code_base64: null, // Limpar QR Code após conexão
          })
          .eq('n8n_instance_id', data.instance_id)
        break

      case 'channel.disconnected':
        // Atualizar status para disconnected
        await supabase
          .from('channel_integrations')
          .update({
            status: 'disconnected',
            disconnected_at: new Date().toISOString(),
          })
          .eq('n8n_instance_id', data.instance_id)
        break

      case 'channel.qr_code':
        // Atualizar QR Code
        await supabase
          .from('channel_integrations')
          .update({
            qr_code_base64: data.qr_code,
            status: 'connecting',
          })
          .eq('n8n_instance_id', data.instance_id)
        break

      case 'channel.error':
        // Atualizar status para error
        await supabase
          .from('channel_integrations')
          .update({
            status: 'error',
            connection_data: {
              ...data.connection_data,
              error: data.error_message,
            },
          })
          .eq('n8n_instance_id', data.instance_id)
        break

      default:
        console.warn('Evento desconhecido:', event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no webhook de integrações:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

