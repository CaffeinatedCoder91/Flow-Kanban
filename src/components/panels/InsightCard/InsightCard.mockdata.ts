import { Insight } from '@/types'

export const baseInsight: Insight = {
  type: 'stale',
  severity: 'low',
  title: 'Stale tasks detected',
  description: '2 tasks have not been updated in over 7 days.',
  items: ['mock-1', 'mock-2'],
}
