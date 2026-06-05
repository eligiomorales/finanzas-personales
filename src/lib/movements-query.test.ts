import { describe, it, expect } from 'vitest'
import { movementMatchesFilters } from '@/lib/movements-query'
import type { Movement } from '@/types'

const base: Movement = {
  id: '1',
  type: 'expense',
  amount: 100,
  currency: 'ARS',
  date: '2025-05-15',
  description: 'Supermercado Coto',
  categoryId: 'cat-3',
  paidBy: 'personA',
  sharePersonA: 50,
  sharePersonB: 50,
  isShared: true,
  source: 'manual',
  createdAt: '2025-05-15',
  updatedAt: '2025-05-15',
}

describe('movementMatchesFilters', () => {
  it('filters by date range', () => {
    expect(movementMatchesFilters(base, { dateFrom: '2025-05-01', dateTo: '2025-05-31' })).toBe(true)
    expect(movementMatchesFilters(base, { dateFrom: '2025-06-01' })).toBe(false)
  })

  it('filters by type and source', () => {
    expect(movementMatchesFilters(base, { type: 'expense' })).toBe(true)
    expect(movementMatchesFilters(base, { type: 'income' })).toBe(false)
    expect(movementMatchesFilters(base, { source: 'manual' })).toBe(true)
    expect(movementMatchesFilters(base, { source: 'imported' })).toBe(false)
  })

  it('filters by search text case-insensitively', () => {
    expect(movementMatchesFilters(base, { search: 'coto' })).toBe(true)
    expect(movementMatchesFilters(base, { search: 'uber' })).toBe(false)
  })

  it('keeps settlements visible when filtering by category', () => {
    expect(
      movementMatchesFilters({ ...base, type: 'settlement', categoryId: null }, { categoryId: 'cat-3' }),
    ).toBe(true)
    expect(movementMatchesFilters({ ...base, categoryId: 'cat-4' }, { categoryId: 'cat-3' })).toBe(false)
  })
})
