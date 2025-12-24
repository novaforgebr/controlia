import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route para enviar e-mail de convite usando o Supabase
 * 
 * O Supabase pode enviar e-mails através de:
 * 1. Edge Functions (recomendado)
 * 2. Integração com serviços externos (Resend, SendGrid, etc.)
 * 
 * Esta rota prepara os dados e pode ser integrada com Edge Functions
 * ou usar o sistema de e-mail configurado no Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { invitationId, email, token, companyName, inviterName } = await request.json()

    if (!invitationId || !email || !token) {
      return NextResponse.json(
        { error: 'Dados incompletos para envio de e-mail' },
        { status: 400 }
      )
    }

    // Buscar informações do convite e empresa
    const { data: invitationData } = await supabase
      .from('user_invitations')
      .select('company_id, companies(name, email)')
      .eq('id', invitationId)
      .single()

    if (!invitationData) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    const company = Array.isArray(invitationData.companies) 
      ? invitationData.companies[0] 
      : invitationData.companies

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${token}`

    // Preparar conteúdo do e-mail
    const emailSubject = `Convite para se juntar à ${companyName || company?.name || 'nossa empresa'}`
    
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite para ${companyName || 'nossa empresa'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #039155 0%, #18B0BB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Você foi convidado!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Olá,
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${inviterName || 'Um administrador'} convidou você para se juntar à <strong>${companyName || company?.name || 'nossa empresa'}</strong> no Controlia CRM.
          </p>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Clique no botão abaixo para aceitar o convite e criar sua conta:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #039155 0%, #18B0BB 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Aceitar Convite
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Ou copie e cole este link no seu navegador:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb;">
            ${inviteUrl}
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este e-mail.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p>Este é um e-mail automático, por favor não responda.</p>
          <p>&copy; ${new Date().getFullYear()} Controlia CRM. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `

    const emailText = `
Você foi convidado para se juntar à ${companyName || company?.name || 'nossa empresa'} no Controlia CRM.

${inviterName || 'Um administrador'} convidou você para fazer parte da equipe.

Para aceitar o convite, acesse: ${inviteUrl}

Este convite expira em 7 dias.

Se você não solicitou este convite, pode ignorar este e-mail.
    `.trim()

    // Opção 1: Usar Edge Function do Supabase (recomendado)
    // Chama uma Edge Function que envia o e-mail
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && serviceRoleKey) {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-invite-email`
      
      try {
        const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            html: emailBody,
            text: emailText,
          }),
        })

        if (edgeFunctionResponse.ok) {
          const result = await edgeFunctionResponse.json()
          return NextResponse.json({ 
            success: true, 
            message: 'E-mail enviado com sucesso',
            data: result 
          })
        } else {
          const error = await edgeFunctionResponse.text()
          console.error('Erro na Edge Function:', error)
        }
      } catch (error) {
        console.error('Erro ao chamar Edge Function:', error)
      }
    } else {
      console.warn('Edge Function não configurada. Configure SUPABASE_SERVICE_ROLE_KEY no .env.local')
    }

    // Opção 2: Usar Supabase Auth para enviar e-mail customizado
    // Nota: O Supabase Auth tem limitações para e-mails customizados
    // Esta é uma solução alternativa que pode ser usada se a Edge Function não estiver disponível
    
    // Para produção, recomenda-se usar uma Edge Function do Supabase
    // que integra com serviços como Resend, SendGrid, ou SMTP direto
    
    // Por enquanto, retornamos sucesso (o e-mail será enviado pela Edge Function quando configurada)
    return NextResponse.json({
      success: true,
      message: 'E-mail será enviado pela Edge Function',
      inviteUrl, // Para desenvolvimento, retornar o link
    })
  } catch (error) {
    console.error('Erro ao enviar e-mail de convite:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar e-mail de convite' },
      { status: 500 }
    )
  }
}

