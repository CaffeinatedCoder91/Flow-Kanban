import React, { useEffect, useState } from 'react'
import type { OnboardingChecklistProps } from './OnboardingChecklist.types'
import {
  Widget, WidgetHeader, WidgetTitle, DismissBtn,
  StepList, Step, StepIcon, ProgressBar,
} from './OnboardingChecklist.styles'

const DISMISSED_KEY = 'flow-onboarding-dismissed'

const STEPS = [
  { label: 'Create your account' },
  { label: 'Add your first task' },
  { label: 'Try the AI assistant' },
  { label: 'Import tasks' },
]

export function OnboardingChecklist({ hasAddedTask, hasTriedAI, hasImportedTasks }: OnboardingChecklistProps): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(DISMISSED_KEY) === 'true'
  )

  const doneStates = [true, hasAddedTask, hasTriedAI, hasImportedTasks]
  const doneCount = doneStates.filter(Boolean).length
  const allDone = doneCount === STEPS.length

  // Auto-dismiss 2s after all steps complete
  useEffect(() => {
    if (!allDone) return
    const t = setTimeout(() => {
      localStorage.setItem(DISMISSED_KEY, 'true')
      setDismissed(true)
    }, 2000)
    return () => clearTimeout(t)
  }, [allDone])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <Widget>
      <WidgetHeader>
        <WidgetTitle>Get started</WidgetTitle>
        <DismissBtn onClick={handleDismiss} aria-label="Dismiss">×</DismissBtn>
      </WidgetHeader>

      <StepList>
        {STEPS.map((step, i) => (
          <Step key={step.label} done={doneStates[i]}>
            <StepIcon done={doneStates[i]}>
              {doneStates[i] && '✓'}
            </StepIcon>
            {step.label}
          </Step>
        ))}
      </StepList>

      <ProgressBar pct={Math.round((doneCount / STEPS.length) * 100)} />
    </Widget>
  )
}
