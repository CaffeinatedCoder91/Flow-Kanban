import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DeadlineNegotiationModal from './DeadlineNegotiationModal'
import type { Item } from '../../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localAddDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const TODAY     = localAddDays(0)
const TOMORROW  = localAddDays(1)
const YESTERDAY = localAddDays(-1)
const IN_3_DAYS = localAddDays(3)

function makeItem(overrides: Partial<Item> = {}): Item {
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

function mockOkFetch(payload: object = {}) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response)
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ suggestions: [] }),
  } as Response)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeadlineNegotiationModal', () => {

  // ── Home screen ─────────────────────────────────────────────────────────────

  it('shows the task title', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText('Fix the login bug')).toBeInTheDocument()
  })

  it('shows "due tomorrow" prompt for a task due tomorrow', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText(/due tomorrow/)).toBeInTheDocument()
  })

  it('shows "due today" prompt for a task due today', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: TODAY })} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText(/due today/)).toBeInTheDocument()
  })

  it('shows "overdue" in the prompt for a past-due task', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: YESTERDAY })} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText(/overdue/)).toBeInTheDocument()
  })

  it('shows "due in N days" for a task due in 3 days', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: IN_3_DAYS })} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText(/due in 3 days/)).toBeInTheDocument()
  })

  it('shows the status chip with a friendly label', () => {
    render(<DeadlineNegotiationModal item={makeItem({ status: 'in_progress' })} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('shows all three action buttons on the home screen', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    expect(screen.getByText('Reschedule')).toBeInTheDocument()
    expect(screen.getByText('Split Task')).toBeInTheDocument()
    expect(screen.getByText('Deprioritize')).toBeInTheDocument()
  })

  it('calls onClose when the × button is clicked', () => {
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={onClose} onDone={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Reschedule screen ────────────────────────────────────────────────────────

  it('shows a date input after clicking Reschedule', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument()
    expect(screen.getByText('Save new date')).toBeInTheDocument()
  })

  it('Back button from Reschedule returns to the home screen', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('Reschedule')).toBeInTheDocument()
    expect(screen.getByText('Split Task')).toBeInTheDocument()
    expect(screen.getByText('Deprioritize')).toBeInTheDocument()
  })

  it('"Save new date" is disabled when no date is selected', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: null })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    expect(screen.getByText('Save new date')).toBeDisabled()
  })

  it('PATCHes the item with the new due_date on save', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    const onDone = vi.fn()
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={onClose} onDone={onDone} />)

    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-15' } })
    fireEvent.click(screen.getByText('Save new date'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items/42',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ due_date: '2026-03-15' }) })
      )
    )
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.stringContaining('rescheduled')))
    await waitFor(() => expect(screen.getByText('Date updated')).toBeInTheDocument())
  })

  // ── Reschedule screen – AI suggestions ──────────────────────────────────────

  it('shows loading spinner while suggestions are being fetched', () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    expect(screen.getByText('Finding good dates…')).toBeInTheDocument()
  })

  it('shows suggestion buttons once the fetch resolves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { date: '2026-03-02', label: 'Monday (5 days out)' },
          { date: '2026-03-05', label: 'Thursday (8 days out)' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    await waitFor(() => expect(screen.getByText('Monday (5 days out)')).toBeInTheDocument())
    expect(screen.getByText('Thursday (8 days out)')).toBeInTheDocument()
  })

  it('clicking a suggestion pre-fills the date input and enables Save', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [{ date: '2026-03-02', label: 'Monday (5 days out)' }],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem({ due_date: null })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    await waitFor(() => screen.getByText('Monday (5 days out)'))
    fireEvent.click(screen.getByText('Monday (5 days out)'))
    expect(document.querySelector('input[type="date"]')).toHaveValue('2026-03-02')
    expect(screen.getByText('Save new date')).not.toBeDisabled()
  })

  it('applies active class to the currently selected suggestion', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [{ date: '2026-03-02', label: 'Monday (5 days out)' }],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    await waitFor(() => screen.getByText('Monday (5 days out)'))
    fireEvent.click(screen.getByText('Monday (5 days out)'))
    expect(screen.getByText('Monday (5 days out)')).toHaveClass('active')
  })

  it('shows no suggestion buttons when suggestions array is empty', async () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    await waitFor(() => expect(screen.queryByText('Finding good dates…')).not.toBeInTheDocument())
    expect(document.querySelector('.dnm-suggestions')).not.toBeInTheDocument()
  })

  it('POSTs to /api/suggest-reschedule with the correct itemId', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem({ id: 'mock-42' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Reschedule'))
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/suggest-reschedule',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ itemId: 42 }) })
      )
    )
  })

  // ── Split Task screen ────────────────────────────────────────────────────────

  it('shows subtask inputs after clicking Split Task', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    expect(screen.getByPlaceholderText('Subtask 1…')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Subtask 2…')).toBeInTheDocument()
  })

  it('"+ Add another step" appends a new input', async () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => screen.getByText('+ Add another step'))
    fireEvent.click(screen.getByText('+ Add another step'))
    expect(screen.getByPlaceholderText('Subtask 3…')).toBeInTheDocument()
  })

  it('Back button from Split Task returns to the home screen', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('Reschedule')).toBeInTheDocument()
  })

  it('Create button is disabled when all subtask inputs are empty', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    expect(screen.getByText('Create subtasks')).toBeDisabled()
  })

  it('shows singular label when only one subtask is filled', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'Do the first thing' } })
    expect(screen.getByText('Create 1 subtask')).toBeInTheDocument()
  })

  it('POSTs a new item for each filled subtask and calls onDone', async () => {
    const fetchSpy = mockOkFetch({ id: 99, title: 'x', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '', last_modified: '', history: [] })
    const onDone = vi.fn()
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={onClose} onDone={onDone} />)

    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'Write unit tests' } })
    fireEvent.change(screen.getByPlaceholderText('Subtask 2…'), { target: { value: 'Write integration tests' } })
    await waitFor(() => expect(screen.getByText('Create 2 subtasks')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 2 subtasks'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Write unit tests', description: null, priority: 'medium' }),
        })
      )
    )
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Write integration tests', description: null, priority: 'medium' }),
        })
      )
    )
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('Task split')).toBeInTheDocument())
  })

  // ── Split Task screen – AI suggestions ──────────────────────────────────────

  it('shows loading state while split suggestions are being fetched', () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    expect(screen.getByText('Finding good subtasks…')).toBeInTheDocument()
  })

  it('pre-fills inputs with AI-suggested subtask titles once fetch resolves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Write failing tests', description: 'TDD first', estimated_priority: 'high' },
          { title: 'Implement handler', description: 'Code the logic', estimated_priority: 'medium' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => expect(screen.getByDisplayValue('Write failing tests')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Implement handler')).toBeInTheDocument()
  })

  it('shows description hint below each AI suggestion', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Write tests', description: 'TDD approach', estimated_priority: 'high' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => expect(screen.getByText('TDD approach')).toBeInTheDocument())
  })

  it('priority badge shows the estimated priority', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Write tests', description: '', estimated_priority: 'critical' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => expect(screen.getByText('critical')).toBeInTheDocument())
  })

  it('remove button removes a subtask row', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Row A', description: '', estimated_priority: 'medium' },
          { title: 'Row B', description: '', estimated_priority: 'medium' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => screen.getByDisplayValue('Row A'))
    fireEvent.click(screen.getByLabelText('Remove subtask 1'))
    expect(screen.queryByDisplayValue('Row A')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Row B')).toBeInTheDocument()
  })

  it('remove button is disabled when only one row remains', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Only row', description: '', estimated_priority: 'medium' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => screen.getByDisplayValue('Only row'))
    expect(screen.getByLabelText('Remove subtask 1')).toBeDisabled()
  })

  it('POSTs to /api/suggest-split with the correct itemId', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem({ id: 'mock-42' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/suggest-split',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ itemId: 42 }) })
      )
    )
  })

  it('creates subtasks with description and priority from AI suggestions', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: [
          { title: 'Write tests', description: 'TDD first', estimated_priority: 'high' },
        ],
      }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Write tests', description: 'TDD first', priority: 'high' }),
        })
      )
    )
  })

  it('deletes original task when "Also delete original task" is checked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem({ id: 'mock-42' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    await waitFor(() => screen.getByLabelText(/Also delete original task/i))
    fireEvent.click(screen.getByLabelText(/Also delete original task/i))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'New task' } })
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith('/api/items/42', expect.objectContaining({ method: 'DELETE' }))
    )
  })

  it('does not delete original task when checkbox is unchecked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    } as Response)
    render(<DeadlineNegotiationModal item={makeItem({ id: 'mock-42' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'New task' } })
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/items', expect.anything()))
    expect(fetchSpy).not.toHaveBeenCalledWith('/api/items/42', expect.anything())
  })

  // ── Deprioritize screen ──────────────────────────────────────────────────────

  it('shows priority step-down and due date options after clicking Deprioritize', () => {
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.getByText('Lower the pressure on this task.')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Apply changes')).toBeInTheDocument()
    expect(screen.getByText('Remove due date entirely')).toBeInTheDocument()
  })

  it('Back button from Deprioritize returns to the home screen', () => {
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('Reschedule')).toBeInTheDocument()
  })

  it('PATCHes with stepped-down priority and removed due date by default', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    const onDone = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high', due_date: TOMORROW })} onClose={vi.fn()} onDone={onDone} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('Apply changes'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items/42',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ priority: 'medium', due_date: null }),
        })
      )
    )
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('"← Back" from Deprioritize makes no network request', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('← Back'))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('Reschedule')).toBeInTheDocument()
  })

  // ── Deprioritize screen – smart options ──────────────────────────────────────

  it('PATCHes with extended due date when "Extend by 7 days" is selected', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high', due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByRole('radio', { name: /Extend by 7 days/i }))
    fireEvent.click(screen.getByText('Apply changes'))

    const expectedDate = localAddDays(7)
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items/42',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining(`"due_date":"${expectedDate}"`),
        })
      )
    )
  })

  it('hides due date options when item has no due date', () => {
    render(<DeadlineNegotiationModal item={makeItem({ due_date: null })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.queryByText('Remove due date entirely')).not.toBeInTheDocument()
  })

  it('shows status reset checkbox when item is stuck (checked by default)', () => {
    render(<DeadlineNegotiationModal item={makeItem({ status: 'stuck' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    const checkbox = screen.getByRole('checkbox', { name: /Reset status to Not Started/i })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
  })

  it('does not show status reset checkbox for non-stuck items', () => {
    render(<DeadlineNegotiationModal item={makeItem({ status: 'in_progress' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.queryByRole('checkbox', { name: /Reset status/i })).not.toBeInTheDocument()
  })

  it('includes status: not_started in PATCH when stuck item reset is checked', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem({ status: 'stuck', priority: 'high', due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.getByRole('checkbox', { name: /Reset status to Not Started/i })).toBeChecked()
    fireEvent.click(screen.getByText('Apply changes'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/items/42',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"status":"not_started"'),
        })
      )
    )
  })

  it('shows confirmation summary after applying changes', async () => {
    mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high', due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('Apply changes'))

    await waitFor(() => expect(screen.getByText('Changes applied')).toBeInTheDocument())
    expect(screen.getByText(/Priority lowered from High to Medium/)).toBeInTheDocument()
    expect(screen.getByText(/Due date removed/)).toBeInTheDocument()
  })

  it('"Done" button closes the modal after confirmation', async () => {
    mockOkFetch({ id: 42 })
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high' })} onClose={onClose} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('Apply changes'))

    await waitFor(() => screen.getByText('Done'))
    fireEvent.click(screen.getByText('Done'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('steps Critical → High and High → Medium correctly', () => {
    const { unmount } = render(<DeadlineNegotiationModal item={makeItem({ priority: 'critical' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    unmount()

    render(<DeadlineNegotiationModal item={makeItem({ priority: 'low' })} onClose={vi.fn()} onDone={vi.fn()} />)
    fireEvent.click(screen.getByText('Deprioritize'))
    expect(screen.getAllByText('Low').length).toBeGreaterThanOrEqual(2)
  })

  // ── Action recording ─────────────────────────────────────────────────────────

  it('POSTs to /api/deadline-actions after a successful reschedule', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem({ due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-03-15' } })
    fireEvent.click(screen.getByText('Save new date'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/deadline-actions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            item_id: 42,
            action_type: 'reschedule',
            original_due_date: TOMORROW,
            new_due_date: '2026-03-15',
          }),
        })
      )
    )
  })

  it('POSTs to /api/deadline-actions after a successful deprioritize', async () => {
    const fetchSpy = mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem({ priority: 'high', due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Deprioritize'))
    fireEvent.click(screen.getByText('Apply changes'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/deadline-actions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action_type":"deprioritize"'),
        })
      )
    )
  })

  it('POSTs to /api/deadline-actions after subtasks are created via Split Task', async () => {
    const fetchSpy = mockOkFetch({ id: 99, title: 'x', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '', last_modified: '', history: [] })
    render(<DeadlineNegotiationModal item={makeItem({ due_date: TOMORROW })} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'Part one' } })
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/deadline-actions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action_type":"split"'),
        })
      )
    )
  })

  // ── Success screens ───────────────────────────────────────────────────────────

  it('shows "Date updated" success screen after reschedule', async () => {
    mockOkFetch({ id: 42 })
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-04-01' } })
    fireEvent.click(screen.getByText('Save new date'))

    await waitFor(() => expect(screen.getByText('Date updated')).toBeInTheDocument())
    expect(screen.getByText(/Due date set to/)).toBeInTheDocument()
  })

  it('"Done" button on reschedule success screen calls onClose', async () => {
    mockOkFetch({ id: 42 })
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={onClose} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-04-01' } })
    fireEvent.click(screen.getByText('Save new date'))

    await waitFor(() => screen.getByText('Done'))
    fireEvent.click(screen.getByText('Done'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows "Task split" success screen after split', async () => {
    mockOkFetch({ id: 99, title: 'x', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '', last_modified: '', history: [] })
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'Part one' } })
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))

    await waitFor(() => expect(screen.getByText('Task split')).toBeInTheDocument())
    expect(screen.getByText(/Created 1 new task/)).toBeInTheDocument()
  })

  it('"Done" button on split success screen calls onClose', async () => {
    mockOkFetch({ id: 99, title: 'x', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '', last_modified: '', history: [] })
    const onClose = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={onClose} onDone={vi.fn()} />)

    fireEvent.click(screen.getByText('Split Task'))
    fireEvent.change(screen.getByPlaceholderText('Subtask 1…'), { target: { value: 'Part one' } })
    await waitFor(() => expect(screen.getByText('Create 1 subtask')).not.toBeDisabled())
    fireEvent.click(screen.getByText('Create 1 subtask'))

    await waitFor(() => screen.getByText('Done'))
    fireEvent.click(screen.getByText('Done'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onDone is called with a message containing "rescheduled" on successful reschedule', async () => {
    mockOkFetch({ id: 42 })
    const onDone = vi.fn()
    render(<DeadlineNegotiationModal item={makeItem()} onClose={vi.fn()} onDone={onDone} />)

    fireEvent.click(screen.getByText('Reschedule'))
    fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-05-10' } })
    fireEvent.click(screen.getByText('Save new date'))

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.stringContaining('rescheduled')))
  })
})
