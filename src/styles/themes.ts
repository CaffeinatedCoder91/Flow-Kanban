// src/styles/themes.ts
// Light and dark theme definitions.
// Both conform to AppTheme so all existing styled components work unchanged.

import type { AppTheme } from '@/theme'

const shared = {
  spacing: {
    1: '4px', 2: '8px',  3: '12px', 4: '16px', 5: '20px',
    6: '24px', 7: '28px', 8: '32px', 10: '40px', 12: '48px',
  } as Record<number, string>,

  typography: {
    fontFamily:     '"Figtree", system-ui, -apple-system, sans-serif',
    fontFamilyMono: '"Monaco", "Menlo", "Courier New", monospace',
    fontSize: {
      xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem',
    },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight:  { tight: 1.3, normal: 1.5, relaxed: 1.6 },
  },

  borderRadius: {
    sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px',
  },

  zIndex: {
    overlay: 999, panel: 1000, modal: 1100, toast: 2000,
  },
} as const

export const lightTheme: AppTheme = {
  ...shared,

  colors: {
    primary:       '#8B5CF6',
    primaryDark:   '#7C3AED',
    primaryLight:  '#f0edff',
    primaryBorder: '#d4ccf7',
    secondary:     '#3B82F6',
    success:       '#10B981',
    successDark:   '#059669',
    warning:       '#F59E0B',
    warningDark:   '#D97706',
    danger:        '#EF4444',
    dangerDark:    '#dc2626',
    background:    '#f6f7fb',
    surface:       '#ffffff',
    border:        '#e6e9ef',
    borderSubtle:  '#d0d4e4',
    text:          '#323338',
    textSecondary: '#676879',
    textTertiary:  '#9ca3af',
    textMuted:     '#6b7280',
  },

  status: {
    not_started: '#8B5CF6',
    in_progress: '#3B82F6',
    done:        '#10B981',
    stuck:       '#F59E0B',
  } as Record<string, string>,

  priority: {
    low:      { bg: '#cce5ff', text: '#0073ea' },
    medium:   { bg: '#fdebcc', text: '#b86e00' },
    high:     { bg: '#ffeedd', text: '#d83a52' },
    critical: { bg: '#ffd6d9', text: '#b91c1c' },
  } as Record<string, { bg: string; text: string }>,

  dueDateUrgency: {
    overdue:     '#f97316',
    today:       '#ef4444',
    tomorrow:    '#d97706',
    soon:        '#ca8a04',
    'next-week': '#6b7280',
    neutral:     '#6b7280',
  } as Record<string, string>,

  insightSeverity: {
    low:    { bg: '#fef9ec', border: '#f5e6b8' },
    medium: { bg: '#fff4e6', border: '#f5d0a9' },
    high:   { bg: '#fef2f2', border: '#fecaca' },
  } as Record<string, { bg: string; border: string }>,

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 1px 4px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
    xl: '0 8px 40px rgba(0,0,0,0.18)',
  },
}

export const darkTheme: AppTheme = {
  ...shared,

  colors: {
    primary:       '#818cf8',
    primaryDark:   '#a5b4fc',
    primaryLight:  '#1e1f4a',
    primaryBorder: '#3730a3',
    secondary:     '#60a5fa',
    success:       '#34d399',
    successDark:   '#10b981',
    warning:       '#fbbf24',
    warningDark:   '#f59e0b',
    danger:        '#f87171',
    dangerDark:    '#ef4444',
    background:    '#0a0e27',
    surface:       '#141b3a',
    border:        '#1e2847',
    borderSubtle:  '#2a3658',
    text:          '#e8eaf0',
    textSecondary: '#8890b0',
    textTertiary:  '#545e80',
    textMuted:     '#6b7280',
  },

  status: {
    not_started: '#818cf8',
    in_progress: '#60a5fa',
    done:        '#34d399',
    stuck:       '#fbbf24',
  } as Record<string, string>,

  priority: {
    low:      { bg: '#1e3a5f', text: '#60a5fa' },
    medium:   { bg: '#3d2a00', text: '#fbbf24' },
    high:     { bg: '#3d1a1a', text: '#f87171' },
    critical: { bg: '#450a0a', text: '#fca5a5' },
  } as Record<string, { bg: string; text: string }>,

  dueDateUrgency: {
    overdue:     '#fb923c',
    today:       '#f87171',
    tomorrow:    '#fbbf24',
    soon:        '#facc15',
    'next-week': '#8890b0',
    neutral:     '#8890b0',
  } as Record<string, string>,

  insightSeverity: {
    low:    { bg: '#1a1f00', border: '#3a3800' },
    medium: { bg: '#1f1400', border: '#3d2800' },
    high:   { bg: '#1f0a0a', border: '#3d1414' },
  } as Record<string, { bg: string; border: string }>,

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.3)',
    sm: '0 1px 4px rgba(0,0,0,0.4)',
    md: '0 4px 12px rgba(0,0,0,0.5)',
    lg: '0 8px 24px rgba(0,0,0,0.6)',
    xl: '0 8px 40px rgba(0,0,0,0.7)',
  },
}
