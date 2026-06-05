import type { PeriodRange } from '@/components/PeriodFilter'
import { currentMonthRange } from '@/lib/utils'

const STORAGE_KEY = 'finanzas-period'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidPeriod(value: unknown): value is PeriodRange {
  if (!value || typeof value !== 'object') return false
  const { from, to } = value as { from?: unknown; to?: unknown }
  return (
    typeof from === 'string' &&
    typeof to === 'string' &&
    DATE_RE.test(from) &&
    DATE_RE.test(to) &&
    from <= to
  )
}

export function readStoredPeriod(): PeriodRange {
  if (typeof window === 'undefined') return currentMonthRange()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return currentMonthRange()
    const parsed: unknown = JSON.parse(raw)
    if (isValidPeriod(parsed)) return parsed
  } catch {
    // ignore corrupt storage
  }
  return currentMonthRange()
}

export function writeStoredPeriod(period: PeriodRange): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ from: period.from, to: period.to }))
}
