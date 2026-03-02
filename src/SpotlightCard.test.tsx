import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SpotlightCard from './SpotlightCard'
import type { Item } from './types'

const recommendation = { recommendedItemId: 5, reason: 'Most urgent task due tomorrow.' }

const item: Item = {
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

describe('SpotlightCard', () => {
  it('renders the recommended task title', () => {
    render(<SpotlightCard recommendation={recommendation} item={item} onDismiss={vi.fn()} onStartWorking={vi.fn()} />)
    expect(screen.getByText('Fix critical bug')).toBeInTheDocument()
  })

  it('renders the reason text', () => {
    render(<SpotlightCard recommendation={recommendation} item={item} onDismiss={vi.fn()} onStartWorking={vi.fn()} />)
    expect(screen.getByText('Most urgent task due tomorrow.')).toBeInTheDocument()
  })

  it('falls back to Task #id when item is undefined', () => {
    render(<SpotlightCard recommendation={recommendation} item={undefined} onDismiss={vi.fn()} onStartWorking={vi.fn()} />)
    expect(screen.getByText('Task #5')).toBeInTheDocument()
  })

  it('renders "Recommended next task" label', () => {
    render(<SpotlightCard recommendation={recommendation} item={item} onDismiss={vi.fn()} onStartWorking={vi.fn()} />)
    expect(screen.getByText('Recommended next task')).toBeInTheDocument()
  })

  it('calls onDismiss when × button is clicked', () => {
    const onDismiss = vi.fn()
    render(<SpotlightCard recommendation={recommendation} item={item} onDismiss={onDismiss} onStartWorking={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onStartWorking with the item id when "Start working" is clicked', () => {
    const onStartWorking = vi.fn()
    render(<SpotlightCard recommendation={recommendation} item={item} onDismiss={vi.fn()} onStartWorking={onStartWorking} />)
    fireEvent.click(screen.getByText('Start working'))
    expect(onStartWorking).toHaveBeenCalledWith(5)
  })
})
