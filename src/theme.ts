export const theme = {
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

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 1px 4px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
    xl: '0 8px 40px rgba(0,0,0,0.18)',
  },

  borderRadius: {
    sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px',
  },

  zIndex: {
    overlay: 999, panel: 1000, modal: 1100, toast: 2000,
  },
} as const

export type AppTheme = typeof theme

declare module '@emotion/react' {
  export interface Theme extends AppTheme {}
}
