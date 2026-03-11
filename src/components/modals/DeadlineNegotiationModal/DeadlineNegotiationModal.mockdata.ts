import { Item } from '@/types'

function localAddDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export const TOMORROW = localAddDays(1)

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'mock-42',
    title: 'Fix the login bug',
    description: null,
    status: 'not_started',
    priority: 'high',
    color: null,
    assignee: null,
    due_date: TOMORROW,
    position: 0,
    created_at: '2026-01-01 00:00:00',
    last_modified: '2026-01-01 00:00:00',
    history: [],
    ...overrides,
  }
}
