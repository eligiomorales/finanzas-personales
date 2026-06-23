import type { FilterChip } from '@/components/ui/FilterChips'
import { payerFilterLabel, type CouplePersonsView } from '@/lib/couple/person-labels'
import { formatPeriodRangeLabel } from '@/lib/period-presets'
import { isDefaultMovementSort, movementSortLabel } from '@/lib/movements-query'
import type { Category, MovementFilters } from '@/types'
import { movementTypeLabel } from '@/lib/utils'

export function buildMovementFilterChips(
  filters: MovementFilters,
  options: {
    categories: Category[]
    persons: CouplePersonsView
  },
): FilterChip[] {
  const chips: FilterChip[] = []

  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      id: 'period',
      label: formatPeriodRangeLabel(filters.dateFrom, filters.dateTo),
    })
  }

  if (filters.search?.trim()) {
    chips.push({ id: 'search', label: `Buscar: “${filters.search.trim()}”` })
  }

  if (filters.type) {
    chips.push({ id: 'type', label: movementTypeLabel(filters.type) })
  }

  if (filters.categoryId) {
    const cat = options.categories.find((c) => c.id === filters.categoryId)
    chips.push({ id: 'categoryId', label: cat?.name ?? 'Categoría' })
  }

  if (filters.paidBy) {
    chips.push({
      id: 'paidBy',
      label: `Pagó: ${payerFilterLabel(filters.paidBy, options.persons)}`,
    })
  }

  if (filters.isShared !== undefined) {
    chips.push({
      id: 'isShared',
      label: filters.isShared ? 'Compartido' : 'Personal',
    })
  }

  if (filters.currency) {
    chips.push({ id: 'currency', label: filters.currency })
  }

  if (!isDefaultMovementSort(filters)) {
    chips.push({ id: 'sort', label: `Orden: ${movementSortLabel(filters)}` })
  }

  return chips
}

export function removeMovementFilterChip(
  filters: MovementFilters,
  chipId: string,
): MovementFilters {
  switch (chipId) {
    case 'period':
      return { ...filters, dateFrom: undefined, dateTo: undefined }
    case 'search':
      return { ...filters, search: undefined }
    case 'type':
      return { ...filters, type: undefined }
    case 'categoryId':
      return { ...filters, categoryId: undefined }
    case 'paidBy':
      return { ...filters, paidBy: undefined }
    case 'isShared':
      return { ...filters, isShared: undefined }
    case 'currency':
      return { ...filters, currency: undefined }
    case 'sort':
      return { ...filters, sortBy: undefined, sortDir: undefined }
    default:
      return filters
  }
}

export function defaultMovementFilters(): MovementFilters {
  return {}
}
