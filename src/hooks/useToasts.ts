import { useState, useRef, useCallback } from 'react'

interface ErrorToast {
  message: string
  onRetry?: () => void
}

export function useToasts() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [errorToast, setErrorToast] = useState<ErrorToast | null>(null)
  const errorToastTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null)
  const importSuccessTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const refreshMessageTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const showError = useCallback((message: string, onRetry?: () => void) => {
    setErrorToast({ message, onRetry })
    clearTimeout(errorToastTimerRef.current)
    errorToastTimerRef.current = setTimeout(() => setErrorToast(null), onRetry ? 8000 : 4000)
  }, [])

  const clearErrorToast = useCallback(() => setErrorToast(null), [])

  const showImportSuccess = useCallback((message: string) => {
    setImportSuccessMessage(message)
    clearTimeout(importSuccessTimerRef.current)
    importSuccessTimerRef.current = setTimeout(() => setImportSuccessMessage(null), 3000)
  }, [])

  const showRefreshMessage = useCallback((message: string) => {
    setRefreshMessage(message)
    clearTimeout(refreshMessageTimerRef.current)
    refreshMessageTimerRef.current = setTimeout(() => setRefreshMessage(null), 4000)
  }, [])

  const clearRefreshMessage = useCallback(() => setRefreshMessage(null), [])

  return {
    toastMessage,
    showToast,
    errorToast,
    showError,
    clearErrorToast,
    importSuccessMessage,
    showImportSuccess,
    refreshMessage,
    showRefreshMessage,
    clearRefreshMessage,
  }
}
