import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  readStoredMovementFilters,
  readStoredPeriod,
  movementQueryDateRange,
  toPersistedMovementFilters,
  withDefaultPeriod,
  writeStoredMovementFilters,
  writeStoredPeriod,
} from '@/lib/movement-filters-storage'

const STORAGE_KEY = 'finanzas-movement-filters'
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

  it('returns current month when storage is empty', () => {
    const filters = readStoredMovementFilters()
    expect(filters.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(filters.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(filters.dateFrom! <= filters.dateTo!).toBe(true)
  })

  it('persists and reads filters with dates', () => {
    writeStoredMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      categoryId: 'cat-1',
      type: 'expense',
      search: 'super',
      sortBy: 'amount',
      sortDir: 'asc',
    })
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      categoryId: 'cat-1',
      type: 'expense',
      search: 'super',
      sortBy: 'amount',
      sortDir: 'asc',
    })
  })

  it('strips personal view role before writing', () => {
    writeStoredMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      personalViewRole: 'personA',
      paidBy: 'personB',
    })
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      paidBy: 'personB',
    })
    expect(toPersistedMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      personalViewRole: 'personA',
      isShared: true,
    })).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      isShared: true,
    })
  })

  it('always persists at least the current period when clearing list filters', () => {
    writeStoredMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      type: 'income',
    })
    writeStoredMovementFilters({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    })
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    })
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('removes legacy period key when writing unified filters', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-04-01', to: '2026-04-30' }),
    )
    writeStoredMovementFilters({ dateFrom: '2026-05-01', dateTo: '2026-05-31' })
    expect(window.localStorage.getItem(LEGACY_PERIOD_KEY)).toBeNull()
  })

  it('migrates legacy period storage when unified storage is empty', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-05-01', to: '2026-05-31' }),
    )
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    })
  })

  it('migrates legacy list filters without dates using legacy period', () => {
    window.localStorage.setItem(
      LEGACY_PERIOD_KEY,
      JSON.stringify({ from: '2026-05-01', to: '2026-05-31' }),
    )
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ categoryId: 'cat-1', type: 'expense' }))
    expect(readStoredMovementFilters()).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      categoryId: 'cat-1',
      type: 'expense',
    })
  })

  it('ignores corrupt storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(readStoredMovementFilters().dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('ignores invalid filter values', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'invalid' }))
    expect(readStoredMovementFilters().dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(readStoredMovementFilters().type).toBeUndefined()
  })

  it('ignores unknown keys', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categoryId: 'cat-1', personalViewRole: 'personA' }),
    )
    expect(readStoredMovementFilters().categoryId).toBeUndefined()
  })

  it('ignores invalid date values', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dateFrom: 'bad', dateTo: '2026-05-31', type: 'expense' }),
    )
    const filters = readStoredMovementFilters()
    expect(filters.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(filters.type).toBeUndefined()
  })

  it('withDefaultPeriod fills missing dates', () => {
    expect(withDefaultPeriod({ type: 'expense' }).dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('movementQueryDateRange resolves fetch span from filters', () => {
    expect(
      movementQueryDateRange({ dateFrom: '2026-05-01', dateTo: '2026-05-31', sortBy: 'amount', sortDir: 'desc' }),
    ).toEqual({ dateFrom: '2026-05-01', dateTo: '2026-05-31' })

    const range = movementQueryDateRange({ type: 'expense' })
    expect(range.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(range.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(range.dateFrom <= range.dateTo).toBe(true)
  })

  it('readStoredPeriod and writeStoredPeriod remain compatible', () => {
    writeStoredPeriod({ from: '2026-05-01', to: '2026-05-31' })
    expect(readStoredPeriod()).toEqual({ from: '2026-05-01', to: '2026-05-31' })
  })
})
