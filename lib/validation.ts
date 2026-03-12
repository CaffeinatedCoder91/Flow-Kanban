import { z } from 'zod'

// ─── Item Schemas ──────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').trim(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'done', 'stuck']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
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

// ─── Chat tool schemas ────────────────────────────────────────────────────────
// Validate tool inputs before writing to the DB.

export const ToolCreateItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').trim(),
  status: z.enum(['not_started', 'in_progress', 'done', 'stuck']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  assignee: z.string().max(255, 'Assignee too long').optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD').optional().nullable(),
})

export const ToolUpdateItemSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  title: z.string().min(1).max(500).optional(),
  status: z.enum(['not_started', 'in_progress', 'done', 'stuck']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().max(5000).optional().nullable(),
  assignee: z.string().max(255).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export const ToolDeleteItemSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
})

export const ToolMoveItemSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  new_status: z.enum(['not_started', 'in_progress', 'done', 'stuck']),
})

// ─── Chat Schema ───────────────────────────────────────────────────────────────
// api/chat.ts body: { message, items }

export const ChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
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

// ─── AI Response Schemas ────────────────────────────────────────────────────────
// Validate JSON parsed from Claude responses to prevent runtime crashes.

export const SplitSuggestionSchema = z.array(z.object({
  title: z.string(),
  description: z.string().default(''),
  estimated_priority: z.string().default('medium'),
}))

export const RescheduleSuggestionSchema = z.array(z.object({
  date: z.string(),
  label: z.string(),
}))

export const RecommendNextSchema = z.object({
  itemId: z.string(),
  reason: z.string(),
})

export const DuplicateGroupsSchema = z.object({
  groups: z.array(z.array(z.string())).default([]),
})

export const ExtractedTaskSchema = z.array(z.object({
  title: z.string(),
  description: z.string().nullable().default(null),
  priority: z.string().default('medium'),
  due_date: z.string().nullable().default(null),
  assignee: z.string().nullable().default(null),
  status: z.string().default('not_started'),
  status_reasoning: z.string().nullable().default(null),
  color: z.unknown().default(null),
  confidence: z.record(z.string(), z.number()).default({}),
}))

// ─── Suggest Schema ────────────────────────────────────────────────────────────
// api/suggest.ts body: { type, itemId }

export const SuggestSchema = z.object({
  type: z.enum(['reschedule', 'split']),
  itemId: z.string().uuid('itemId must be a valid UUID'),
})

// ─── Deadline Action Schema ─────────────────────────────────────────────────────
// api/deadline-actions.ts body: { item_id, action_type, original_due_date, new_due_date }

export const DeadlineActionSchema = z.object({
  action_type: z.enum(['reschedule', 'deprioritize', 'split']),
  item_id: z.string().uuid().optional().nullable(),
  original_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  new_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

// ─── Inferred Types ────────────────────────────────────────────────────────────

export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>
export type ChatInput = z.infer<typeof ChatSchema>
export type ExtractTasksInput = z.infer<typeof ExtractTasksSchema>
export type NarrativeInput = z.infer<typeof NarrativeSchema>
