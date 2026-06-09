import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFilteredMovements, useCategories, useSettings, useMovementMutations } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { currentMonthRange, formatShortDate } from '@/lib/utils'
import {
  buildMovementFilterChips,
  defaultMovementFilters,
  removeMovementFilterChip,
} from '@/lib/movement-filter-chips'
import { MovementFilterToolbar } from '@/components/MovementFilterToolbar'
import { FilterChips } from '@/components/ui/FilterChips'
import { payerDisplayLabel } from '@/lib/couple/person-labels'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatMovementAmountLinesForView, getCurrencyConfig } from '@/lib/currency'
import { MOVEMENTS_PAGE_SIZE } from '@/lib/movements-query'
import { EmptyState } from '@/components/ui/Card'
import { MovementList, MovementRow } from '@/components/ui/MovementRow'
import { Button, LiveRegion } from '@/components/ui/Form'
import type { MovementFilters } from '@/types'

export function MovementsPage() {
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal, mode: expenseViewMode } = useExpenseViewMode()
  const { period, setPeriod } = usePeriod()
  const { deleteMovement } = useMovementMutations()
  const { confirm, dialog } = useConfirmDialog()
  const [filters, setFilters] = useState<MovementFilters>(defaultMovementFilters)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const myRole = persons.myRole ?? 'personA'

  const filtersWithPeriod = useMemo(
    () => ({ ...filters, dateFrom: period.from, dateTo: period.to }),
    [filters, period],
  )

  const effectiveFilters = useMemo(
    () =>
      isPersonal
        ? { ...filtersWithPeriod, personalViewRole: myRole }
        : filtersWithPeriod,
    [filtersWithPeriod, isPersonal, myRole],
  )

  const searchContext = useMemo(
    () => ({ categories, persons }),
    [categories, persons],
  )

  const query = useFilteredMovements(effectiveFilters, page, searchContext)
  const movements = query?.items ?? []
  const total = query?.total ?? 0
  const hasMore = query?.hasMore ?? false
  const isLoading = query === undefined

  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])

  const activeFilterChips = useMemo(
    () =>
      buildMovementFilterChips(filtersWithPeriod, {
        categories,
        persons,
      }),
    [filtersWithPeriod, categories, persons],
  )

  const updateFilters = useCallback((next: MovementFilters) => {
    setPage(1)
    setFilters(next)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [period.from, period.to])

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
        filters={filters}
        onChange={updateFilters}
        categories={categories}
        persons={persons}
      />

      <FilterChips
        size="compact"
        chips={activeFilterChips}
        onRemove={(chipId) => {
          if (chipId === 'period') {
            setPage(1)
            setPeriod(currentMonthRange())
            return
          }
          updateFilters(removeMovementFilterChip(filters, chipId))
        }}
        onClearAll={() => updateFilters(defaultMovementFilters())}
        clearAllLabel="Restablecer filtros"
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
              onClick={() => setPage((p) => p + 1)}
            >
              Cargar más ({Math.min(MOVEMENTS_PAGE_SIZE, total - movements.length)} siguientes)
            </Button>
          )}
        </>
      )}
    </div>
  )
}
