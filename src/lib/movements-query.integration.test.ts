import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { filterAllMovementsInMemory } from '@/lib/repositories/dexie-repositories'
import { queryFilteredMovements, queryMovementsUpToPage } from '@/lib/movements-query'
import type { Movement } from '@/types'

const base: Omit<Movement, 'id' | 'amount' | 'date'> = {
  type: 'expense',
  currency: 'ARS',
  description: 'Test',
  categoryId: 'cat-1',
  paidBy: 'personA',
  sharePersonA: 50,
  sharePersonB: 50,
  isShared: false,
  source: 'manual',
  createdAt: '2025-06-01T10:00:00.000Z',
  updatedAt: '2025-06-01T10:00:00.000Z',
}

function makeMovements(count: number): Movement[] {
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    id: `m-${i}`,
    amount: (i + 1) * 100,
    date: `2025-06-${String((i % 28) + 1).padStart(2, '0')}`,
  }))
}

const periodFilters = {
  dateFrom: '2025-06-01',
  dateTo: '2025-06-30',
  sortBy: 'amount' as const,
  sortDir: 'desc' as const,
}

function expectSortedByAmountDesc(items: Movement[]) {
  for (let i = 1; i < items.length; i++) {
    expect(items[i - 1]!.amount).toBeGreaterThanOrEqual(items[i]!.amount)
  }
}

describe('queryMovementsUpToPage integration', () => {
  beforeEach(async () => {
    await db.movements.clear()
    await db.movements.bulkAdd(makeMovements(45))
  })

  afterEach(async () => {
    await db.movements.clear()
  })

  it('returns globally sorted items across pages (Dexie)', async () => {
    const page1 = await queryMovementsUpToPage(periodFilters, 1)
    const page2 = await queryMovementsUpToPage(periodFilters, 2)

    expect(page1.items).toHaveLength(30)
    expect(page1.items[0]?.amount).toBe(4500)
    expect(page2.items).toHaveLength(45)
    expect(page2.items[0]?.amount).toBe(4500)
    expect(page2.items[44]?.amount).toBe(100)
    expect(page2.items.slice(0, 30).map((m) => m.id)).toEqual(page1.items.map((m) => m.id))
    expectSortedByAmountDesc(page2.items)
  })

  it('returns the full globally sorted list (Dexie)', async () => {
    const result = await queryFilteredMovements(periodFilters)
    expect(result.items).toHaveLength(45)
    expect(result.items[0]?.amount).toBe(4500)
    expect(result.items[44]?.amount).toBe(100)
    expectSortedByAmountDesc(result.items)
  })

  it('returns the full globally sorted list (in-memory path)', () => {
    const movements = makeMovements(45)
    const result = filterAllMovementsInMemory(movements, periodFilters)

    expect(result.items).toHaveLength(45)
    expectSortedByAmountDesc(result.items)
    expect(result.items.slice(0, 30).map((m) => m.id)).toEqual(
      result.items.slice(0, 30).map((m) => m.id),
    )
  })
})
