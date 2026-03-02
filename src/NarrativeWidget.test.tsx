import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NarrativeWidget from './NarrativeWidget'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockOkResponse(payload: object) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response)
}

const HEALTHY_RESPONSE = {
  momentum: { score: 82, sentiment: 'healthy' },
  narrative: 'Great progress this week — things are moving.',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NarrativeWidget', () => {

  // ── Initial / empty states ─────────────────────────────────────────────────

  it('renders a skeleton while the fetch is in flight', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    expect(container.querySelector('.narrative-widget-skeleton')).toBeInTheDocument()
  })

  it('renders nothing on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'))
    const { container } = render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await act(async () => {})
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing on HTTP error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    } as Response)
    const { container } = render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await act(async () => {})
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when momentum is absent from the response', async () => {
    mockOkResponse({ narrative: 'Good week.' }) // no momentum field
    const { container } = render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await act(async () => {})
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when narrative is absent from the response', async () => {
    mockOkResponse({ momentum: { score: 75, sentiment: 'healthy' } }) // no narrative field
    const { container } = render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await act(async () => {})
    expect(container.firstChild).toBeNull()
  })

  // ── Content rendering ──────────────────────────────────────────────────────

  it('renders the momentum score', async () => {
    mockOkResponse(HEALTHY_RESPONSE)
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('82')).toBeInTheDocument())
  })

  it('renders the narrative text', async () => {
    mockOkResponse(HEALTHY_RESPONSE)
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByText('Great progress this week — things are moving.')).toBeInTheDocument()
    )
  })

  it('renders "Healthy" label for healthy sentiment', async () => {
    mockOkResponse({ momentum: { score: 82, sentiment: 'healthy' }, narrative: 'Good.' })
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Healthy')).toBeInTheDocument())
  })

  it('renders "At Risk" label for at_risk sentiment', async () => {
    mockOkResponse({ momentum: { score: 55, sentiment: 'at_risk' }, narrative: 'Slowing down.' })
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('At Risk')).toBeInTheDocument())
  })

  it('renders "Critical" label for critical sentiment', async () => {
    mockOkResponse({ momentum: { score: 22, sentiment: 'critical' }, narrative: 'Things are stuck.' })
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Critical')).toBeInTheDocument())
  })

  it('renders the "View full report" button', async () => {
    mockOkResponse(HEALTHY_RESPONSE)
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/View full report/)).toBeInTheDocument())
  })

  // ── Interaction ────────────────────────────────────────────────────────────

  it('calls onViewFullReport when the button is clicked', async () => {
    mockOkResponse(HEALTHY_RESPONSE)
    const onViewFullReport = vi.fn()
    render(<NarrativeWidget onViewFullReport={onViewFullReport} />)
    await waitFor(() => screen.getByText(/View full report/))
    fireEvent.click(screen.getByText(/View full report/))
    expect(onViewFullReport).toHaveBeenCalledTimes(1)
  })

  // ── API contract ───────────────────────────────────────────────────────────

  it('POSTs to /api/narrative with period last_week', async () => {
    const fetchSpy = mockOkResponse(HEALTHY_RESPONSE)
    render(<NarrativeWidget onViewFullReport={vi.fn()} />)
    await waitFor(() => screen.getByText('82'))
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/narrative',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ period: 'last_week' }),
      })
    )
  })
})
