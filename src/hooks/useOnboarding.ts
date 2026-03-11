import { useState, useEffect, useRef } from 'react'
import { Item } from '@/types'
import { hasSeenWelcome } from '@/components/modals/WelcomeModal'

interface UseOnboardingParams {
  items: Item[]
}

export function useOnboarding({ items }: UseOnboardingParams) {
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome())
  const [hasTriedAI, setHasTriedAI] = useState(() => localStorage.getItem('flow-tried-ai') === 'true')
  const [hasImportedTasks, setHasImportedTasks] = useState(() => localStorage.getItem('flow-imported-tasks') === 'true')
  const [showConfetti, setShowConfetti] = useState(false)
  const prevItemsLengthRef = useRef(0)
  const prevDoneCountRef = useRef(0)

  // Fire confetti the first time a task is created (board goes 0 → 1)
  useEffect(() => {
    const prev = prevItemsLengthRef.current
    prevItemsLengthRef.current = items.length
    if (prev === 0 && items.length === 1 && !localStorage.getItem('flow-first-celebration-done')) {
      localStorage.setItem('flow-first-celebration-done', 'true')
      setShowConfetti(true)
    }
  }, [items.length])

  // Fire confetti the first time any task is moved to Done
  useEffect(() => {
    const doneCount = items.filter(i => i.status === 'done').length
    const prev = prevDoneCountRef.current
    prevDoneCountRef.current = doneCount
    if (prev === 0 && doneCount === 1 && !localStorage.getItem('flow-first-done')) {
      localStorage.setItem('flow-first-done', 'true')
      setShowConfetti(true)
    }
  }, [items])

  const markTriedAI = () => {
    if (!hasTriedAI) {
      localStorage.setItem('flow-tried-ai', 'true')
      setHasTriedAI(true)
    }
  }

  const markImportedTasks = () => {
    if (!hasImportedTasks) {
      localStorage.setItem('flow-imported-tasks', 'true')
      setHasImportedTasks(true)
    }
  }

  return {
    showWelcome,
    setShowWelcome,
    hasTriedAI,
    hasImportedTasks,
    showConfetti,
    setShowConfetti,
    markTriedAI,
    markImportedTasks,
  }
}
