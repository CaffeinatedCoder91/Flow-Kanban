import React from 'react'
import type { HelpModalProps } from './HelpModal.types'

export const HelpModal = ({ onClose }: HelpModalProps): React.ReactElement => {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Help">
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Help &amp; shortcuts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="help-body">

          {/* ── Getting started ───────────────────────────────────────── */}
          <section className="help-section">
            <h3 className="help-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
              </svg>
              Getting started
            </h3>
            <ul className="help-tips">
              <li className="help-tip">
                <span className="help-tip-icon">✏️</span>
                <div>
                  <strong>Add a task</strong> — type in the top bar and press Enter, or click the column's <em>+ Add task</em> button to drop it straight into that status.
                </div>
              </li>
              <li className="help-tip">
                <span className="help-tip-icon">🖱️</span>
                <div>
                  <strong>Move tasks</strong> — drag a card to any column to update its status instantly. You can also use the status selector inside each card.
                </div>
              </li>
              <li className="help-tip">
                <span className="help-tip-icon">🔍</span>
                <div>
                  <strong>Edit a card</strong> — click the description area to add notes, or set a due date, assignee, priority, and colour tag directly on the card.
                </div>
              </li>
              <li className="help-tip">
                <span className="help-tip-icon">✅</span>
                <div>
                  <strong>Mark done</strong> — change any card's status to <em>Done</em> and it gets a ✓ checkmark with a strikethrough so completed work stays visible but out of the way.
                </div>
              </li>
            </ul>
          </section>

          {/* ── Features ──────────────────────────────────────────────── */}
          <section className="help-section">
            <h3 className="help-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Features
            </h3>
            <ul className="help-features">
              <li className="help-feature">
                <span className="help-feature-icon help-feature-icon-yellow">💡</span>
                <div>
                  <strong>Insights</strong> — Flow automatically scans for duplicate tasks, stale items that haven't moved in a while, and upcoming deadline risks. The bar appears when there's something worth knowing. Hit <em>Refresh</em> any time to run a fresh analysis and get a task recommendation.
                </div>
              </li>
              <li className="help-feature">
                <span className="help-feature-icon help-feature-icon-purple">✨</span>
                <div>
                  <strong>AI Assistant</strong> — click <em>AI Assistant</em> in the toolbar to open a chat with Flow. Ask it to create tasks, reorganise your board, explain blockers, or just summarise what's on your plate. Flow can read and update your board directly.
                </div>
              </li>
              <li className="help-feature">
                <span className="help-feature-icon help-feature-icon-blue">📋</span>
                <div>
                  <strong>Import</strong> — paste a meeting summary, email thread, or bullet list and click <em>Process</em>. Flow extracts the action items and lets you review them before adding. You can also upload a <code>.txt</code>, <code>.pdf</code>, or <code>.docx</code> file (max 5 MB).
                </div>
              </li>
              <li className="help-feature">
                <span className="help-feature-icon help-feature-icon-green">📅</span>
                <div>
                  <strong>Deadline negotiation</strong> — when a task with a due date is at risk, click the purple clock icon on the card or the insight action button to open the negotiation modal. Flow can suggest rescheduling or splitting the task.
                </div>
              </li>
            </ul>
          </section>

          {/* ── Keyboard shortcuts ────────────────────────────────────── */}
          <section className="help-section">
            <h3 className="help-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
              </svg>
              Keyboard shortcuts
            </h3>
            <table className="help-shortcuts">
              <tbody>
                <tr>
                  <td><kbd>Enter</kbd></td>
                  <td>Add task (when toolbar input is focused)</td>
                </tr>
                <tr>
                  <td><kbd>Enter</kbd></td>
                  <td>Save assignee name while editing</td>
                </tr>
                <tr>
                  <td><kbd>Esc</kbd></td>
                  <td>Cancel inline task add / close any modal</td>
                </tr>
                <tr>
                  <td><kbd>Tab</kbd></td>
                  <td>Move between card fields</td>
                </tr>
                <tr>
                  <td><kbd>Drag</kbd></td>
                  <td>Reorder cards or move between columns</td>
                </tr>
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>
  )
}
