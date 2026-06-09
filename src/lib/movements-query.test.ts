import { describe, it, expect } from 'vitest'
import {
  movementMatchesSearch,
  parseMovementSearchQuery,
  type MovementSearchContext,
} from '@/lib/movement-search'
import { compareMovements, movementMatchesFilters, sortMovements } from '@/lib/movements-query'
import type { Category, Movement } from '@/types'

const persons: MovementSearchContext['persons'] = {
  myRole: 'personA',
  myName: 'Ana',
  partnerName: 'Bruno',
  personAName: 'Ana',
  personBName: 'Bruno',
}

const categories: Category[] = [
  { id: 'cat-3', name: 'Supermercado', type: 'expense' },
  { id: 'cat-4', name: 'Transporte', type: 'expense' },
]

const searchContext: MovementSearchContext = { categories, persons }

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
  createdAt: '2025-05-15T10:00:00.000Z',
  updatedAt: '2025-05-15T10:00:00.000Z',
}

describe('parseMovementSearchQuery', () => {
  it('parses amount, currency and keyword tokens', () => {
    expect(parseMovementSearchQuery('>10000 usd compartido importado')).toEqual({
      textTerms: [],
      minAmount: 10000,
      minExclusive: true,
      currency: 'USD',
      isShared: true,
      source: 'imported',
    })
  })

  it('parses sin categoria and keeps text terms', () => {
    expect(parseMovementSearchQuery('sin categoria uber')).toEqual({
      textTerms: ['uber'],
      uncategorized: true,
    })
  })
})

describe('movementMatchesSearch', () => {
  it('matches description text case-insensitively', () => {
    expect(movementMatchesSearch(base, 'coto', searchContext)).toBe(true)
    expect(movementMatchesSearch(base, 'uber', searchContext)).toBe(false)
  })

  it('matches category name and payer', () => {
    expect(movementMatchesSearch(base, 'supermercado', searchContext)).toBe(true)
    expect(movementMatchesSearch(base, 'ana', searchContext)).toBe(true)
    expect(movementMatchesSearch(base, 'bruno', searchContext)).toBe(false)
  })

  it('applies keyword and amount filters from query', () => {
    expect(movementMatchesSearch({ ...base, amount: 15000, currency: 'USD' }, '>10000 usd', searchContext)).toBe(
      true,
    )
    expect(movementMatchesSearch({ ...base, amount: 5000, currency: 'USD' }, '>10000 usd', searchContext)).toBe(
      false,
    )
    expect(movementMatchesSearch({ ...base, categoryId: null }, 'sin categoria', searchContext)).toBe(true)
    expect(movementMatchesSearch(base, 'importado', searchContext)).toBe(false)
    expect(movementMatchesSearch({ ...base, source: 'imported' }, 'importado', searchContext)).toBe(true)
  })
})

describe('movementMatchesFilters', () => {
  it('filters by date range', () => {
    expect(movementMatchesFilters(base, { dateFrom: '2025-05-01', dateTo: '2025-05-31' }, searchContext)).toBe(
      true,
    )
    expect(movementMatchesFilters(base, { dateFrom: '2025-06-01' }, searchContext)).toBe(false)
  })

  it('filters by type and source', () => {
    expect(movementMatchesFilters(base, { type: 'expense' }, searchContext)).toBe(true)
    expect(movementMatchesFilters(base, { type: 'income' }, searchContext)).toBe(false)
    expect(movementMatchesFilters(base, { source: 'manual' }, searchContext)).toBe(true)
    expect(movementMatchesFilters(base, { source: 'imported' }, searchContext)).toBe(false)
  })

  it('filters by smart search text case-insensitively', () => {
    expect(movementMatchesFilters(base, { search: 'supermercado' }, searchContext)).toBe(true)
    expect(movementMatchesFilters(base, { search: 'uber' }, searchContext)).toBe(false)
  })

  it('keeps settlements visible when filtering by category', () => {
    expect(
      movementMatchesFilters(
        { ...base, type: 'settlement', categoryId: null },
        { categoryId: 'cat-3' },
        searchContext,
      ),
    ).toBe(true)
    expect(
      movementMatchesFilters({ ...base, categoryId: 'cat-4' }, { categoryId: 'cat-3' }, searchContext),
    ).toBe(false)
  })
})

describe('sortMovements', () => {
  const items: Movement[] = [
    { ...base, id: 'a', amount: 200, description: 'Zeta', date: '2025-05-10', categoryId: 'cat-4' },
    { ...base, id: 'b', amount: 50, description: 'Alpha', date: '2025-05-20', categoryId: 'cat-3' },
  ]

  it('sorts by amount descending', () => {
    const sorted = sortMovements(items, { sortBy: 'amount', sortDir: 'desc' }, categories)
    expect(sorted.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('sorts by category name ascending', () => {
    const sorted = sortMovements(items, { sortBy: 'category', sortDir: 'asc' }, categories)
    expect(sorted.map((m) => m.id)).toEqual(['b', 'a'])
  })

  it('compareMovements uses createdAt as tiebreaker', () => {
    const older = { ...base, id: 'old', createdAt: '2025-05-01T00:00:00.000Z' }
    const newer = { ...base, id: 'new', createdAt: '2025-05-02T00:00:00.000Z' }
    expect(compareMovements(older, newer, 'amount', 'desc', categories)).toBeLessThan(0)
  })
})
