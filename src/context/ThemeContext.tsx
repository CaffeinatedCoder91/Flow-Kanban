// src/context/ThemeContext.tsx
// Manages light / dark / system theme preference.
// Wrap the app in <ThemeContextProvider> and call useTheme() anywhere inside.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import { lightTheme, darkTheme } from '@/styles/themes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode:     ThemeMode
  setMode:  (mode: ThemeMode) => void
  isDark:   boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme-preference'

function getSystemDark(): boolean {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch { /* ignore */ }
    return 'system'
  })

  const [systemDark, setSystemDark] = useState(getSystemDark)

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = mode === 'dark' || (mode === 'system' && systemDark)

  // Apply class to <html> for any CSS that needs it
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const setMode = (next: ThemeMode) => {
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    document.documentElement.classList.add('theme-switching')
    setTimeout(() => document.documentElement.classList.remove('theme-switching'), 300)
    setModeState(next)
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      <EmotionThemeProvider theme={isDark ? darkTheme : lightTheme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeContextProvider>')
  return ctx
}
