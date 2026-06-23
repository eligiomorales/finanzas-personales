import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  movementListFilters,
  readStoredMovementFilters,
  writeStoredMovementFilters,
} from '@/lib/movement-filters-storage'
import type { MovementFilters } from '@/types'

interface MovementFiltersContextValue {
  filters: MovementFilters
  listFilters: MovementFilters
  setFilters: (next: MovementFilters) => void
  patchFilters: (patch: Partial<MovementFilters>) => void
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

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [setFilters])

  const listFilters = useMemo(() => movementListFilters(filters), [filters])

  const value = useMemo(
    () => ({
      filters,
      listFilters,
      setFilters,
      patchFilters,
      clearFilters,
    }),
    [filters, listFilters, setFilters, patchFilters, clearFilters],
  )

  return <MovementFiltersContext.Provider value={value}>{children}</MovementFiltersContext.Provider>
}

export function useMovementFilters() {
  const ctx = useContext(MovementFiltersContext)
  if (!ctx) throw new Error('useMovementFilters debe usarse dentro de MovementFiltersProvider')
  return ctx
}
