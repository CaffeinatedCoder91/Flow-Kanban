// lib/date.ts
// Date helpers for YYYY-MM-DD strings (local-time safe).

export function parseDateOnly(dateStr: string): Date {
  // Interpret a YYYY-MM-DD string as local midnight to avoid UTC shifts.
  return new Date(`${dateStr}T00:00:00`)
}

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.round(ms / 86400000)
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
