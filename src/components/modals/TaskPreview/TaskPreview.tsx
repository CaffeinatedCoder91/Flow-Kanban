import React from 'react'
import { ProposedTask, STATUS_CONFIG, PRIORITY_CONFIG } from '../../../types'

const COLOR_PALETTE = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
]

function ConfidenceBadge({ score }: { score: number | undefined }) {
  if (score === undefined || score === null || score >= 70) return null
  return (
    <span
      className="confidence-badge"
      aria-label={`AI confidence: ${score}% — please review this field`}
    >
      ⚠
      <span className="confidence-tooltip">AI confidence: {score}% — please review this field</span>
    </span>
  )
}

interface TaskPreviewProps {
  task: ProposedTask
  onChange: (updated: ProposedTask) => void
  onRemove: () => void
}

export const TaskPreview = ({ task, onChange, onRemove }: TaskPreviewProps): React.ReactElement => {
  const statusColor = STATUS_CONFIG.find(s => s.key === task.status)?.color ?? '#8B5CF6'

  const set = <K extends keyof ProposedTask>(key: K, value: ProposedTask[K]) =>
    onChange({ ...task, [key]: value })

  return (
    <div className="task-preview-card" style={{ borderLeftColor: statusColor }}>
      {/* Title */}
      <div className="task-preview-title-row">
        <div className="card-color-circle task-preview-color-swatch" style={{ backgroundColor: task.color ?? '#E5E7EB' }} />
        <input
          className="task-preview-title-input"
          value={task.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Task title"
        />
        <ConfidenceBadge score={task.confidence?.title} />
        <button className="task-preview-remove" onClick={onRemove} aria-label="Remove task">&times;</button>
      </div>

      {/* Color picker */}
      <div className="task-preview-row">
        <span className="task-preview-label">Color</span>
        <div className="task-preview-color-palette">
          {COLOR_PALETTE.map(({ name, value }) => (
            <button
              key={value}
              className={`card-color-option${task.color === value ? ' selected' : ''}`}
              style={{ backgroundColor: value }}
              onClick={() => set('color', value)}
              aria-label={name}
              title={name}
            />
          ))}
          {task.color && (
            <button className="card-color-clear" onClick={() => set('color', null)}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="task-preview-description-header">
        <span className="task-preview-label">Description</span>
        <ConfidenceBadge score={task.confidence?.description} />
      </div>
      <textarea
        className="task-preview-description"
        value={task.description ?? ''}
        onChange={e => set('description', e.target.value || null)}
        placeholder="Add description..."
        rows={3}
      />

      {/* Meta row: status, priority */}
      <div className="task-preview-footer">
        <div className="task-preview-field-with-badge">
          <select
            className={`priority-select priority-${task.priority}`}
            value={task.priority}
            onChange={e => set('priority', e.target.value)}
            aria-label="Priority"
          >
            {PRIORITY_CONFIG.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ConfidenceBadge score={task.confidence?.priority} />
        </div>
        <div className="status-with-tooltip">
          <select
            className="status-select"
            value={task.status}
            onChange={e => set('status', e.target.value)}
            aria-label="Status"
          >
            {STATUS_CONFIG.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          {task.status_reasoning && (
            <span className="status-reasoning-badge" aria-label={`Status reasoning: ${task.status_reasoning}`}>
              i
              <span className="status-reasoning-tooltip">{task.status_reasoning}</span>
            </span>
          )}
        </div>
      </div>

      {/* Due date + Assignee */}
      <div className="card-meta task-preview-meta">
        <label className="card-due-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={`card-due-date-text${task.due_date ? '' : ' card-due-date-empty'}`}>
            {task.due_date || 'Set due date'}
          </span>
          <ConfidenceBadge score={task.confidence?.due_date} />
          <input
            type="date"
            value={task.due_date ?? ''}
            onChange={e => set('due_date', e.target.value || null)}
            className="card-due-date-input"
          />
        </label>
        <div className="card-assignee">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            value={task.assignee ?? ''}
            onChange={e => set('assignee', e.target.value || null)}
            placeholder="Assign to..."
            className="card-assignee-input task-preview-assignee-inline"
          />
          <ConfidenceBadge score={task.confidence?.assignee} />
        </div>
      </div>
    </div>
  )
}
