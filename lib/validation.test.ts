import { describe, it, expect } from 'vitest'
import {
  CreateItemSchema,
  UpdateItemSchema,
  SuggestSchema,
  DeadlineActionSchema,
  ChatSchema,
  NarrativeSchema,
} from './validation.js'

describe('CreateItemSchema', () => {
  it('accepts a minimal valid item', () => {
    expect(CreateItemSchema.safeParse({ title: 'Fix bug' }).success).toBe(true)
  })

  it('rejects missing title', () => {
    expect(CreateItemSchema.safeParse({}).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(CreateItemSchema.safeParse({ title: '' }).success).toBe(false)
  })

  it('rejects title over 500 chars', () => {
    expect(CreateItemSchema.safeParse({ title: 'x'.repeat(501) }).success).toBe(false)
  })

  it('accepts valid status values', () => {
    for (const status of ['not_started', 'in_progress', 'done', 'stuck']) {
      expect(CreateItemSchema.safeParse({ title: 'T', status }).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(CreateItemSchema.safeParse({ title: 'T', status: 'potato' }).success).toBe(false)
  })

  it('accepts valid priority values', () => {
    for (const priority of ['low', 'medium', 'high', 'critical']) {
      expect(CreateItemSchema.safeParse({ title: 'T', priority }).success).toBe(true)
    }
  })

  it('rejects invalid priority', () => {
    expect(CreateItemSchema.safeParse({ title: 'T', priority: 'urgent' }).success).toBe(false)
  })

  it('accepts a valid YYYY-MM-DD due_date', () => {
    expect(CreateItemSchema.safeParse({ title: 'T', due_date: '2026-06-15' }).success).toBe(true)
  })

  it('rejects a malformed due_date', () => {
    expect(CreateItemSchema.safeParse({ title: 'T', due_date: '15/06/2026' }).success).toBe(false)
  })
})

describe('UpdateItemSchema', () => {
  it('accepts an empty patch', () => {
    expect(UpdateItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial update', () => {
    expect(UpdateItemSchema.safeParse({ status: 'done', priority: 'low' }).success).toBe(true)
  })
})

describe('SuggestSchema', () => {
  it('accepts split with valid UUID', () => {
    expect(SuggestSchema.safeParse({ type: 'split', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }).success).toBe(true)
  })

  it('accepts reschedule with valid UUID', () => {
    expect(SuggestSchema.safeParse({ type: 'reschedule', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }).success).toBe(true)
  })

  it('rejects unknown type', () => {
    expect(SuggestSchema.safeParse({ type: 'delete', itemId: '00000000-0000-0000-0000-000000000001' }).success).toBe(false)
  })

  it('rejects a non-UUID itemId', () => {
    expect(SuggestSchema.safeParse({ type: 'split', itemId: 'not-a-uuid' }).success).toBe(false)
  })

  it('rejects missing itemId', () => {
    expect(SuggestSchema.safeParse({ type: 'split' }).success).toBe(false)
  })
})

describe('DeadlineActionSchema', () => {
  it('accepts a valid reschedule action', () => {
    expect(DeadlineActionSchema.safeParse({
      action_type: 'reschedule',
      item_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      original_due_date: '2026-03-01',
      new_due_date: '2026-03-15',
    }).success).toBe(true)
  })

  it('accepts action without optional fields', () => {
    expect(DeadlineActionSchema.safeParse({ action_type: 'deprioritize' }).success).toBe(true)
  })

  it('rejects invalid action_type', () => {
    expect(DeadlineActionSchema.safeParse({ action_type: 'ignore' }).success).toBe(false)
  })

  it('rejects malformed date', () => {
    expect(DeadlineActionSchema.safeParse({
      action_type: 'reschedule',
      original_due_date: 'March 1st',
    }).success).toBe(false)
  })
})

describe('ChatSchema', () => {
  it('accepts a valid message', () => {
    expect(ChatSchema.safeParse({ message: 'What should I do next?' }).success).toBe(true)
  })

  it('rejects empty message', () => {
    expect(ChatSchema.safeParse({ message: '' }).success).toBe(false)
  })
})

describe('NarrativeSchema', () => {
  it('accepts valid periods', () => {
    for (const period of ['last_week', 'last_30_days', 'this_month', 'previous_7_days']) {
      expect(NarrativeSchema.safeParse({ period }).success).toBe(true)
    }
  })

  it('rejects invalid period', () => {
    expect(NarrativeSchema.safeParse({ period: 'yesterday' }).success).toBe(false)
  })
})
