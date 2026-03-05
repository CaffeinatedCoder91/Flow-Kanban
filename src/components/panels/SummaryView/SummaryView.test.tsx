import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryView } from './SummaryView'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_SUMMARY = {
  tasks_created: 5,
  tasks_completed: 3,
  tasks_stuck: 1,
  tasks_unblocked: 2,
  priority_changes: 1,
}

function makeResponse(overrides: {
  narrative?: string
  momentum?: { score: number; reasoning: string; sentiment: 'healthy' | 'at_risk' | 'critical' } | null
  summary?: typeof DEFAULT_SUMMARY
} = {}) {
  return {
    period: 'last_week',
    summary: DEFAULT_SUMMARY,
    narrative: 'A solid week — three tasks completed.',
    momentum: { score: 78, reasoning: 'Good completion rate.', sentiment: 'healthy' as const },
    ...overrides,
  }
}

// Returns the same payload for every fetch call
function mockFetch(payload: object) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response)
}

// Routes fetch mock based on the period in the request body
function mockFetchByPeriod(handlers: Record<string, object>) {
  return vi.spyOn(global, 'fetch').mockImplementation(async (_url, options) => {
    const body = JSON.parse((options as RequestInit).body as string)
    const payload = handlers[body.period] ?? makeResponse()
    return { ok: true, json: () => Promise.resolve(payload) } as Response
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SummaryView', () => {

  // ── Period tabs ─────────────────────────────────────────────────────────────

  describe('Period tabs', () => {
    it('renders all three period options', () => {
      vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
      render(<SummaryView />)
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('This month')).toBeInTheDocument()
    })

    it('"Last 7 days" is active by default', () => {
      vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
      render(<SummaryView />)
      expect(screen.getByText('Last 7 days')).toHaveClass('active')
      expect(screen.getByText('Last 30 days')).not.toHaveClass('active')
    })

    it('clicking a tab makes it active', async () => {
      mockFetch(makeResponse())
      render(<SummaryView />)
      await waitFor(() => screen.getByText(/A solid week/))
      fireEvent.click(screen.getByText('Last 30 days'))
      expect(screen.getByText('Last 30 days')).toHaveClass('active')
      expect(screen.getByText('Last 7 days')).not.toHaveClass('active')
    })

    it('clicking a tab triggers a new fetch', async () => {
      const spy = mockFetch(makeResponse())
      render(<SummaryView />)
      await waitFor(() => screen.getByText(/A solid week/))
      const callsBefore = spy.mock.calls.length
      fireEvent.click(screen.getByText('Last 30 days'))
      await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(callsBefore))
    })
  })

  // ── Loading state ───────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows spinner while loading', () => {
      vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
      render(<SummaryView />)
      expect(screen.getByText('Generating summary…')).toBeInTheDocument()
    })

    it('hides the content card while loading', () => {
      vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
      const { container } = render(<SummaryView />)
      expect(container.querySelector('.summary-content')).not.toBeInTheDocument()
    })
  })

  // ── Error state ─────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message on network failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'))
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText(/Failed to load summary/)).toBeInTheDocument()
      )
    })

    it('shows error message on HTTP error response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false, status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      } as Response)
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText(/Failed to load summary/)).toBeInTheDocument()
      , { timeout: 5000 })
    })
  })

  // ── Narrative ───────────────────────────────────────────────────────────────

  describe('Narrative', () => {
    it('renders the narrative text', async () => {
      mockFetch(makeResponse({ narrative: 'Three tasks shipped this week.' }))
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('Three tasks shipped this week.')).toBeInTheDocument()
      )
    })

    it('shows empty-state message when narrative is blank', async () => {
      mockFetch(makeResponse({ narrative: '' }))
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('No activity recorded in this period.')).toBeInTheDocument()
      )
    })
  })

  // ── Stats ───────────────────────────────────────────────────────────────────

  describe('Stats', () => {
    it('renders created, completed, stuck and unblocked counts', async () => {
      mockFetch(makeResponse({
        summary: { tasks_created: 7, tasks_completed: 4, tasks_stuck: 2, tasks_unblocked: 1, priority_changes: 0 },
      }))
      render(<SummaryView />)
      await waitFor(() => screen.getByText('created'))
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  // ── Momentum ────────────────────────────────────────────────────────────────

  describe('Momentum', () => {
    it('renders the score number', async () => {
      mockFetch(makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }))
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('78')).toBeInTheDocument())
    })

    it('renders "Healthy" for healthy sentiment', async () => {
      mockFetch(makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }))
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('Healthy')).toBeInTheDocument())
    })

    it('renders "At Risk" for at_risk sentiment', async () => {
      mockFetch(makeResponse({ momentum: { score: 55, reasoning: 'Slowing.', sentiment: 'at_risk' } }))
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('At Risk')).toBeInTheDocument())
    })

    it('renders "Critical" for critical sentiment', async () => {
      mockFetch(makeResponse({ momentum: { score: 22, reasoning: 'Blocked.', sentiment: 'critical' } }))
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('Critical')).toBeInTheDocument())
    })

    it('renders the reasoning text', async () => {
      mockFetch(makeResponse({ momentum: { score: 78, reasoning: 'Strong completion rate.', sentiment: 'healthy' } }))
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('Strong completion rate.')).toBeInTheDocument()
      )
    })

    it('shows "Score unavailable" when momentum is null', async () => {
      mockFetch(makeResponse({ momentum: null }))
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('Score unavailable')).toBeInTheDocument()
      )
    })
  })

  // ── Trend indicator ─────────────────────────────────────────────────────────

  describe('Trend indicator', () => {
    it('shows ↗ when score improved by more than 3', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 60, reasoning: 'OK.', sentiment: 'at_risk' } }),
        last_week:        makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
      })
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('↗')).toBeInTheDocument())
    })

    it('shows ↘ when score declined by more than 3', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
        last_week:        makeResponse({ momentum: { score: 60, reasoning: 'Slower.', sentiment: 'at_risk' } }),
      })
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('↘')).toBeInTheDocument())
    })

    it('shows → when score is stable (within 3 points)', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 76, reasoning: 'OK.', sentiment: 'healthy' } }),
        last_week:        makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
      })
      render(<SummaryView />)
      await waitFor(() => expect(screen.getByText('→')).toBeInTheDocument())
    })

    it('shows "+N from last week" label when improving', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 60, reasoning: 'OK.', sentiment: 'at_risk' } }),
        last_week:        makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
      })
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('+18 from last week')).toBeInTheDocument()
      )
    })

    it('shows "-N from last week" label when declining', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
        last_week:        makeResponse({ momentum: { score: 60, reasoning: 'Slower.', sentiment: 'at_risk' } }),
      })
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('-18 from last week')).toBeInTheDocument()
      )
    })

    it('shows "same as last week" when delta is 0', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
        last_week:        makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
      })
      render(<SummaryView />)
      await waitFor(() =>
        expect(screen.getByText('same as last week')).toBeInTheDocument()
      )
    })

    it('shows no trend when previous period had no momentum', async () => {
      mockFetchByPeriod({
        previous_7_days: makeResponse({ momentum: null }),
        last_week:        makeResponse({ momentum: { score: 78, reasoning: 'Good.', sentiment: 'healthy' } }),
      })
      render(<SummaryView />)
      await waitFor(() => screen.getByText('78'))
      expect(screen.queryByText('↗')).not.toBeInTheDocument()
      expect(screen.queryByText('↘')).not.toBeInTheDocument()
      expect(screen.queryByText(/from last week/)).not.toBeInTheDocument()
    })
  })

  // ── Fetch behaviour ─────────────────────────────────────────────────────────

  describe('Fetch behaviour', () => {
    it('last_week fetches both current and previous_7_days periods', async () => {
      const spy = mockFetch(makeResponse())
      render(<SummaryView />)
      await waitFor(() => screen.getByText(/A solid week/))
      const periods = spy.mock.calls.map(
        ([, opts]) => JSON.parse((opts as RequestInit).body as string).period
      )
      expect(periods).toContain('last_week')
      expect(periods).toContain('previous_7_days')
    })
  })
})
