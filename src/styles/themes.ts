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
    backgroundAlt: '#f0f1f5',
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

  semantic: {
    successBg:      '#e6f7ed',
    successBorder:  '#b3e6c8',
    errorBg:        '#fef2f2',
    errorBorder:    '#fecaca',
    errorBgSubtle:  '#fff5f5',
    confirmBg:      '#f0fdf4',
    confirmBorder:  '#bbf7d0',
    confirmText:    '#166534',
    codeBg:         '#f3f4f6',
    spotlightBg:    '#ecfdf5',
    spotlightBorder:'#a7f3d0',
    spotlightLink:  '#059669',
    spotlightHover: '#047857',
  },

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
    primary:       '#a78bfa',
    primaryDark:   '#c4b5fd',
    primaryLight:  '#1e1b4b',
    primaryBorder: '#4c1d95',
    secondary:     '#60a5fa',
    success:       '#34d399',
    successDark:   '#10b981',
    warning:       '#fbbf24',
    warningDark:   '#f59e0b',
    danger:        '#f87171',
    dangerDark:    '#fca5a5',
    background:    '#0f1219',
    backgroundAlt: '#1a1f2e',
    surface:       '#161b26',
    border:        '#2a3040',
    borderSubtle:  '#363d50',
    text:          '#e4e7ec',
    textSecondary: '#9ba3b8',
    textTertiary:  '#636d83',
    textMuted:     '#7a8499',
  },

  status: {
    not_started: '#a78bfa',
    in_progress: '#60a5fa',
    done:        '#34d399',
    stuck:       '#fbbf24',
  } as Record<string, string>,

  priority: {
    low:      { bg: '#172554', text: '#93c5fd' },
    medium:   { bg: '#2a2215', text: '#fcd34d' },
    high:     { bg: '#2d1520', text: '#fca5a5' },
    critical: { bg: '#2d0f1e', text: '#fda4af' },
  } as Record<string, { bg: string; text: string }>,

  dueDateUrgency: {
    overdue:     '#fb923c',
    today:       '#f87171',
    tomorrow:    '#fbbf24',
    soon:        '#facc15',
    'next-week': '#9ba3b8',
    neutral:     '#9ba3b8',
  } as Record<string, string>,

  insightSeverity: {
    low:    { bg: '#161b26', border: '#2a3040' },
    medium: { bg: '#1c1a24', border: '#3a3550' },
    high:   { bg: '#231520', border: '#4a2540' },
  } as Record<string, { bg: string; border: string }>,

  semantic: {
    successBg:      '#0f2918',
    successBorder:  '#1a5c30',
    errorBg:        '#2d0f0f',
    errorBorder:    '#5c1f1f',
    errorBgSubtle:  '#2d0f0f',
    confirmBg:      '#0f2918',
    confirmBorder:  '#1a5c30',
    confirmText:    '#6ee7b7',
    codeBg:         '#1a1f2e',
    spotlightBg:    '#0f2918',
    spotlightBorder:'#1a5c30',
    spotlightLink:  '#34d399',
    spotlightHover: '#6ee7b7',
  },

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.3)',
    sm: '0 1px 4px rgba(0,0,0,0.4)',
    md: '0 4px 12px rgba(0,0,0,0.5)',
    lg: '0 8px 24px rgba(0,0,0,0.6)',
    xl: '0 8px 40px rgba(0,0,0,0.7)',
  },
}
