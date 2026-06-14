import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFilteredMovements, useCategories, useSettings, useMovementMutations } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { useMovementFilters } from '@/contexts/MovementFiltersContext'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { currentMonthRange, formatShortDate } from '@/lib/utils'
import { buildMovementFilterChips, removeMovementFilterChip } from '@/lib/movement-filter-chips'
import { MovementFilterToolbar } from '@/components/MovementFilterToolbar'
import { payerDisplayLabel } from '@/lib/couple/person-labels'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatMovementAmountLinesForView, getCurrencyConfig } from '@/lib/currency'
import { MOVEMENTS_PAGE_SIZE } from '@/lib/movements-query'
import { EmptyState } from '@/components/ui/Card'
import { MovementList, MovementRow } from '@/components/ui/MovementRow'
import { SkeletonList } from '@/components/skeletons/SkeletonList'
import { Button, LiveRegion } from '@/components/ui/Form'
import type { MovementFilters } from '@/types'

export function MovementsPage() {
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal, mode: expenseViewMode } = useExpenseViewMode()
  const { filters, listFilters, setFilters, setPeriod, clearFilters } = useMovementFilters()
  const { deleteMovement } = useMovementMutations()
  const { confirm, dialog } = useConfirmDialog()
  const [visibleCount, setVisibleCount] = useState(MOVEMENTS_PAGE_SIZE)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const { query, queryKey } = useFilteredMovements(effectiveFilters, searchContext)
  const queryMatchesCurrentView = query?.queryKey === queryKey
  const allMovements = queryMatchesCurrentView ? (query?.items ?? []) : []
  const total = queryMatchesCurrentView ? (query?.total ?? 0) : 0
  const movements = allMovements.slice(0, visibleCount)
  const hasMore = visibleCount < total
  const isLoading = query === undefined || !queryMatchesCurrentView

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

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'Eliminar movimiento',
      description: 'Esta acción no se puede deshacer. ¿Querés eliminar este movimiento?',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    setDeletingId(id)
    await deleteMovement(id)
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {dialog}

      <MovementFilterToolbar
        filters={listFilters}
        onChange={updateListFilters}
        categories={categories}
        persons={persons}
        activeChips={activeFilterChips}
        onRemoveChip={removeFilterChip}
        onClearFilters={resetFilters}
      />

      <p className="text-sm text-stone-500" aria-live="polite">
        {isLoading
          ? 'Cargando movimientos...'
          : total === 0
            ? '0 movimiento(s)'
            : `Mostrando ${movements.length} de ${total} movimiento(s)`}
      </p>
      <LiveRegion>{isLoading ? 'Cargando movimientos' : ''}</LiveRegion>

      {!isLoading && total === 0 ? (
        <EmptyState
          title="No hay movimientos"
          description="Ajusta los filtros o registra un nuevo movimiento"
        />
      ) : isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <>
          <MovementList>
            {movements.map((m) => {
              const cat = categories.find((c) => c.id === m.categoryId)
              const displayAmount = getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode)
              const amountLines = formatMovementAmountLinesForView(m, currencyConfig, displayAmount)
              const amountSign = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''
              return (
                <MovementRow
                  key={m.id}
                  movementId={m.id}
                  description={m.description}
                  date={formatShortDate(m.date)}
                  movementType={m.type}
                  amountPrimary={amountLines.primary}
                  amountSecondary={amountLines.secondary}
                  amountSign={amountSign}
                  categoryName={cat?.name}
                  payerLabel={payerDisplayLabel(m.paidBy, persons)}
                  sharingLabel={m.isShared ? `${m.sharePersonA}/${m.sharePersonB}` : 'Personal'}
                  imported={m.source === 'imported'}
                  editTo={`/movimientos/editar/${m.id}`}
                  onDelete={() => handleDelete(m.id)}
                  deleting={deletingId === m.id}
                />
              )
            })}
          </MovementList>

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
