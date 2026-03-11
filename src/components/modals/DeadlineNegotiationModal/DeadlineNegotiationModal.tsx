import React, { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { DeadlineNegotiationModalProps } from './DeadlineNegotiationModal.types'

type Screen = 'home' | 'reschedule' | 'split' | 'deprioritize'

function friendlyDue(dueDateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr + 'T00:00:00')
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`
  if (diffDays === 0) return 'due today'
  if (diffDays === 1) return 'due tomorrow'
  return `due in ${diffDays} days`
}

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  stuck:       'Stuck',
  done:        'Done',
}

const PRIORITY_DOWN: Record<string, string> = {
  critical: 'high',
  high:     'medium',
  medium:   'low',
  low:      'low',
}

const PRIORITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}

export const DeadlineNegotiationModal = ({ item, onClose, onDone }: DeadlineNegotiationModalProps): React.ReactElement => {
  const [screen, setScreen]     = useState<Screen>('home')
  const [newDate, setNewDate]   = useState(item.due_date ?? '')
  type SplitRow = { title: string; description: string; estimated_priority: string }
  const [splitRows, setSplitRows]           = useState<SplitRow[]>([
    { title: '', description: '', estimated_priority: 'medium' },
    { title: '', description: '', estimated_priority: 'medium' },
  ])
  const [splitLoading, setSplitLoading]     = useState(false)
  const [deleteOriginal, setDeleteOriginal] = useState(false)
  const [busy, setBusy]                     = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const [dueDateAction, setDueDateAction]     = useState<'remove' | 'extend'>('remove')
  const [resetStatus, setResetStatus]         = useState(item.status === 'stuck')
  const [deprioritizeDone, setDeprioritizeDone] = useState(false)
  const [confirmationMsg, setConfirmationMsg] = useState<string[]>([])
  const [rescheduleDone, setRescheduleDone]   = useState(false)
  const [splitDoneCount, setSplitDoneCount]   = useState(0)

  const newPriority   = PRIORITY_DOWN[item.priority] ?? 'low'
  const extendedDate  = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
  })()

  type Suggestion = { date: string; label: string; isPattern?: boolean }
  const [suggestions, setSuggestions]               = useState<Suggestion[] | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    if (screen !== 'reschedule') return
    setSuggestions(null)
    setSuggestionsLoading(true)
    apiFetch('/api/suggest', {
      method: 'POST',
      body: JSON.stringify({ type: 'reschedule', itemId: item.id }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSuggestions(data.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false))
  }, [screen])

  useEffect(() => {
    if (screen !== 'split') return
    setSplitLoading(true)
    apiFetch('/api/suggest', {
      method: 'POST',
      body: JSON.stringify({ type: 'split', itemId: item.id }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSplitRows(data.suggestions)
        }
      })
      .catch(() => { /* keep default rows */ })
      .finally(() => setSplitLoading(false))
  }, [screen])

  const dueLabel = item.due_date ? friendlyDue(item.due_date) : 'no deadline set'
  const prompt   = `This task is ${dueLabel}. What would you like to do?`

  const patch = async (fields: Record<string, unknown>) => {
    const res = await apiFetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    })
    if (!res.ok) throw new Error('Update failed')
  }

  const back = (to: Screen = 'home') => { setError(null); setScreen(to) }

  const handleReschedule = async () => {
    if (!newDate) return
    setBusy(true); setError(null)
    try {
      await patch({ due_date: newDate })
      apiFetch('/api/deadline-actions', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, action_type: 'reschedule', original_due_date: item.due_date, new_due_date: newDate }),
      }).catch(() => {})
      const due = new Date(newDate + 'T00:00:00')
      const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      onDone(`Task rescheduled to ${label}`)
      setRescheduleDone(true)
    } catch {
      setError('Could not update the due date. Try again?')
      setBusy(false)
    }
  }

  const handleDeprioritize = async () => {
    setBusy(true); setError(null)
    try {
      const fields: Record<string, unknown> = { priority: newPriority }
      const msgs: string[] = [
        `Priority lowered from ${PRIORITY_LABEL[item.priority] ?? item.priority} to ${PRIORITY_LABEL[newPriority]}`,
      ]

      if (item.due_date) {
        if (dueDateAction === 'remove') {
          fields.due_date = null
          msgs.push('Due date removed')
        } else {
          fields.due_date = extendedDate
          msgs.push(`Due date extended to ${extendedDate}`)
        }
      }

      if (item.status === 'stuck' && resetStatus) {
        fields.status = 'not_started'
        msgs.push('Status reset to Not Started')
      }

      await patch(fields)
      apiFetch('/api/deadline-actions', {
        method: 'POST',
        body: JSON.stringify({
          item_id: item.id,
          action_type: 'deprioritize',
          original_due_date: item.due_date,
          new_due_date: 'due_date' in fields ? (fields.due_date as string | null) : item.due_date,
        }),
      }).catch(() => {})
      setConfirmationMsg(msgs)
      setDeprioritizeDone(true)
      onDone('Task deprioritized')
    } catch {
      setError('Could not update the task. Try again?')
    } finally {
      setBusy(false)
    }
  }

  const handleSplitCreate = async () => {
    const rows = splitRows.filter(r => r.title.trim())
    if (rows.length === 0) return
    setBusy(true); setError(null)
    try {
      for (const row of rows) {
        const res = await apiFetch('/api/items', {
          method: 'POST',
          body: JSON.stringify({
            title:       row.title.trim(),
            description: row.description || null,
            priority:    row.estimated_priority || 'medium',
          }),
        })
        if (!res.ok) throw new Error('Failed to create subtask')
      }
      if (deleteOriginal) {
        await apiFetch(`/api/items/${item.id}`, { method: 'DELETE' })
      }
      apiFetch('/api/deadline-actions', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, action_type: 'split', original_due_date: item.due_date }),
      }).catch(() => {})
      const n = rows.length
      onDone(`Task split into ${n} new task${n === 1 ? '' : 's'}`)
      setSplitDoneCount(n)
    } catch {
      setError('Could not create subtasks. Try again?')
      setBusy(false)
    }
  }

  const filledCount = splitRows.filter(r => r.title.trim()).length
  const splitLabel  = busy ? 'Creating…'
    : filledCount === 0 ? 'Create subtasks'
    : filledCount === 1 ? 'Create 1 subtask'
    : `Create ${filledCount} subtasks`

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Resolve deadline">
      <div className="modal dnm-modal" onClick={e => e.stopPropagation()}>
        <button className="dnm-close" onClick={onClose} aria-label="Close">×</button>

        {/* ── Home ── */}
        {screen === 'home' && (
          <div className="dnm-home">
            <div className="dnm-icon">⏰</div>
            <h2 className="dnm-title">{item.title}</h2>
            <p className="dnm-prompt">{prompt}</p>
            <div className="dnm-meta">
              <span className={`dnm-status dnm-status-${item.status}`}>
                {STATUS_LABEL[item.status] ?? item.status}
              </span>
              {item.due_date && <span className="dnm-due">{item.due_date}</span>}
            </div>
            <div className="dnm-actions">
              <button className="dnm-action-btn" onClick={() => setScreen('reschedule')}>
                <span className="dnm-action-icon">🗓</span>
                <span className="dnm-action-label">Reschedule</span>
                <span className="dnm-action-desc">Pick a new date</span>
              </button>
              <button className="dnm-action-btn" onClick={() => setScreen('split')}>
                <span className="dnm-action-icon">✂️</span>
                <span className="dnm-action-label">Split Task</span>
                <span className="dnm-action-desc">Break into smaller pieces</span>
              </button>
              <button className="dnm-action-btn" onClick={() => setScreen('deprioritize')}>
                <span className="dnm-action-icon">↓</span>
                <span className="dnm-action-label">Deprioritize</span>
                <span className="dnm-action-desc">Lower priority, clear deadline</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Reschedule ── */}
        {screen === 'reschedule' && (
          <div className="dnm-screen">
            {rescheduleDone ? (
              <div className="dnm-deprior-done">
                <div className="dnm-deprior-done-icon">✓</div>
                <p className="dnm-deprior-done-title">Date updated</p>
                <ul className="dnm-confirm-summary">
                  <li className="dnm-confirm-summary-item">
                    Due date set to {new Date(newDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </li>
                </ul>
                <button className="dnm-primary-btn" onClick={onClose}>Done</button>
              </div>
            ) : (
              <>
                <button className="dnm-back" onClick={() => back()}>← Back</button>
                <p className="dnm-prompt">When's a better time for this?</p>

                {suggestionsLoading && (
                  <div className="dnm-suggestions-loading">
                    <span className="modal-spinner" />
                    <span>Finding good dates…</span>
                  </div>
                )}
                {!suggestionsLoading && suggestions && suggestions.length > 0 && (
                  <div className="dnm-suggestions">
                    {suggestions.map(s => (
                      <button
                        key={s.date}
                        className={`dnm-suggestion-btn${newDate === s.date ? ' active' : ''}${s.isPattern ? ' dnm-suggestion-pattern' : ''}`}
                        onClick={() => setNewDate(s.date)}
                      >
                        {s.isPattern && <span className="dnm-pattern-badge">Your pattern</span>}
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="date"
                  className="dnm-date-input"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                />
                {error && <p className="dnm-error">{error}</p>}
                <button
                  className="dnm-primary-btn"
                  onClick={handleReschedule}
                  disabled={!newDate || busy}
                >
                  {busy ? 'Saving…' : 'Save new date'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Split ── */}
        {screen === 'split' && (
          <div className="dnm-screen">
            {splitDoneCount > 0 ? (
              <div className="dnm-deprior-done">
                <div className="dnm-deprior-done-icon">✓</div>
                <p className="dnm-deprior-done-title">Task split</p>
                <ul className="dnm-confirm-summary">
                  <li className="dnm-confirm-summary-item">
                    Created {splitDoneCount} new task{splitDoneCount === 1 ? '' : 's'}
                  </li>
                  {deleteOriginal && <li className="dnm-confirm-summary-item">Original task deleted</li>}
                </ul>
                <button className="dnm-primary-btn" onClick={onClose}>Done</button>
              </div>
            ) : (
              <>
                <button className="dnm-back" onClick={() => back()}>← Back</button>
                <p className="dnm-prompt">Break it into smaller pieces. What are the steps?</p>

                {splitLoading && (
                  <div className="dnm-suggestions-loading">
                    <span className="modal-spinner" />
                    <span>Finding good subtasks…</span>
                  </div>
                )}

                <div className="dnm-subtasks">
                  {splitRows.map((row, i) => (
                    <div key={i} className="dnm-split-row">
                      <div className="dnm-split-row-header">
                        <span className={`dnm-split-priority dnm-priority-${row.estimated_priority}`}>
                          {row.estimated_priority}
                        </span>
                        <button
                          className="dnm-split-remove"
                          onClick={() => setSplitRows(prev => prev.filter((_, j) => j !== i))}
                          aria-label={`Remove subtask ${i + 1}`}
                          disabled={splitRows.length === 1}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        className="dnm-subtask-input"
                        placeholder={`Subtask ${i + 1}…`}
                        value={row.title}
                        onChange={e => setSplitRows(prev => prev.map((r, j) => j === i ? { ...r, title: e.target.value } : r))}
                      />
                      {row.description && (
                        <p className="dnm-split-desc">{row.description}</p>
                      )}
                    </div>
                  ))}
                  {!splitLoading && splitRows.length < 5 && (
                    <button className="dnm-add-subtask" onClick={() => setSplitRows(prev => [...prev, { title: '', description: '', estimated_priority: 'medium' }])}>
                      + Add another step
                    </button>
                  )}
                </div>

                {!splitLoading && (
                  <label className="dnm-delete-original">
                    <input
                      type="checkbox"
                      checked={deleteOriginal}
                      onChange={e => setDeleteOriginal(e.target.checked)}
                    />
                    <span>Also delete original task</span>
                  </label>
                )}

                {error && <p className="dnm-error">{error}</p>}
                <button
                  className="dnm-primary-btn"
                  onClick={handleSplitCreate}
                  disabled={filledCount === 0 || busy || splitLoading}
                >
                  {splitLabel}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Deprioritize ── */}
        {screen === 'deprioritize' && (
          <div className="dnm-screen">
            {!deprioritizeDone ? (
              <>
                <button className="dnm-back" onClick={() => back()}>← Back</button>
                <p className="dnm-prompt">Lower the pressure on this task.</p>

                <div className="dnm-deprior-section">
                  <div className="dnm-deprior-label">Priority</div>
                  <div className="dnm-deprior-priority">
                    <span className={`dnm-split-priority dnm-priority-${item.priority}`}>
                      {PRIORITY_LABEL[item.priority] ?? item.priority}
                    </span>
                    <span className="dnm-priority-arrow">→</span>
                    <span className={`dnm-split-priority dnm-priority-${newPriority}`}>
                      {PRIORITY_LABEL[newPriority]}
                    </span>
                  </div>
                </div>

                {item.due_date && (
                  <div className="dnm-deprior-section">
                    <div className="dnm-deprior-label">Due date</div>
                    <div className="dnm-deprior-options">
                      <label className="dnm-deprior-option">
                        <input
                          type="radio"
                          name="due-date-action"
                          value="remove"
                          checked={dueDateAction === 'remove'}
                          onChange={() => setDueDateAction('remove')}
                        />
                        <span>Remove due date entirely</span>
                      </label>
                      <label className="dnm-deprior-option">
                        <input
                          type="radio"
                          name="due-date-action"
                          value="extend"
                          checked={dueDateAction === 'extend'}
                          onChange={() => setDueDateAction('extend')}
                        />
                        <span>Extend by 7 days <span className="dnm-deprior-hint">({extendedDate})</span></span>
                      </label>
                    </div>
                  </div>
                )}

                {item.status === 'stuck' && (
                  <label className="dnm-delete-original">
                    <input
                      type="checkbox"
                      checked={resetStatus}
                      onChange={e => setResetStatus(e.target.checked)}
                    />
                    <span>Reset status to Not Started</span>
                  </label>
                )}

                {error && <p className="dnm-error">{error}</p>}
                <button className="dnm-primary-btn" onClick={handleDeprioritize} disabled={busy}>
                  {busy ? 'Applying…' : 'Apply changes'}
                </button>
              </>
            ) : (
              <div className="dnm-deprior-done">
                <div className="dnm-deprior-done-icon">✓</div>
                <p className="dnm-deprior-done-title">Changes applied</p>
                <ul className="dnm-confirm-summary">
                  {confirmationMsg.map((msg, i) => (
                    <li key={i} className="dnm-confirm-summary-item">{msg}</li>
                  ))}
                </ul>
                <button className="dnm-primary-btn" onClick={onClose}>Done</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
