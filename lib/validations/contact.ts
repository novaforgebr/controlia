/**
 * Validações para o módulo de Contatos
 * Usando Zod para type-safety e validação
 */

import { z } from 'zod'

export const contactStatusSchema = z.enum(['lead', 'prospect', 'client', 'inactive'])

export const createContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  document: z.string().optional().or(z.literal('')),
  status: contactStatusSchema.default('lead'),
  source: z.string().max(100).optional().or(z.literal('')),
  score: z.number().int().min(0).max(100).default(0),
  custom_fields: z.record(z.unknown()).optional().default({}),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  ai_enabled: z.boolean().default(true),
  pipeline_id: z
    .union([
      z.string().uuid(),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional()
    .nullable(),
  pipeline_stage_id: z
    .union([
      z.string().uuid(),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional()
    .nullable(),
})

export const updateContactSchema = createContactSchema.partial()

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

