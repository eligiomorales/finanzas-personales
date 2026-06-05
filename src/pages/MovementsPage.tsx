import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFilteredMovements, useCategories, useSettings, useMovementMutations } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import {
  currentMonthRange,
  formatShortDate,
  movementTypeColor,
  movementTypeLabel,
  movementAmountColor,
} from '@/lib/utils'
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
import { Card, EmptyState, Badge } from '@/components/ui/Card'
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

  const query = useFilteredMovements(effectiveFilters, page)
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

      <p className="text-sm text-slate-500" aria-live="polite">
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
          <div className="space-y-2">
            {movements.map((m) => {
              const cat = categories.find((c) => c.id === m.categoryId)
              const displayAmount = getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode)
              const amountLines = formatMovementAmountLinesForView(m, currencyConfig, displayAmount)
              const amountSign = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''
              return (
                <Card key={m.id} className="!p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">{formatShortDate(m.date)}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${movementTypeColor(m.type)}`}
                          >
                            {movementTypeLabel(m.type)}
                          </span>
                          {m.source === 'imported' && <Badge variant="info">Importado</Badge>}
                        </div>
                        <p className="mt-1 break-words font-medium text-slate-800">{m.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-bold tabular-nums sm:text-base ${movementAmountColor(m.type)}`}
                        >
                          {amountSign}
                          {amountLines.primary}
                        </p>
                        {amountLines.secondary && (
                          <p className="text-xs tabular-nums text-slate-500">{amountLines.secondary}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        {cat && <span>{cat.name}</span>}
                        <span>· Pagó: {payerDisplayLabel(m.paidBy, persons)}</span>
                        {m.isShared && (
                          <span>
                            · {m.sharePersonA}/{m.sharePersonB}
                          </span>
                        )}
                        {!m.isShared && <span>· Personal</span>}
                      </div>
                      <div className="ml-auto flex shrink-0 gap-1">
                        <Link to={`/movimientos/editar/${m.id}`}>
                          <Button size="sm" variant="ghost">
                            Editar
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700"
                          disabled={deletingId === m.id}
                          aria-busy={deletingId === m.id}
                          onClick={() => handleDelete(m.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

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
