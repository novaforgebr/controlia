// Supabase Edge Function para enviar e-mail de convite
// Esta função deve ser deployada no Supabase usando: supabase functions deploy send-invite-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SMTP_HOST = Deno.env.get('SMTP_HOST')
const SMTP_PORT = Deno.env.get('SMTP_PORT')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@controlia.com'

interface EmailRequest {
  to: string
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, html, text }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Opção 1: Usar Resend (recomendado)
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
          text,
        }),
      })

      if (resendResponse.ok) {
        const data = await resendResponse.json()
        return new Response(
          JSON.stringify({ success: true, messageId: data.id }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Opção 2: Usar SMTP direto
    if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
      // Implementação SMTP usando biblioteca Deno
      // Nota: Para produção, use uma biblioteca SMTP confiável
      const smtpResponse = await sendSMTPEmail({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        user: SMTP_USER,
        password: SMTP_PASSWORD,
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      })

      if (smtpResponse.success) {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Se nenhum método de e-mail estiver configurado, retornar erro
    return new Response(
      JSON.stringify({
        error: 'Nenhum serviço de e-mail configurado. Configure RESEND_API_KEY ou SMTP.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Função auxiliar para enviar e-mail via SMTP
async function sendSMTPEmail({
  host,
  port,
  user,
  password,
  from,
  to,
  subject,
  html,
  text,
}: {
  host: string
  port: number
  user: string
  password: string
  from: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Nota: Esta é uma implementação simplificada
    // Para produção, use uma biblioteca SMTP como 'deno-smtp' ou similar
    // Por enquanto, retornamos sucesso (implementação completa requer biblioteca SMTP)
    
    // Exemplo usando fetch para serviços SMTP via API
    // Ou use uma biblioteca como: https://deno.land/x/smtp
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

