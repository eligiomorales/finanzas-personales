import { db } from '@/db/database'
import { movementVisibleInPersonalView } from '@/lib/balance'
import type { Movement, MovementFilters } from '@/types'

export const MOVEMENTS_PAGE_SIZE = 30

export function movementMatchesFilters(m: Movement, filters: MovementFilters): boolean {
  if (filters.dateFrom && m.date < filters.dateFrom) return false
  if (filters.dateTo && m.date > filters.dateTo) return false
  if (filters.categoryId && m.type !== 'settlement' && m.categoryId !== filters.categoryId) return false
  if (filters.type && m.type !== filters.type) return false
  if (filters.paidBy && m.paidBy !== filters.paidBy) return false
  if (filters.source && m.source !== filters.source) return false
  if (filters.isShared !== undefined && m.isShared !== filters.isShared) return false
  if (filters.currency && m.currency !== filters.currency) return false
  if (filters.search) {
    const q = filters.search.toLowerCase()
    if (!m.description.toLowerCase().includes(q)) return false
  }
  if (filters.personalViewRole && !movementVisibleInPersonalView(m, filters.personalViewRole)) {
    return false
  }
  return true
}

/** Pick the most selective Dexie index, then apply remaining filters in memory. */
export function buildMovementsCollection(filters: MovementFilters) {
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ?? ''
    const to = filters.dateTo ?? '\uffff'
    const { dateFrom: _from, dateTo: _to, ...rest } = filters
    return db.movements
      .where('date')
      .between(from, to, true, true)
      .filter((m) => movementMatchesFilters(m, rest))
  }

  if (filters.type) {
    const { type: _type, ...rest } = filters
    return db.movements.where('type').equals(filters.type).filter((m) => movementMatchesFilters(m, rest))
  }

  if (filters.source) {
    const { source: _source, ...rest } = filters
    return db.movements
      .where('source')
      .equals(filters.source)
      .filter((m) => movementMatchesFilters(m, rest))
  }

  if (filters.categoryId) {
    const { categoryId: _categoryId, ...rest } = filters
    return db.movements
      .where('categoryId')
      .equals(filters.categoryId)
      .filter((m) => movementMatchesFilters(m, rest))
  }

  if (filters.paidBy) {
    const { paidBy: _paidBy, ...rest } = filters
    return db.movements
      .where('paidBy')
      .equals(filters.paidBy)
      .filter((m) => movementMatchesFilters(m, rest))
  }

  if (filters.isShared !== undefined) {
    const isShared = filters.isShared
    const { isShared: _isShared, ...rest } = filters
    return db.movements.filter((m) => m.isShared === isShared && movementMatchesFilters(m, rest))
  }

  if (filters.currency) {
    const { currency: _currency, ...rest } = filters
    return db.movements
      .where('currency')
      .equals(filters.currency)
      .filter((m) => movementMatchesFilters(m, rest))
  }

  return db.movements.filter((m) => movementMatchesFilters(m, filters))
}

export async function queryMovementsPage(
  filters: MovementFilters,
  page: number,
  pageSize = MOVEMENTS_PAGE_SIZE,
) {
  const collection = buildMovementsCollection(filters)
  const total = await collection.count()
  const offset = Math.max(0, (page - 1) * pageSize)
  const items = await collection.reverse().offset(offset).limit(pageSize).toArray()

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  }
}

/** Loads all items up to the given page (for incremental "load more" UX). */
export async function queryMovementsUpToPage(
  filters: MovementFilters,
  page: number,
  pageSize = MOVEMENTS_PAGE_SIZE,
) {
  const collection = buildMovementsCollection(filters)
  const total = await collection.count()
  const limit = page * pageSize
  const items = await collection.reverse().limit(limit).toArray()

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: items.length < total,
  }
}

export function serializeMovementFilters(filters: MovementFilters): string {
  return JSON.stringify(filters)
}
