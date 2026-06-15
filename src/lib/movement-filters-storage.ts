import type { PeriodRange } from '@/components/PeriodFilter'
import type { MovementDateRange } from '@/lib/repositories/types'
import { currentMonthRange } from '@/lib/utils'
import type {
  CurrencyCode,
  MovementFilters,
  MovementSortDir,
  MovementSortField,
  MovementSource,
  MovementType,
  Payer,
} from '@/types'

const STORAGE_KEY = 'finanzas-movement-filters'
const LEGACY_PERIOD_KEY = 'finanzas-period'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const MOVEMENT_TYPES = new Set<MovementType>(['income', 'expense', 'settlement'])
const PAYERS = new Set<Payer>(['personA', 'personB', 'both'])
const SOURCES = new Set<MovementSource>(['manual', 'imported'])
const CURRENCIES = new Set<CurrencyCode>(['ARS', 'USD'])
const SORT_FIELDS = new Set<MovementSortField>(['date', 'amount', 'description', 'category', 'createdAt'])
const SORT_DIRS = new Set<MovementSortDir>(['asc', 'desc'])

/** Filters persisted across navigation; excludes runtime-only personalViewRole. */
export type PersistedMovementFilters = Omit<MovementFilters, 'personalViewRole'>

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_RE.test(value)
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isValidPeriod(value: unknown): value is PeriodRange {
  if (!value || typeof value !== 'object') return false
  const { from, to } = value as { from?: unknown; to?: unknown }
  return isValidDate(from) && isValidDate(to) && from <= to
}

function isValidPersistedMovementFilters(value: unknown): value is PersistedMovementFilters {
  if (!value || typeof value !== 'object') return false
  const f = value as Record<string, unknown>

  if (f.dateFrom !== undefined && !isValidDate(f.dateFrom)) return false
  if (f.dateTo !== undefined && !isValidDate(f.dateTo)) return false
  if (isValidDate(f.dateFrom) && isValidDate(f.dateTo) && f.dateFrom > f.dateTo) return false
  if (f.categoryId !== undefined && typeof f.categoryId !== 'string') return false
  if (f.type !== undefined && !MOVEMENT_TYPES.has(f.type as MovementType)) return false
  if (f.paidBy !== undefined && !PAYERS.has(f.paidBy as Payer)) return false
  if (f.source !== undefined && !SOURCES.has(f.source as MovementSource)) return false
  if (f.isShared !== undefined && typeof f.isShared !== 'boolean') return false
  if (f.currency !== undefined && !CURRENCIES.has(f.currency as CurrencyCode)) return false
  if (!isOptionalString(f.search)) return false
  if (f.sortBy !== undefined && !SORT_FIELDS.has(f.sortBy as MovementSortField)) return false
  if (f.sortDir !== undefined && !SORT_DIRS.has(f.sortDir as MovementSortDir)) return false

  const allowed = new Set([
    'dateFrom',
    'dateTo',
    'categoryId',
    'type',
    'paidBy',
    'source',
    'isShared',
    'currency',
    'search',
    'sortBy',
    'sortDir',
  ])
  return Object.keys(f).every((key) => allowed.has(key))
}

export function movementListFilters(filters: MovementFilters): MovementFilters {
  const {
    dateFrom: _dateFrom,
    dateTo: _dateTo,
    personalViewRole: _personalViewRole,
    ...list
  } = filters
  return list
}

export function toPersistedMovementFilters(filters: MovementFilters): PersistedMovementFilters {
  const { personalViewRole: _personalViewRole, ...persisted } = filters
  return persisted
}

export function withDefaultPeriod(filters: PersistedMovementFilters): PersistedMovementFilters {
  if (filters.dateFrom && filters.dateTo) return filters
  const month = currentMonthRange()
  return {
    ...filters,
    dateFrom: filters.dateFrom ?? month.from,
    dateTo: filters.dateTo ?? month.to,
  }
}

/** Date span used to fetch movements before in-memory filter/sort (remote list). */
export function movementQueryDateRange(filters: MovementFilters): MovementDateRange {
  const { dateFrom, dateTo } = withDefaultPeriod(toPersistedMovementFilters(filters))
  return { dateFrom: dateFrom!, dateTo: dateTo! }
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

function readRawStoredFilters(): PersistedMovementFilters | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isValidPersistedMovementFilters(parsed)) return parsed
  } catch {
    // ignore corrupt storage
  }
  return null
}

export function readStoredMovementFilters(): PersistedMovementFilters {
  const stored = readRawStoredFilters()
  if (stored) {
    if (stored.dateFrom && stored.dateTo) return stored
    const legacyPeriod = readLegacyPeriod()
    if (legacyPeriod) {
      return { ...stored, dateFrom: legacyPeriod.from, dateTo: legacyPeriod.to }
    }
    return withDefaultPeriod(stored)
  }

  const legacyPeriod = readLegacyPeriod()
  if (legacyPeriod) {
    return { dateFrom: legacyPeriod.from, dateTo: legacyPeriod.to }
  }

  return withDefaultPeriod({})
}

export function writeStoredMovementFilters(filters: MovementFilters): void {
  if (typeof window === 'undefined') return
  const persisted = withDefaultPeriod(toPersistedMovementFilters(filters))
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  window.localStorage.removeItem(LEGACY_PERIOD_KEY)
}

/** @deprecated Use readStoredMovementFilters(). Kept for migration tests. */
export function readStoredPeriod(): PeriodRange {
  const { dateFrom, dateTo } = readStoredMovementFilters()
  return { from: dateFrom!, to: dateTo! }
}

/** @deprecated Use writeStoredMovementFilters(). Kept for migration tests. */
export function writeStoredPeriod(period: PeriodRange): void {
  writeStoredMovementFilters({ dateFrom: period.from, dateTo: period.to })
}
