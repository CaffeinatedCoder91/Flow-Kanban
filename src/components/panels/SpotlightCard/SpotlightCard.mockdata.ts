import type { Item } from '../../../types'
import type { Recommendation } from './SpotlightCard.types'

export const recommendation: Recommendation = {
  recommendedItemId: 5,
  reason: 'Most urgent task due tomorrow.',
}

export const item: Item = {
  id: 5,
  title: 'Fix critical bug',
  description: null,
  status: 'not_started',
  priority: 'critical',
  color: null,
  assignee: null,
  due_date: null,
  position: 0,
  created_at: '2026-01-01 00:00:00',
  last_modified: '2026-01-01 00:00:00',
  history: [],
}
