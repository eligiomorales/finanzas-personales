import type { PeriodRange } from '@/components/PeriodFilter'
import { currentMonthRange } from '@/lib/utils'

const STORAGE_KEY = 'finanzas-dashboard-period'
const LEGACY_PERIOD_KEY = 'finanzas-period'
const LEGACY_MOVEMENT_FILTERS_KEY = 'finanzas-movement-filters'

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

function readLegacyPeriod(): PeriodRange | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LEGACY_PERIOD_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isValidPeriod(parsed)) return parsed
  } catch {
    // ignore corrupt storage
  }
  return null
}

function readDatesFromLegacyMovementFilters(): PeriodRange | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LEGACY_MOVEMENT_FILTERS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { dateFrom, dateTo } = parsed as { dateFrom?: unknown; dateTo?: unknown }
    if (typeof dateFrom === 'string' && typeof dateTo === 'string' && DATE_RE.test(dateFrom) && DATE_RE.test(dateTo) && dateFrom <= dateTo) {
      return { from: dateFrom, to: dateTo }
    }
  } catch {
    // ignore corrupt storage
  }
  return null
}

export function readStoredDashboardPeriod(): PeriodRange {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isValidPeriod(parsed)) return parsed
      }
    } catch {
      // ignore corrupt storage
    }
  }

  return readLegacyPeriod() ?? readDatesFromLegacyMovementFilters() ?? currentMonthRange()
}

export function writeStoredDashboardPeriod(period: PeriodRange): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(period))
  window.localStorage.removeItem(LEGACY_PERIOD_KEY)
}
