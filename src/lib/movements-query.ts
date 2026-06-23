import { db } from '@/db/database'
import { getDisplayAmountForView, movementVisibleInPersonalView } from '@/lib/balance'
import { movementMatchesSearch, type MovementSearchContext } from '@/lib/movement-search'
import type { Category, Movement, MovementFilters, MovementSortDir, MovementSortField } from '@/types'

export const MOVEMENTS_PAGE_SIZE = 30
export const MOVEMENTS_INITIAL_VISIBLE = MOVEMENTS_PAGE_SIZE

export const DEFAULT_MOVEMENT_SORT: { sortBy: MovementSortField; sortDir: MovementSortDir } = {
  sortBy: 'date',
  sortDir: 'desc',
}

export function resolveMovementSort(filters: MovementFilters): {
  sortBy: MovementSortField
  sortDir: MovementSortDir
} {
  return {
    sortBy: filters.sortBy ?? DEFAULT_MOVEMENT_SORT.sortBy,
    sortDir: filters.sortDir ?? DEFAULT_MOVEMENT_SORT.sortDir,
  }
}

export function isDefaultMovementSort(filters: MovementFilters): boolean {
  const { sortBy, sortDir } = resolveMovementSort(filters)
  return sortBy === DEFAULT_MOVEMENT_SORT.sortBy && sortDir === DEFAULT_MOVEMENT_SORT.sortDir
}

function categoryNameById(categories: Category[]): Map<string, string> {
  return new Map(categories.map((c) => [c.id, c.name]))
}

export function compareMovements(
  a: Movement,
  b: Movement,
  sortBy: MovementSortField,
  sortDir: MovementSortDir,
  categories: Category[],
  searchContext?: MovementSearchContext,
): number {
  const names = categoryNameById(categories)
  let cmp = 0

  switch (sortBy) {
    case 'date':
      cmp = a.date.localeCompare(b.date)
      break
    case 'amount': {
      const amountView = searchContext?.amountView
      const amountA = amountView
        ? getDisplayAmountForView(
            a,
            amountView.personalRole,
            amountView.currencyConfig,
            amountView.expenseViewMode,
          )
        : a.amount
      const amountB = amountView
        ? getDisplayAmountForView(
            b,
            amountView.personalRole,
            amountView.currencyConfig,
            amountView.expenseViewMode,
          )
        : b.amount
      cmp = amountA - amountB
      break
    }
    case 'description':
      cmp = a.description.localeCompare(b.description, 'es')
      break
    case 'category': {
      const an = a.categoryId ? (names.get(a.categoryId) ?? '') : ''
      const bn = b.categoryId ? (names.get(b.categoryId) ?? '') : ''
      cmp = an.localeCompare(bn, 'es')
      break
    }
    case 'createdAt':
      cmp = a.createdAt.localeCompare(b.createdAt)
      break
  }

  if (cmp === 0) cmp = b.createdAt.localeCompare(a.createdAt)
  return sortDir === 'asc' ? cmp : -cmp
}

export function sortMovements(
  movements: Movement[],
  filters: MovementFilters,
  categories: Category[] = [],
  searchContext?: MovementSearchContext,
): Movement[] {
  const { sortBy, sortDir } = resolveMovementSort(filters)
  return [...movements].sort((a, b) => compareMovements(a, b, sortBy, sortDir, categories, searchContext))
}

export function movementMatchesFilters(
  m: Movement,
  filters: MovementFilters,
  searchContext?: MovementSearchContext,
): boolean {
  if (filters.dateFrom && m.date < filters.dateFrom) return false
  if (filters.dateTo && m.date > filters.dateTo) return false
  if (filters.categoryId) {
    if (m.type === 'settlement') return false
    if (m.categoryId !== filters.categoryId) return false
  }
  if (filters.type && m.type !== filters.type) return false
  if (filters.paidBy && m.paidBy !== filters.paidBy) return false
  if (filters.source && m.source !== filters.source) return false
  if (filters.isShared !== undefined && m.isShared !== filters.isShared) return false
  if (filters.currency && m.currency !== filters.currency) return false
  if (filters.search && !movementMatchesSearch(m, filters.search, searchContext)) return false
  if (filters.personalViewRole && !movementVisibleInPersonalView(m, filters.personalViewRole)) {
    return false
  }
  return true
}

function filterCallback(filters: MovementFilters, searchContext?: MovementSearchContext) {
  return (m: Movement) => movementMatchesFilters(m, filters, searchContext)
}

/** Pick the most selective Dexie index, then apply remaining filters in memory. */
export function buildMovementsCollection(filters: MovementFilters, searchContext?: MovementSearchContext) {
  const matches = filterCallback(filters, searchContext)

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ?? ''
    const to = filters.dateTo ?? '\uffff'
    const { dateFrom: _from, dateTo: _to, ...rest } = filters
    return db.movements
      .where('date')
      .between(from, to, true, true)
      .filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.type) {
    const { type: _type, ...rest } = filters
    return db.movements.where('type').equals(filters.type).filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.source) {
    const { source: _source, ...rest } = filters
    return db.movements
      .where('source')
      .equals(filters.source)
      .filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.categoryId) {
    const { categoryId: _categoryId, ...rest } = filters
    return db.movements
      .where('categoryId')
      .equals(filters.categoryId)
      .filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.paidBy) {
    const { paidBy: _paidBy, ...rest } = filters
    return db.movements
      .where('paidBy')
      .equals(filters.paidBy)
      .filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.isShared !== undefined) {
    const isShared = filters.isShared
    const { isShared: _isShared, ...rest } = filters
    return db.movements.filter((m) => m.isShared === isShared && movementMatchesFilters(m, rest, searchContext))
  }

  if (filters.currency) {
    const { currency: _currency, ...rest } = filters
    return db.movements
      .where('currency')
      .equals(filters.currency)
      .filter((m) => movementMatchesFilters(m, rest, searchContext))
  }

  return db.movements.filter(matches)
}

function usesDexieDateOrder(filters: MovementFilters): boolean {
  const { sortBy, sortDir } = resolveMovementSort(filters)
  return sortBy === 'date' && sortDir === 'desc'
}

export async function queryMovementsPage(
  filters: MovementFilters,
  page: number,
  pageSize = MOVEMENTS_PAGE_SIZE,
  searchContext?: MovementSearchContext,
) {
  const collection = buildMovementsCollection(filters, searchContext)
  const categories = searchContext?.categories ?? []
  const total = await collection.count()

  if (usesDexieDateOrder(filters)) {
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

  const all = await collection.toArray()
  const sorted = sortMovements(all, filters, categories, searchContext)
  const offset = Math.max(0, (page - 1) * pageSize)
  const items = sorted.slice(offset, offset + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  }
}

export interface MovementsFilteredResult {
  items: Movement[]
  total: number
}

/** Returns all movements matching filters, sorted globally. Pagination is a UI concern. */
export async function queryFilteredMovements(
  filters: MovementFilters,
  searchContext?: MovementSearchContext,
): Promise<MovementsFilteredResult> {
  const collection = buildMovementsCollection(filters, searchContext)
  const categories = searchContext?.categories ?? []

  if (usesDexieDateOrder(filters)) {
    const items = await collection.reverse().toArray()
    return { items, total: items.length }
  }

  const all = await collection.toArray()
  const items = sortMovements(all, filters, categories, searchContext)
  return { items, total: items.length }
}

/** Loads all items up to the given page (for incremental "load more" UX). */
export async function queryMovementsUpToPage(
  filters: MovementFilters,
  page: number,
  pageSize = MOVEMENTS_PAGE_SIZE,
  searchContext?: MovementSearchContext,
) {
  const collection = buildMovementsCollection(filters, searchContext)
  const categories = searchContext?.categories ?? []
  const total = await collection.count()
  const limit = page * pageSize

  if (usesDexieDateOrder(filters)) {
    const items = await collection.reverse().limit(limit).toArray()
    return {
      items,
      total,
      page,
      pageSize,
      hasMore: items.length < total,
    }
  }

  const all = await collection.toArray()
  const sorted = sortMovements(all, filters, categories, searchContext)
  const items = sorted.slice(0, limit)

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

export const MOVEMENT_SORT_OPTIONS: { value: string; label: string; sortBy: MovementSortField; sortDir: MovementSortDir }[] = [
  { value: 'date:desc', label: 'Fecha (reciente)', sortBy: 'date', sortDir: 'desc' },
  { value: 'date:asc', label: 'Fecha (antigua)', sortBy: 'date', sortDir: 'asc' },
  { value: 'amount:desc', label: 'Monto (mayor)', sortBy: 'amount', sortDir: 'desc' },
  { value: 'amount:asc', label: 'Monto (menor)', sortBy: 'amount', sortDir: 'asc' },
  { value: 'description:asc', label: 'Descripción (A–Z)', sortBy: 'description', sortDir: 'asc' },
  { value: 'description:desc', label: 'Descripción (Z–A)', sortBy: 'description', sortDir: 'desc' },
  { value: 'category:asc', label: 'Categoría (A–Z)', sortBy: 'category', sortDir: 'asc' },
  { value: 'category:desc', label: 'Categoría (Z–A)', sortBy: 'category', sortDir: 'desc' },
  { value: 'createdAt:desc', label: 'Creación (reciente)', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAt:asc', label: 'Creación (antigua)', sortBy: 'createdAt', sortDir: 'asc' },
]

export function movementSortOptionValue(filters: MovementFilters): string {
  const { sortBy, sortDir } = resolveMovementSort(filters)
  return `${sortBy}:${sortDir}`
}

export function movementSortLabel(filters: MovementFilters): string {
  const value = movementSortOptionValue(filters)
  return MOVEMENT_SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Fecha (reciente)'
}

export function parseMovementSortOptionValue(value: string): {
  sortBy: MovementSortField
  sortDir: MovementSortDir
} | undefined {
  const option = MOVEMENT_SORT_OPTIONS.find((o) => o.value === value)
  if (!option) return undefined
  return { sortBy: option.sortBy, sortDir: option.sortDir }
}
