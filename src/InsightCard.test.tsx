import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import InsightCard from './InsightCard'
import type { Insight } from './types'

const baseInsight: Insight = {
  type: 'stale',
  severity: 'low',
  title: 'Stale tasks detected',
  description: '2 tasks have not been updated in over 7 days.',
  items: [1, 2],
}

describe('InsightCard', () => {
  it('renders title and description', () => {
    render(<InsightCard insight={baseInsight} onDismiss={vi.fn()} onAction={vi.fn()} />)
    expect(screen.getByText('Stale tasks detected')).toBeInTheDocument()
    expect(screen.getByText('2 tasks have not been updated in over 7 days.')).toBeInTheDocument()
  })

  it('renders correct icon for each type', () => {
    const types: Array<{ type: Insight['type']; icon: string }> = [
      { type: 'stale', icon: '⚠️' },
      { type: 'bottleneck', icon: '🚧' },
      { type: 'duplicate', icon: '🔄' },
      { type: 'priority_inflation', icon: '⚡' },
      { type: 'deadline_cluster', icon: '📅' },
      { type: 'deadline_risk', icon: '⏰' },
    ]
    for (const { type, icon } of types) {
      const { unmount } = render(
        <InsightCard insight={{ ...baseInsight, type }} onDismiss={vi.fn()} onAction={vi.fn()} />
      )
      expect(screen.getByText(icon)).toBeInTheDocument()
      unmount()
    }
  })

  it('shows "Ask AI" action for duplicate type', () => {
    render(
      <InsightCard insight={{ ...baseInsight, type: 'duplicate' }} onDismiss={vi.fn()} onAction={vi.fn()} />
    )
    expect(screen.getByText('Ask AI')).toBeInTheDocument()
  })

  it('shows "Resolve" action for deadline_risk type', () => {
    render(
      <InsightCard insight={{ ...baseInsight, type: 'deadline_risk' }} onDismiss={vi.fn()} onAction={vi.fn()} />
    )
    expect(screen.getByText('Resolve')).toBeInTheDocument()
  })

  it('shows "View tasks" action for non-duplicate, non-deadline_risk types', () => {
    for (const type of ['stale', 'bottleneck', 'priority_inflation', 'deadline_cluster'] as const) {
      const { unmount } = render(
        <InsightCard insight={{ ...baseInsight, type }} onDismiss={vi.fn()} onAction={vi.fn()} />
      )
      expect(screen.getByText('View tasks')).toBeInTheDocument()
      unmount()
    }
  })

  it('applies severity class to card', () => {
    const { container } = render(
      <InsightCard insight={{ ...baseInsight, severity: 'high' }} onDismiss={vi.fn()} onAction={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('insight-severity-high')
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<InsightCard insight={baseInsight} onDismiss={onDismiss} onAction={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Dismiss insight'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onAction with the insight when action button is clicked', () => {
    const onAction = vi.fn()
    render(<InsightCard insight={baseInsight} onDismiss={vi.fn()} onAction={onAction} />)
    fireEvent.click(screen.getByText('View tasks'))
    expect(onAction).toHaveBeenCalledWith(baseInsight)
  })
})
