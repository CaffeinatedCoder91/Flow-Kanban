export interface HistoryEntry {
  id: number
  item_id: number
  changed_at: string
  description: string
}

export interface Item {
  id: number
  title: string
  description: string | null
  status: string
  priority: string
  color: string | null
  assignee: string | null
  due_date: string | null
  position: number
  created_at: string
  last_modified: string
  history: HistoryEntry[]
}

export const STATUS_CONFIG = [
  { key: 'not_started', label: 'Not Started', color: '#8B5CF6' },
  { key: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { key: 'done',        label: 'Done',        color: '#10B981' },
  { key: 'stuck',       label: 'Stuck',       color: '#F59E0B' },
] as const

export interface Insight {
  type: 'stale' | 'bottleneck' | 'duplicate' | 'priority_inflation' | 'deadline_cluster' | 'deadline_risk'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  items: number[]
}

export interface FieldConfidence {
  title: number
  priority: number
  due_date: number
  assignee: number
  description: number
}

export interface ProposedTask {
  title: string
  status: string
  status_reasoning: string | null
  priority: string
  description: string | null
  due_date: string | null
  assignee: string | null
  color: string | null
  confidence: FieldConfidence | null
}

export const PRIORITY_CONFIG = [
  { key: 'low',      label: 'Low' },
  { key: 'medium',   label: 'Medium' },
  { key: 'high',     label: 'High' },
  { key: 'critical', label: 'Critical' },
] as const
