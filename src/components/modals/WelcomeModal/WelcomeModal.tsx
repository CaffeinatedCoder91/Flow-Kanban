import React, { useState } from 'react'
import type { WelcomeModalProps } from './WelcomeModal.types'

const STEPS = [
  {
    icon: '✦',
    title: 'Welcome to Flow',
    body: 'The task board that thinks with you — AI insights, deadline negotiation, and smart suggestions all in one place.',
    cta: 'Next',
  },
  {
    icon: '✏️',
    title: 'Try creating a task',
    body: 'Type a task name in the search bar at the top and hit Add — or press Enter. Your board, your way.',
    pointer: 'add-task',
    cta: 'Next',
  },
  {
    icon: '✨',
    title: 'Meet your AI assistant',
    body: 'Click the AI Assistant button in the top-right to get suggestions, surface insights, and talk through your work.',
    pointer: 'ai-btn',
    cta: "Let's go",
  },
]

const STORAGE_KEY = 'flow-welcome-seen'

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch { /* ignore */ }
}

export const WelcomeModal = ({ onClose }: WelcomeModalProps): React.ReactElement => {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const advance = () => {
    if (isLast) {
      markWelcomeSeen()
      onClose()
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    markWelcomeSeen()
    onClose()
  }

  return (
    <div className="modal-overlay welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Flow">
      <div className="welcome-modal">
        <button className="welcome-skip" onClick={skip} aria-label="Skip">Skip</button>

        <div className="welcome-body">
          <div className="welcome-icon">{current.icon}</div>
          <h2 className="welcome-title">{current.title}</h2>
          <p className="welcome-text">{current.body}</p>
        </div>

        <div className="welcome-footer">
          <div className="welcome-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`welcome-dot${i === step ? ' active' : ''}`} />
            ))}
          </div>
          <button className="welcome-cta" onClick={advance}>
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
