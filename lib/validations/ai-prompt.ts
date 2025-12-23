/**
 * Validações para o módulo de Prompts de IA
 */

import { z } from 'zod'

export const createAIPromptSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional().nullable(),
  version: z.number().int().positive().default(1),
  parent_id: z.string().uuid().optional().nullable(),
  prompt_text: z.string().min(1, 'Texto do prompt é obrigatório'),
  system_prompt: z.string().optional().nullable(),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().default(1000),
  context_type: z.string().max(50).optional().nullable(),
  channel: z.string().max(50).optional().nullable(),
  allowed_actions: z.array(z.string()).default([]),
  forbidden_actions: z.array(z.string()).default([]),
  constraints: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
})

export const updateAIPromptSchema = createAIPromptSchema.partial().omit({ version: true })

export type CreateAIPromptInput = z.infer<typeof createAIPromptSchema>
export type UpdateAIPromptInput = z.infer<typeof updateAIPromptSchema>

