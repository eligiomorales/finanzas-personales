import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFilteredMovements, useCategories, useSettings } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { useMovementFilters } from '@/contexts/MovementFiltersContext'
import { currentMonthRange } from '@/lib/utils'
import { buildMovementFilterChips, removeMovementFilterChip } from '@/lib/movement-filter-chips'
import { groupMovementsByDate } from '@/lib/movements-grouping'
import { MovementFilterToolbar } from '@/components/MovementFilterToolbar'
import { payerListLabel } from '@/lib/couple/person-labels'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatMovementAmountLinesForView, getCurrencyConfig } from '@/lib/currency'
import { MOVEMENTS_PAGE_SIZE } from '@/lib/movements-query'
import { EmptyState } from '@/components/ui/Card'
import { MovementRow } from '@/components/ui/MovementRow'
import { SkeletonList } from '@/components/skeletons/SkeletonList'
import { Button, LiveRegion } from '@/components/ui/Form'
import type { MovementFilters } from '@/types'

export function MovementsPage() {
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal, mode: expenseViewMode } = useExpenseViewMode()
  const { filters, listFilters, setFilters, setPeriod, clearFilters } = useMovementFilters()
  const [visibleCount, setVisibleCount] = useState(MOVEMENTS_PAGE_SIZE)
  const myRole = persons.myRole ?? 'personA'

  const effectiveFilters = useMemo(
    () =>
      isPersonal
        ? { ...filters, personalViewRole: myRole }
        : filters,
    [filters, isPersonal, myRole],
  )

  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])

  const searchContext = useMemo(
    () => ({
      categories,
      persons,
      amountView: {
        currencyConfig,
        expenseViewMode,
        personalRole: myRole,
      },
    }),
    [categories, persons, currencyConfig, expenseViewMode, myRole],
  )

  const { query, queryKey, isLoading: isRemoteLoading, isError, error } = useFilteredMovements(
    effectiveFilters,
    searchContext,
  )
  const queryMatchesCurrentView = query?.queryKey === queryKey
  const allMovements = queryMatchesCurrentView ? (query?.items ?? []) : []
  const total = queryMatchesCurrentView ? (query?.total ?? 0) : 0
  const movements = allMovements.slice(0, visibleCount)
  const movementGroups = useMemo(() => groupMovementsByDate(movements), [movements])
  const hasMore = visibleCount < total
  const isLoading =
    isRemoteLoading || (query === undefined && !isError && !queryMatchesCurrentView)

  const activeFilterChips = useMemo(
    () =>
      buildMovementFilterChips(filters, {
        categories,
        persons,
      }),
    [filters, categories, persons],
  )

  const updateListFilters = useCallback(
    (next: MovementFilters) => {
      setVisibleCount(MOVEMENTS_PAGE_SIZE)
      setFilters({ ...filters, ...next })
    },
    [filters, setFilters],
  )

  const removeFilterChip = useCallback(
    (chipId: string) => {
      if (chipId === 'period') {
        setVisibleCount(MOVEMENTS_PAGE_SIZE)
        setPeriod(currentMonthRange())
        return
      }
      updateListFilters(removeMovementFilterChip(listFilters, chipId))
    },
    [listFilters, setPeriod, updateListFilters],
  )

  const resetFilters = useCallback(() => {
    setVisibleCount(MOVEMENTS_PAGE_SIZE)
    clearFilters()
  }, [clearFilters])

  useEffect(() => {
    setVisibleCount(MOVEMENTS_PAGE_SIZE)
  }, [queryKey])

  return (
    <div className="space-y-4">
      <MovementFilterToolbar
        filters={listFilters}
        onChange={updateListFilters}
        categories={categories}
        persons={persons}
        activeChips={activeFilterChips}
        onRemoveChip={removeFilterChip}
        onClearFilters={resetFilters}
      />

      <p className="sr-only" aria-live="polite">
        {isLoading
          ? 'Cargando movimientos...'
          : total === 0
            ? '0 movimiento(s)'
            : `${movements.length} de ${total} movimiento(s)`}
      </p>
      <LiveRegion>{isLoading ? 'Cargando movimientos' : ''}</LiveRegion>

      {!isLoading && !isError && total === 0 ? (
        <EmptyState
          title="No hay movimientos"
          description="Ajusta los filtros o registra un nuevo movimiento"
        />
      ) : isError ? (
        <EmptyState
          title="No se pudieron cargar los movimientos"
          description={
            error instanceof Error
              ? error.message
              : 'Revisá tu conexión e intentá de nuevo.'
          }
        />
      ) : isLoading ? (
        <SkeletonList count={5} grouped />
      ) : (
        <>
          <div className="space-y-5">
            {movementGroups.map((group) => (
              <section key={group.dateKey} aria-labelledby={`movements-date-${group.dateKey}`}>
                <h2
                  id={`movements-date-${group.dateKey}`}
                  className="mb-2 text-sm font-medium text-stone-600"
                >
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.movements.map((m) => {
                    const cat = categories.find((c) => c.id === m.categoryId)
                    const categoryName = cat?.name ?? 'Sin categoría'
                    const payerLabel = payerListLabel(m.paidBy, persons)
                    const displayAmount = getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode)
                    const amountLines = formatMovementAmountLinesForView(m, currencyConfig, displayAmount)
                    const amountSign = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''
                    const hidePayerPill =
                      isPersonal && m.paidBy !== 'both' && m.paidBy === myRole

                    return (
                      <MovementRow
                        key={m.id}
                        variant="grouped-card"
                        to={`/movimientos/editar/${m.id}`}
                        movementId={m.id}
                        categoryName={categoryName}
                        categoryColor={cat?.color}
                        description={m.description}
                        payerLabel={payerLabel}
                        hidePayerPill={hidePayerPill}
                        movementType={m.type}
                        amountPrimary={amountLines.primary}
                        amountSecondary={amountLines.secondary}
                        amountSign={amountSign}
                        isShared={m.isShared}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setVisibleCount((count) => count + MOVEMENTS_PAGE_SIZE)}
            >
              Cargar más ({Math.min(MOVEMENTS_PAGE_SIZE, total - movements.length)} siguientes)
            </Button>
          )}
        </>
      )}
    </div>
  )
}
