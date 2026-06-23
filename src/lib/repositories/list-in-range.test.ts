import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { createDexieRepositories, filterAllMovementsInMemory } from '@/lib/repositories/dexie-repositories'
import { movementQueryDateRange } from '@/lib/movement-filters-storage'
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

function movement(id: string, date: string, amount: number): Movement {
  return { ...base, id, date, amount }
}

describe('MovementRepository.listInRange (Dexie)', () => {
  const repos = createDexieRepositories()

  beforeEach(async () => {
    await db.movements.clear()
    await db.movements.bulkAdd([
      movement('m-may', '2025-05-31', 100),
      movement('m-jun-1', '2025-06-01', 200),
      movement('m-jun-15', '2025-06-15', 300),
      movement('m-jun-30', '2025-06-30', 400),
      movement('m-jul', '2025-07-01', 500),
    ])
  })

  afterEach(async () => {
    await db.movements.clear()
  })

  it('returns only movements within the inclusive date range', async () => {
    const items = await repos.movements.listInRange({
      dateFrom: '2025-06-01',
      dateTo: '2025-06-30',
    })

    expect(items.map((m) => m.id)).toEqual(['m-jun-30', 'm-jun-15', 'm-jun-1'])
  })

  it('orders by date descending', async () => {
    const items = await repos.movements.listInRange({
      dateFrom: '2025-05-01',
      dateTo: '2025-07-31',
    })

    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1]!.date >= items[i]!.date).toBe(true)
    }
  })

  it('supports sort-by-amount on the in-range set (pipeline check)', async () => {
    const filters = {
      dateFrom: '2025-06-01',
      dateTo: '2025-06-30',
      sortBy: 'amount' as const,
      sortDir: 'desc' as const,
    }
    const fetchRange = movementQueryDateRange(filters)!
    const inRange = await repos.movements.listInRange(fetchRange)

    const sorted = filterAllMovementsInMemory(inRange, filters)

    expect(sorted.items.map((m) => m.amount)).toEqual([400, 300, 200])
  })
})
