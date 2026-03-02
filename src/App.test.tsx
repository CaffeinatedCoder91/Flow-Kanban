import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// NarrativeWidget makes its own /api/narrative fetch; stub it out so it doesn't
// interfere with the fetch mock sequences used by App tests.
vi.mock('./NarrativeWidget', () => ({ default: () => null }))

const mockItems = [{
  id: 1,
  title: 'Test item',
  description: null,
  status: 'not_started',
  priority: 'medium',
  color: null,
  assignee: null,
  due_date: null,
  position: 0,
  created_at: '2026-01-01 00:00:00',
  last_modified: '2026-01-01 00:00:00',
  history: [],
}]

function mockFetchItems(items = mockItems) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(items),
  } as Response)
}

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  // Simulate a returning user so sample-data seeding never fires during tests.
  localStorage.setItem('flow-welcome-seen', 'true')
})

// ─── Core ────────────────────────────────────────────────────────────────────

describe('App', () => {
  it('renders the app title', async () => {
    mockFetchItems([])
    render(<App />)
    expect(document.querySelector('.board-name')?.textContent).toBe('Flow')
  })

  it('renders kanban columns', async () => {
    mockFetchItems([])
    render(<App />)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Stuck')).toBeInTheDocument()
  })

  it('loads and displays items in correct column', async () => {
    mockFetchItems()
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Test item')).toBeInTheDocument()
    })
  })

  it('adds a new item via top form', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({
        id: 2, title: 'New item', description: null, status: 'not_started',
        priority: 'medium', color: null, assignee: null, due_date: null,
        position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [],
      }) } as Response)

    render(<App />)
    // Wait for init() to complete so setItems([]) doesn't clobber the optimistic card.
    await waitFor(() => expect(document.querySelectorAll('.skeleton-card').length).toBe(0))
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'New item' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(screen.getByText('New item')).toBeInTheDocument())
  })

  it('deletes an item', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockItems) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) } as Response)

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('delete-1'))
    await waitFor(() => expect(screen.queryByText('Test item')).not.toBeInTheDocument())
  })
})

// ─── Import modal ─────────────────────────────────────────────────────────────

describe('Import modal', () => {
  it('opens when "Import Tasks" button is clicked', async () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    expect(screen.getByPlaceholderText(/Fix login bug/)).toBeInTheDocument()
  })

  it('closes when Cancel is clicked', async () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText(/Fix login bug/)).not.toBeInTheDocument()
  })

  it('Process button is disabled when textarea is empty', () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    expect(screen.getByText('Process')).toBeDisabled()
  })

  it('Process button is enabled when textarea has text', () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Fix the login bug' } })
    expect(screen.getByText('Process')).not.toBeDisabled()
  })

  it('shows extracted task previews after processing', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [
            { title: 'Fix login bug', description: 'Auth issue', priority: 'high', status: 'not_started', due_date: null, assignee: null, color: null },
            { title: 'Write tests', description: 'Add coverage', priority: 'medium', status: 'not_started', due_date: null, assignee: null, color: null },
          ],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Fix login bug and write tests' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Fix login bug')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Write tests')).toBeInTheDocument()
    })
  })

  it('shows count header in preview phase', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [
            { title: 'Task A', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null },
          ],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Do something important' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => {
      expect(screen.getByText(/1 task found/)).toBeInTheDocument()
    })
  })

  it('removes a task preview when × is clicked', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [
            { title: 'Keep this', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null },
            { title: 'Remove this', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null },
          ],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Two tasks to extract' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => expect(screen.getByDisplayValue('Remove this')).toBeInTheDocument())

    const removeButtons = screen.getAllByLabelText('Remove task')
    fireEvent.click(removeButtons[1])

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Remove this')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Keep this')).toBeInTheDocument()
    })
  })

  it('shows Back button in preview phase that returns to textarea', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [{ title: 'A task', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null }],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Some task text here' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => expect(screen.getByText(/Back/)).toBeInTheDocument())
    fireEvent.click(screen.getByText('Back'))

    expect(screen.getByPlaceholderText(/Fix login bug/)).toBeInTheDocument()
  })

  it('calls bulk endpoint and shows toast on Confirm All', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [
            { title: 'Task A', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null },
            { title: 'Task B', description: null, priority: 'low', status: 'not_started', due_date: null, assignee: null, color: null },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [
            { id: 10, title: 'Task A', description: null, status: 'not_started', priority: 'low', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
            { id: 11, title: 'Task B', description: null, status: 'not_started', priority: 'low', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
          ],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'Two tasks to add now' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => expect(screen.getByText(/Confirm All/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Confirm All/))

    await waitFor(() => {
      expect(screen.getByText(/Added 2 tasks from imported text/)).toBeInTheDocument()
    })
  })

  it('shows error message when extraction fails', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Text is too short to extract tasks from.' }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'short text ok' } })
    fireEvent.click(screen.getByText('Process'))

    await waitFor(() => {
      expect(screen.getByText('Text is too short to extract tasks from.')).toBeInTheDocument()
    })
  })

  it('resets state when modal is reopened', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))
    fireEvent.change(screen.getByPlaceholderText(/Fix login bug/), { target: { value: 'some text' } })
    fireEvent.click(screen.getByText('Cancel'))

    fireEvent.click(screen.getByLabelText('Import Tasks'))
    expect(screen.getByPlaceholderText(/Fix login bug/)).toHaveValue('')
  })
})

// ─── Insights bar ─────────────────────────────────────────────────────────────

describe('Insights bar', () => {
  it('does not render insights bar when there are no insights', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)

    render(<App />)
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument()
  })

  it('renders insight cards when insights are returned', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockItems) } as Response)
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          insights: [{
            type: 'stale', severity: 'low',
            title: 'Stale tasks detected',
            description: '1 task not updated in 7 days.',
            items: [1],
          }],
        }),
      } as Response)

    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Stale tasks detected')).toBeInTheDocument()
    })
  })

  it('dismisses an insight card when dismiss is clicked', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockItems) } as Response)
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          insights: [{
            type: 'stale', severity: 'low',
            title: 'Stale tasks detected',
            description: '1 task not updated.',
            items: [1],
          }],
        }),
      } as Response)

    render(<App />)
    await waitFor(() => expect(screen.getByText('Stale tasks detected')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Dismiss insight'))
    await waitFor(() => expect(screen.queryByText('Stale tasks detected')).not.toBeInTheDocument())
  })
})

// ─── Deadline risk insights ───────────────────────────────────────────────────

describe('Deadline risk insights', () => {
  // Route every fetch call by URL so we can control each endpoint independently.
  function routedFetch(handlers: Record<string, unknown>) {
    return vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const payload = handlers[url as string] ?? {}
      return { ok: true, json: () => Promise.resolve(payload) } as Response
    })
  }

  it('shows a high-risk deadline insight card when at-risk items are returned', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText(/"Test item" is overdue or due within 48h/)).toBeInTheDocument()
    )
  })

  it('shows plural title when multiple high-risk items exist', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [
          { item_id: 1, title: 'Task A', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' },
          { item_id: 2, title: 'Task B', due_date: '2026-02-24', status: 'stuck',       risk_level: 'high' },
        ],
      },
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText('2 tasks overdue or due within 48h')).toBeInTheDocument()
    )
  })

  it('shows a medium-risk deadline insight when in-progress tasks are due today', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'in_progress', risk_level: 'medium' }],
      },
    })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText(/"Test item" is in progress and due today/)).toBeInTheDocument()
    )
  })

  it('shows the ⏰ icon on deadline risk cards', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => screen.getByText(/"Test item" is overdue or due within 48h/))
    expect(screen.getByText('⏰')).toBeInTheDocument()
  })

  it('deadline risk cards are dismissible', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => screen.getByText(/"Test item" is overdue or due within 48h/))
    fireEvent.click(screen.getByLabelText('Dismiss insight'))
    await waitFor(() =>
      expect(screen.queryByText(/"Test item" is overdue or due within 48h/)).not.toBeInTheDocument()
    )
  })

  it('shows no deadline insight when at_risk is empty', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': { at_risk: [] },
    })
    render(<App />)
    await waitFor(() => screen.getByText('Test item'))
    expect(screen.queryByText(/overdue or due within/)).not.toBeInTheDocument()
    expect(screen.queryByText(/due today/)).not.toBeInTheDocument()
  })

  it('deadline risk insights appear alongside other insight types', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [{ type: 'stale', severity: 'low', title: 'Stale tasks detected', description: '1 task.', items: [1] }] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Stale tasks detected')).toBeInTheDocument()
      expect(screen.getByText(/"Test item" is overdue or due within 48h/)).toBeInTheDocument()
    })
  })
})

// ─── File upload ──────────────────────────────────────────────────────────────

describe('File upload', () => {
  it('shows client-side error for unsupported file type', () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'notes.xlsx', { type: 'application/vnd.ms-excel' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument()
  })

  it('shows client-side error for files over 5MB', () => {
    mockFetchItems([])
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigContent = new Uint8Array(6 * 1024 * 1024)
    const file = new File([bigContent], 'big.txt', { type: 'text/plain' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    expect(screen.getByText(/File is too large/)).toBeInTheDocument()
  })

  it('shows task previews and filename after successful file upload', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tasks: [{ title: 'From file task', description: null, priority: 'medium', status: 'not_started', due_date: null, assignee: null, color: null }],
        }),
      } as Response)

    render(<App />)
    fireEvent.click(screen.getByLabelText('Import Tasks'))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['Fix the bug'], 'meeting-notes.txt', { type: 'text/plain' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/Tasks from:/)).toBeInTheDocument()
      expect(screen.getByText('meeting-notes.txt')).toBeInTheDocument()
      expect(screen.getByDisplayValue('From file task')).toBeInTheDocument()
    })
  })
})

// ─── Proactive assistant messaging ────────────────────────────────────────────

describe('Proactive assistant messaging', () => {
  function routedFetch(handlers: Record<string, unknown>) {
    return vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const payload = handlers[url as string] ?? {}
      return { ok: true, json: () => Promise.resolve(payload) } as Response
    })
  }

  it('auto-opens the assistant panel when a new high-risk item is detected', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Deploy to Production', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => {
      expect(document.querySelector('.assistant-panel-open')).toBeInTheDocument()
    })
  })

  it('injects a proactive message into the assistant chat for a high-risk item', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Deploy to Production', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Hey, I noticed "Deploy to Production"/)).toBeInTheDocument()
    })
  })

  it('proactive message mentions the task status', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Fix auth bug', due_date: '2026-02-24', status: 'stuck', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/it's stuck/)).toBeInTheDocument()
    })
  })

  it('proactive message mentions rescheduling and splitting', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Ship feature', due_date: '2026-02-26', status: 'not_started', risk_level: 'high' }],
      },
    })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/rescheduling or splitting it up/)).toBeInTheDocument()
    })
  })

  it('does not auto-open the assistant panel for medium-risk items', async () => {
    routedFetch({
      '/api/items': mockItems,
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{ item_id: 1, title: 'Test item', due_date: '2026-02-25', status: 'in_progress', risk_level: 'medium' }],
      },
    })
    render(<App />)
    await waitFor(() => screen.getByText(/"Test item" is in progress and due today/))
    expect(document.querySelector('.assistant-panel-open')).not.toBeInTheDocument()
  })

  it('does not re-alert the same item on subsequent insight refreshes', async () => {
    let callCount = 0
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (url === '/api/items') return { ok: true, json: () => Promise.resolve(mockItems) } as Response
      if (url === '/api/insights') return { ok: true, json: () => Promise.resolve({ insights: [] }) } as Response
      if (url === '/api/check-deadline-risks') {
        callCount++
        return { ok: true, json: () => Promise.resolve({
          at_risk: [{ item_id: 1, title: 'Repeat task', due_date: '2026-02-25', status: 'not_started', risk_level: 'high' }],
        }) } as Response
      }
      return { ok: true, json: () => Promise.resolve({}) } as Response
    })

    render(<App />)
    // Wait for the first alert to appear
    await waitFor(() => expect(screen.getByText(/Hey, I noticed "Repeat task"/)).toBeInTheDocument())

    // Count the number of proactive messages — should be exactly one even if
    // the insights refresh runs again (alertedItemIdsRef prevents duplicates)
    const alerts = screen.getAllByText(/Hey, I noticed "Repeat task"/)
    expect(alerts).toHaveLength(1)
    expect(callCount).toBeGreaterThan(0)
  })
})

// ─── Error handling ────────────────────────────────────────────────────────────

describe('Error handling', () => {
  it('shows board error state when initial load fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'))
    render(<App />)
    // fetchWithRetry makes 3 attempts with exponential backoff (~900–1100ms total)
    await waitFor(() => {
      expect(screen.getByText(/Couldn't load your tasks/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('retry button on board error triggers reload and shows items', async () => {
    // fetchWithRetry makes 3 attempts by default, so we need 3 rejections to trigger the error state
    vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockItems) } as Response)

    render(<App />)
    // Use a longer timeout to account for exponential backoff delays (~900–1100ms total)
    await waitFor(() => expect(screen.getByText(/Couldn't load your tasks/)).toBeInTheDocument(), { timeout: 5000 })
    fireEvent.click(screen.getByText('Try again'))
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows error toast when task creation fails', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) } as Response)

    render(<App />)
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/Failed to create task/)).toBeInTheDocument()
    })
  })

  it('task creation retry succeeds and item appears', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 5, title: 'New task', description: null, status: 'not_started',
          priority: 'medium', color: null, assignee: null, due_date: null,
          position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [],
        }),
      } as Response)

    render(<App />)
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(screen.getByText(/Failed to create task/)).toBeInTheDocument())

    fireEvent.click(screen.getByText('Try again'))
    await waitFor(() => expect(screen.getByText('New task')).toBeInTheDocument())
  })

  it('shows insights error card when insights fetch fails', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockItems) } as Response)
      .mockResolvedValue({ ok: false, json: () => Promise.resolve({}) } as Response)

    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Couldn't load insights/)).toBeInTheDocument()
    })
  })
})

// ─── Optimistic updates ────────────────────────────────────────────────────────

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

// Route all fetch calls by URL + method so insights calls never consume the
// mocks intended for the operation under test.
function routedMock(handlers: Record<string, () => Promise<Response>>) {
  return vi.spyOn(global, 'fetch').mockImplementation(
    async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString()
      const method = (init?.method ?? 'GET').toUpperCase()
      const key = `${method} ${urlStr}`
      if (handlers[key]) return handlers[key]()
      if (handlers[urlStr]) return handlers[urlStr]()
      return { ok: true, json: () => Promise.resolve({ insights: [], at_risk: [] }) } as Response
    }
  )
}

describe('Optimistic updates', () => {
  // ── Creation ──────────────────────────────────────────────────────────────

  it('temp card appears in board before POST resolves', async () => {
    const d = deferred<Response>()
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockReturnValueOnce(d.promise)

    render(<App />)
    await waitFor(() => expect(document.querySelectorAll('.skeleton-card').length).toBe(0))
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'Quick task' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => expect(screen.getByText('Quick task')).toBeInTheDocument())

    d.resolve({ ok: true, json: () => Promise.resolve({
      id: 99, title: 'Quick task', description: null, status: 'not_started',
      priority: 'medium', color: null, assignee: null, due_date: null,
      position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [],
    }) } as Response)
  })

  it('temp card removed and error toast shown when POST fails', async () => {
    const d = deferred<Response>()
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockReturnValueOnce(d.promise)

    render(<App />)
    await waitFor(() => expect(document.querySelectorAll('.skeleton-card').length).toBe(0))
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'Doomed task' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => expect(screen.getByText('Doomed task')).toBeInTheDocument())

    d.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)

    await waitFor(() => {
      expect(screen.queryByText('Doomed task')).not.toBeInTheDocument()
      expect(screen.getByText(/Failed to create task/)).toBeInTheDocument()
    })
  })

  it('card shows server-assigned id after POST resolves', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({
        id: 42, title: 'ID task', description: null, status: 'not_started',
        priority: 'medium', color: null, assignee: null, due_date: null,
        position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [],
      }) } as Response)

    render(<App />)
    await waitFor(() => expect(document.querySelectorAll('.skeleton-card').length).toBe(0))
    const input = screen.getByTestId('todo-input')
    fireEvent.change(input, { target: { value: 'ID task' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(document.querySelector('[data-item-id="42"]')).toBeInTheDocument()
    })
  })

  // ── Patch ─────────────────────────────────────────────────────────────────

  it('status select updates immediately before PATCH resolves', async () => {
    const d = deferred<Response>()
    routedMock({
      'GET /api/items': () => Promise.resolve({ ok: true, json: () => Promise.resolve(mockItems) } as Response),
      'PATCH /api/items/1': () => d.promise,
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Change status'), { target: { value: 'in_progress' } })

    await waitFor(() => expect(screen.getByLabelText('Change status')).toHaveValue('in_progress'))

    d.resolve({ ok: true, json: () => Promise.resolve({ ...mockItems[0], status: 'in_progress' }) } as Response)
  })

  it('status reverts and error toast shown when PATCH returns ok: false', async () => {
    routedMock({
      'GET /api/items': () => Promise.resolve({ ok: true, json: () => Promise.resolve(mockItems) } as Response),
      'PATCH /api/items/1': () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response),
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())

    expect(screen.getByLabelText('Change status')).toHaveValue('not_started')
    fireEvent.change(screen.getByLabelText('Change status'), { target: { value: 'in_progress' } })

    await waitFor(() => {
      expect(screen.getByLabelText('Change status')).toHaveValue('not_started')
      expect(screen.getByText(/Failed to update task status/)).toBeInTheDocument()
    })
  })

  it('status confirmed from server value after successful PATCH; no error shown', async () => {
    routedMock({
      'GET /api/items': () => Promise.resolve({ ok: true, json: () => Promise.resolve(mockItems) } as Response),
      'PATCH /api/items/1': () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockItems[0], status: 'in_progress' }) } as Response),
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Change status'), { target: { value: 'in_progress' } })

    await waitFor(() => expect(screen.getByLabelText('Change status')).toHaveValue('in_progress'))
    expect(screen.queryByText(/Failed/)).not.toBeInTheDocument()
  })

  // ── Deletion ──────────────────────────────────────────────────────────────

  it('item disappears before DELETE resolves', async () => {
    const d = deferred<Response>()
    routedMock({
      'GET /api/items': () => Promise.resolve({ ok: true, json: () => Promise.resolve(mockItems) } as Response),
      'DELETE /api/items/1': () => d.promise,
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('delete-1'))

    await waitFor(() => expect(screen.queryByText('Test item')).not.toBeInTheDocument())

    d.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  })

  it('item restored and error toast shown when DELETE fails; no Try again button', async () => {
    const d = deferred<Response>()
    routedMock({
      'GET /api/items': () => Promise.resolve({ ok: true, json: () => Promise.resolve(mockItems) } as Response),
      'DELETE /api/items/1': () => d.promise,
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Test item')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('delete-1'))
    await waitFor(() => expect(screen.queryByText('Test item')).not.toBeInTheDocument())

    d.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)

    await waitFor(() => {
      expect(screen.getByText('Test item')).toBeInTheDocument()
      expect(screen.getByText(/Failed to delete task/)).toBeInTheDocument()
      expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    })
  })
})
