/**
 * Validações para o módulo de Conversas
 */

import { z } from 'zod'

export const conversationStatusSchema = z.enum(['open', 'closed', 'transferred', 'waiting'])
export const conversationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])
export const channelSchema = z.enum(['whatsapp', 'email', 'chat', 'phone', 'other'])

export const createConversationSchema = z.object({
  contact_id: z.string().uuid('ID do contato inválido'),
  channel: channelSchema.default('whatsapp'),
  channel_thread_id: z.string().optional().or(z.literal('')),
  status: conversationStatusSchema.default('open'),
  priority: conversationPrioritySchema.default('normal'),
  subject: z.string().max(500).optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  ai_assistant_enabled: z.boolean().default(true),
})

export const updateConversationSchema = createConversationSchema.partial().omit({ contact_id: true })

export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>

