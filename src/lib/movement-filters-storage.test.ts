import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  hasMovementDateFilter,
  movementQueryDateRange,
  readStoredMovementFilters,
  toPersistedMovementFilters,
  writeStoredMovementFilters,
} from '@/lib/movement-filters-storage'
import {
  readStoredDashboardPeriod,
  writeStoredDashboardPeriod,
} from '@/lib/dashboard-period-storage'

const MOVEMENT_FILTERS_KEY = 'finanzas-movement-filters-v2'
// Legacy key used by migration tests (dashboard-period-storage reads from it)
const LEGACY_MOVEMENT_FILTERS_KEY = 'finanzas-movement-filters'
const DASHBOARD_PERIOD_KEY = 'finanzas-dashboard-period'
const LEGACY_PERIOD_KEY = 'finanzas-period'

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }
}

describe('movement filters storage', () => {
  beforeEach(() => {
    const storage = createStorageMock()
    vi.stubGlobal('window', { localStorage: storage })
  })

  it('returns empty filters when storage is empty', () => {
    expect(readStoredMovementFilters()).toEqual({})
  })

  it('persists and reads filters without forcing dates', () => {
    writeStoredMovementFilters({
      categoryId: 'cat-1',
      type: 'expense',
      search: 'super',
      sortBy: 'amount',
      sortDir: 'asc',
    })
    expect(readStoredMovementFilters()).toEqual({
      categoryId: 'cat-1',
      type: 'expense',
      search: 'super',
      sortBy: 'amount',
      sortDir: 'asc',
    })
  })

  it('persists optional date filters', () => {
    writeStoredMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      type: 'expense',
    })
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      type: 'expense',
    })
  })

  it('strips personal view role before writing', () => {
    writeStoredMovementFilters({
      personalViewRole: 'personA',
      paidBy: 'personB',
    })
    expect(readStoredMovementFilters()).toEqual({ paidBy: 'personB' })
    expect(
      toPersistedMovementFilters({
        personalViewRole: 'personA',
        isShared: true,
      }),
    ).toEqual({ isShared: true })
  })

  it('does not migrate legacy period into movement filters', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-05-01', to: '2026-05-31' }),
    )
    expect(readStoredMovementFilters()).toEqual({})
  })

  it('ignores corrupt storage', () => {
    window.localStorage.setItem(MOVEMENT_FILTERS_KEY, '{not json')
    expect(readStoredMovementFilters()).toEqual({})
  })

  it('ignores invalid filter values', () => {
    window.localStorage.setItem(MOVEMENT_FILTERS_KEY, JSON.stringify({ type: 'invalid' }))
    expect(readStoredMovementFilters()).toEqual({})
  })

  it('ignores unknown keys', () => {
    window.localStorage.setItem(
      MOVEMENT_FILTERS_KEY,
      JSON.stringify({ categoryId: 'cat-1', personalViewRole: 'personA' }),
    )
    expect(readStoredMovementFilters().categoryId).toBeUndefined()
  })

  it('ignores invalid date values', () => {
    window.localStorage.setItem(
      MOVEMENT_FILTERS_KEY,
      JSON.stringify({ dateFrom: 'bad', dateTo: '2026-05-31', type: 'expense' }),
    )
    expect(readStoredMovementFilters()).toEqual({})
  })

  it('hasMovementDateFilter detects optional dates', () => {
    expect(hasMovementDateFilter({})).toBe(false)
    expect(hasMovementDateFilter({ dateFrom: '2026-05-01' })).toBe(true)
    expect(hasMovementDateFilter({ dateTo: '2026-05-31' })).toBe(true)
  })

  it('movementQueryDateRange returns null without dates', () => {
    expect(movementQueryDateRange({ type: 'expense' })).toBeNull()
  })

  it('movementQueryDateRange resolves fetch span when dates are set', () => {
    expect(
      movementQueryDateRange({ dateFrom: '2026-05-01', dateTo: '2026-05-31', sortBy: 'amount', sortDir: 'desc' }),
    ).toEqual({ dateFrom: '2026-05-01', dateTo: '2026-05-31' })
  })
})

describe('dashboard period storage', () => {
  beforeEach(() => {
    const storage = createStorageMock()
    vi.stubGlobal('window', { localStorage: storage })
  })

  it('returns current month when storage is empty', () => {
    const period = readStoredDashboardPeriod()
    expect(period.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(period.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(period.from <= period.to).toBe(true)
  })

  it('persists dashboard period separately from movement filters', () => {
    writeStoredDashboardPeriod({ from: '2026-05-01', to: '2026-05-31' })
    writeStoredMovementFilters({ type: 'expense' })
    expect(readStoredDashboardPeriod()).toEqual({ from: '2026-05-01', to: '2026-05-31' })
    expect(readStoredMovementFilters()).toEqual({ type: 'expense' })
  })

  it('migrates legacy period key', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-05-01', to: '2026-05-31' }),
    )
    expect(readStoredDashboardPeriod()).toEqual({ from: '2026-05-01', to: '2026-05-31' })
  })

  it('migrates dates from legacy movement filters when dashboard period is empty', () => {
    window.localStorage.setItem(
      LEGACY_MOVEMENT_FILTERS_KEY,
      JSON.stringify({ dateFrom: '2026-04-01', dateTo: '2026-04-30', type: 'expense' }),
    )
    expect(readStoredDashboardPeriod()).toEqual({ from: '2026-04-01', to: '2026-04-30' })
  })

  it('removes legacy period key when writing dashboard period', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-04-01', to: '2026-04-30' }),
    )
    writeStoredDashboardPeriod({ from: '2026-05-01', to: '2026-05-31' })
    expect(window.localStorage.getItem(LEGACY_PERIOD_KEY)).toBeNull()
    expect(window.localStorage.getItem(DASHBOARD_PERIOD_KEY)).not.toBeNull()
  })
})
