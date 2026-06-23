import { describe, it, expect } from 'vitest'
import {
  movementMatchesSearch,
  parseMovementSearchQuery,
  type MovementSearchContext,
} from '@/lib/movement-search'
import {
  compareMovements,
  movementMatchesFilters,
  MOVEMENTS_PAGE_SIZE,
  sortMovements,
} from '@/lib/movements-query'
import type { Category, Movement } from '@/types'

const persons: MovementSearchContext['persons'] = {
  myRole: 'personA',
  myName: 'Ana',
  partnerName: 'Bruno',
  personAName: 'Ana',
  personBName: 'Bruno',
  hasConfiguredNames: true,
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

  it('excludes settlements when filtering by category', () => {
    expect(
      movementMatchesFilters(
        { ...base, type: 'settlement', categoryId: null },
        { categoryId: 'cat-3' },
        searchContext,
      ),
    ).toBe(false)
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

  it('sorts amounts by the value shown in the active view', () => {
    const mixedCurrencyItems: Movement[] = [
      { ...base, id: 'ars-small', amount: 750, currency: 'ARS' },
      { ...base, id: 'usd-large', amount: 193.27, currency: 'USD' },
    ]

    const sorted = sortMovements(
      mixedCurrencyItems,
      { sortBy: 'amount', sortDir: 'desc' },
      categories,
      {
        ...searchContext,
        amountView: {
          currencyConfig: { displayCurrency: 'ARS', exchangeRateUsd: 1400 },
          expenseViewMode: 'couple',
          personalRole: 'personA',
        },
      },
    )

    expect(sorted.map((m) => m.id)).toEqual(['usd-large', 'ars-small'])
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

function paginateSortedMovements(
  movements: Movement[],
  filters: Parameters<typeof sortMovements>[1],
  page: number,
  pageSize = MOVEMENTS_PAGE_SIZE,
) {
  const sorted = sortMovements(movements, filters, categories)
  const limit = page * pageSize
  return {
    items: sorted.slice(0, limit),
    total: sorted.length,
    page,
    pageSize,
    hasMore: limit < sorted.length,
  }
}

describe('paginated movement sorting', () => {
  const movements: Movement[] = Array.from({ length: 45 }, (_, i) => ({
    ...base,
    id: String(i),
    amount: i + 1,
    date: `2025-05-${String((i % 28) + 1).padStart(2, '0')}`,
  }))

  it('sorts the full result set before paginating', () => {
    const filters = { sortBy: 'amount' as const, sortDir: 'desc' as const }
    const page1 = paginateSortedMovements(movements, filters, 1)
    const page2 = paginateSortedMovements(movements, filters, 2)

    expect(page1.items).toHaveLength(30)
    expect(page1.items[0]?.amount).toBe(45)
    expect(page1.items[29]?.amount).toBe(16)

    expect(page2.items).toHaveLength(45)
    expect(page2.items[0]?.amount).toBe(45)
    expect(page2.items[44]?.amount).toBe(1)
    expect(page2.items.slice(0, 30).map((m) => m.id)).toEqual(page1.items.map((m) => m.id))

    for (let i = 1; i < page2.items.length; i++) {
      expect(page2.items[i - 1]!.amount).toBeGreaterThanOrEqual(page2.items[i]!.amount)
    }
  })
})
