import { z } from 'zod'

// ─── Item Schemas ──────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').trim(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'done', 'stuck']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  color: z.string().max(50).optional().nullable(),
  assignee: z.string().max(255).optional().nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  position: z.number().int().optional(),
})

export const CreateItemSchema = ItemSchema.required({ title: true })

export const UpdateItemSchema = ItemSchema.partial()

// ─── Chat Schema ───────────────────────────────────────────────────────────────
// api/chat.ts body: { message, items }

export const ChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  items: z.array(z.record(z.unknown())).optional(),
})

// ─── Extract Tasks Schema ──────────────────────────────────────────────────────

export const ExtractTasksSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters').max(10000, 'Text too long'),
})

// ─── Narrative Schema ──────────────────────────────────────────────────────────
// api/narrative.ts body: { period }

export const NarrativeSchema = z.object({
  period: z.enum(['last_week', 'last_30_days', 'this_month', 'previous_7_days']),
})

// ─── Inferred Types ────────────────────────────────────────────────────────────

export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>
export type ChatInput = z.infer<typeof ChatSchema>
export type ExtractTasksInput = z.infer<typeof ExtractTasksSchema>
export type NarrativeInput = z.infer<typeof NarrativeSchema>
