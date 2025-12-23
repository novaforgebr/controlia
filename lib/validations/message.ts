/**
 * Validações para o módulo de Mensagens
 */

import { z } from 'zod'

export const messageContentTypeSchema = z.enum(['text', 'image', 'audio', 'video', 'document', 'location'])
export const messageSenderTypeSchema = z.enum(['human', 'ai', 'system'])
export const messageDirectionSchema = z.enum(['inbound', 'outbound'])
export const messageStatusSchema = z.enum(['sent', 'delivered', 'read', 'failed'])

export const createMessageSchema = z.object({
  conversation_id: z.string().uuid('ID da conversa inválido'),
  contact_id: z.string().uuid('ID do contato inválido'),
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
  content_type: messageContentTypeSchema.default('text'),
  media_url: z.string().url().optional().or(z.literal('')),
  sender_type: messageSenderTypeSchema,
  sender_id: z.string().uuid().optional().nullable(),
  ai_agent_id: z.string().optional().nullable(),
  channel_message_id: z.string().optional().nullable(),
  channel_timestamp: z.string().datetime().optional().nullable(),
  direction: messageDirectionSchema,
  status: messageStatusSchema.default('sent'),
  ai_context: z.record(z.unknown()).optional().nullable(),
  ai_prompt_version_id: z.string().uuid().optional().nullable(),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>

