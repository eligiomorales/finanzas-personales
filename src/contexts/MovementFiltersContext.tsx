import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { PeriodRange } from '@/components/PeriodFilter'
import {
  movementListFilters,
  readStoredMovementFilters,
  writeStoredMovementFilters,
} from '@/lib/movement-filters-storage'
import { currentMonthRange } from '@/lib/utils'
import type { MovementFilters } from '@/types'

interface MovementFiltersContextValue {
  /** All persisted filters, including dateFrom/dateTo. */
  filters: MovementFilters
  /** List filters only (no dates or personalViewRole). */
  listFilters: MovementFilters
  setFilters: (next: MovementFilters) => void
  patchFilters: (patch: Partial<MovementFilters>) => void
  period: PeriodRange
  setPeriod: (period: PeriodRange) => void
  clearFilters: () => void
}

const MovementFiltersContext = createContext<MovementFiltersContextValue | null>(null)

export function MovementFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<MovementFilters>(() => readStoredMovementFilters())

  const setFilters = useCallback((next: MovementFilters) => {
    setFiltersState(next)
    writeStoredMovementFilters(next)
  }, [])

  const patchFilters = useCallback((patch: Partial<MovementFilters>) => {
    setFiltersState((current) => {
      const next = { ...current, ...patch }
      writeStoredMovementFilters(next)
      return next
    })
  }, [])

  const period = useMemo(
    () => ({
      from: filters.dateFrom ?? currentMonthRange().from,
      to: filters.dateTo ?? currentMonthRange().to,
    }),
    [filters.dateFrom, filters.dateTo],
  )

  const setPeriod = useCallback(
    (next: PeriodRange) => {
      patchFilters({ dateFrom: next.from, dateTo: next.to })
    },
    [patchFilters],
  )

  const clearFilters = useCallback(() => {
    const month = currentMonthRange()
    setFilters({ dateFrom: month.from, dateTo: month.to })
  }, [setFilters])

  const listFilters = useMemo(() => movementListFilters(filters), [filters])

  const value = useMemo(
    () => ({
      filters,
      listFilters,
      setFilters,
      patchFilters,
      period,
      setPeriod,
      clearFilters,
    }),
    [filters, listFilters, setFilters, patchFilters, period, setPeriod, clearFilters],
  )

  return <MovementFiltersContext.Provider value={value}>{children}</MovementFiltersContext.Provider>
}

export function useMovementFilters() {
  const ctx = useContext(MovementFiltersContext)
  if (!ctx) throw new Error('useMovementFilters debe usarse dentro de MovementFiltersProvider')
  return ctx
}

/** Period-only API for dashboard and analysis screens. */
export function usePeriod() {
  const { period, setPeriod } = useMovementFilters()
  return { period, setPeriod }
}
