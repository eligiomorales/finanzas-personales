import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { FilterFacet, FacetOptionItem } from '@/components/FacetDropdown'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { Button, Input, Label } from '@/components/ui/Form'
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel'
import { Dialog } from '@/components/ui/Dialog'
import { FilterChips, type FilterChip } from '@/components/ui/FilterChips'
import { PageHeader } from '@/components/ui/PageHeader'
import { hasMovementDateFilter } from '@/lib/movement-filters-storage'
import {
  MOVEMENT_SORT_OPTIONS,
  isDefaultMovementSort,
  movementSortLabel,
  movementSortOptionValue,
  parseMovementSortOptionValue,
} from '@/lib/movements-query'
import { formLabelWithName, type CouplePersonsView } from '@/lib/couple/person-labels'
import type { Category } from '@/types'
import type { CurrencyCode, MovementFilters, MovementType, Payer } from '@/types'

const SEARCH_DEBOUNCE_MS = 300

interface MovementFilterToolbarProps {
  filters: MovementFilters
  onChange: (next: MovementFilters) => void
  categories: Category[]
  persons: CouplePersonsView
  activeChips: FilterChip[]
  onRemoveChip: (chipId: string) => void
  onClearFilters: () => void
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4v16" />
      <path d="M4 7l3-3 3 3" />
      <path d="M17 20V4" />
      <path d="M14 17l3 3 3-3" />
    </svg>
  )
}


function moreFiltersActiveCount(filters: MovementFilters): number {
  let n = 0
  if (filters.isShared !== undefined) n++
  if (filters.currency) n++
  return n
}

function advancedFiltersActiveCount(filters: MovementFilters): number {
  let n = moreFiltersActiveCount(filters)
  if (filters.type) n++
  if (filters.categoryId) n++
  if (filters.paidBy) n++
  return n
}

function ChipFilter({
  label,
  labelId,
  options,
  value,
  onChange,
}: {
  label: string
  labelId: string
  options: { value: string; label: string }[]
  value: string
  onChange: (next: string | undefined) => void
}) {
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-3 py-2">
      <span id={labelId} className="pt-1.5 text-xs font-medium text-stone-500">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = (value ?? '') === opt.value
          return (
            <ChoiceChip
              key={opt.value}
              role="radio"
              size="sm"
              selected={selected}
              className="whitespace-nowrap"
              // ponytail: toggle — clicking selected chip deselects (sets to undefined = "todos")
              onClick={() => onChange(selected ? undefined : (opt.value || undefined))}
            >
              {opt.label}
            </ChoiceChip>
          )
        })}
      </div>
    </div>
  )
}

export function MovementFilterToolbar({
  filters,
  onChange,
  categories,
  persons,
  activeChips,
  onRemoveChip,
  onClearFilters,
}: MovementFilterToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '')
  const [openFacet, setOpenFacet] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const searchId = useId()
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const dateFilterActive = hasMovementDateFilter(filters)
  const advancedActive = advancedFiltersActiveCount(filters)
  const filterActiveCount = advancedActive + (dateFilterActive ? 1 : 0)
  const sortValue = movementSortOptionValue(filters)
  const sortActive = !isDefaultMovementSort(filters)

  useEffect(() => {
    setSearchDraft(filters.search ?? '')
  }, [filters.search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchDraft.trim() || undefined
      if (next === (filtersRef.current.search?.trim() || undefined)) return
      onChange({ ...filtersRef.current, search: next })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchDraft, onChange])

  useEffect(() => {
    if (!showAdvanced) setCategoryPanelOpen(false)
  }, [showAdvanced])

  const typeOptions = [
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
    { value: 'settlement', label: 'Liquidación' },
  ]

  const paidByOptions = [
    { value: 'personA', label: formLabelWithName('personA', persons) },
    { value: 'personB', label: formLabelWithName('personB', persons) },
  ]

  const sharedOptions = [
    { value: 'true', label: 'Compartido' },
    { value: 'false', label: 'Personal' },
  ]

  const currencyOptions = [
    { value: 'ARS', label: 'ARS' },
    { value: 'USD', label: 'USD' },
  ]

  function patch(patch: Partial<MovementFilters>) {
    onChange({ ...filters, ...patch })
  }

  const sharedFilterValue =
    filters.isShared === undefined ? '' : filters.isShared ? 'true' : 'false'

  const categorySummary =
    categories.find((c) => c.id === filters.categoryId)?.name ?? 'Todas las categorías'

  const datePeriod = useMemo(
    () => ({ from: filters.dateFrom ?? '', to: filters.dateTo ?? '' }),
    [filters.dateFrom, filters.dateTo],
  )

  function patchDatePeriod(next: { from: string; to: string }) {
    patch({
      dateFrom: next.from || undefined,
      dateTo: next.to || undefined,
    })
  }

  const advancedFilters = (
    <div
      id="movements-advanced-filters"
      className="divide-y divide-stone-100"
      role="group"
      aria-label="Filtros por criterio"
    >
      <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-3 pb-2 pt-1">
        <p className="pt-6 text-xs font-medium text-stone-500">Fechas</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="movements-filter-period-from" className="mb-1 text-xs text-stone-500">
              Desde
            </Label>
            <Input
              id="movements-filter-period-from"
              type="date"
              className="py-1.5 text-xs"
              value={datePeriod.from}
              onChange={(e) => patchDatePeriod({ ...datePeriod, from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="movements-filter-period-to" className="mb-1 text-xs text-stone-500">
              Hasta
            </Label>
            <Input
              id="movements-filter-period-to"
              type="date"
              className="py-1.5 text-xs"
              value={datePeriod.to}
              onChange={(e) => patchDatePeriod({ ...datePeriod, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      <ChipFilter
        label="Tipo"
        labelId="movements-filter-type"
        value={filters.type ?? ''}
        options={typeOptions}
        onChange={(v) => patch({ type: (v as MovementType) || undefined })}
      />

      <ChipFilter
        label="Pagó"
        labelId="movements-filter-paid-by"
        value={filters.paidBy === 'both' ? '' : (filters.paidBy ?? '')}
        options={paidByOptions}
        onChange={(v) => patch({ paidBy: (v as Payer) || undefined })}
      />

      <ChipFilter
        label="Alcance"
        labelId="movements-filter-shared"
        value={sharedFilterValue}
        options={sharedOptions}
        onChange={(v) =>
          patch({
            isShared: v === '' ? undefined : v === 'true',
          })
        }
      />

      <ChipFilter
        label="Moneda"
        labelId="movements-filter-currency"
        value={filters.currency ?? ''}
        options={currencyOptions}
        onChange={(v) => patch({ currency: (v as CurrencyCode) || undefined })}
      />

      <div className="pt-2">
        <CollapsiblePanel
          title="Categoría"
          summary={categorySummary}
          open={categoryPanelOpen}
          onOpenChange={setCategoryPanelOpen}
          contentClassName="border-0 p-0"
          className={cn(filters.categoryId && 'rounded-lg ring-1 ring-brand-200')}
        >
          <div
            role="radiogroup"
            aria-label="Categoría"
            className="flex max-h-40 touch-pan-y flex-wrap gap-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]"
          >
            {categories.map((cat) => (
              <ChoiceChip
                key={cat.id}
                role="radio"
                size="sm"
                selected={filters.categoryId === cat.id}
              onClick={() =>
                patch({ categoryId: filters.categoryId === cat.id ? undefined : cat.id })
              }
              >
                {cat.name}
              </ChoiceChip>
            ))}
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  )

  return (
    <div className="space-y-3" id="movements-filter-toolbar">
      <PageHeader title="Movimientos" />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="movements-advanced-filters"
            aria-label={`Abrir filtros${filterActiveCount > 0 ? ` (${filterActiveCount} activos)` : ''}`}
            className={cn(
              'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              showAdvanced || filterActiveCount > 0
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
            )}
            onClick={() => {
              setOpenFacet(null)
              setShowAdvanced(true)
            }}
          >
            <FilterIcon />
            {filterActiveCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                {filterActiveCount}
              </span>
            )}
          </button>

          <FilterFacet
            label="Orden"
            active={sortActive}
            open={openFacet === 'sort'}
            onOpen={() => setOpenFacet('sort')}
            onClose={() => setOpenFacet(null)}
            ariaLabel={`Ordenar movimientos: ${movementSortLabel(filters)}`}
            buttonClassName="h-10 w-10 justify-center px-0 py-0"
            buttonContent={<SortIcon />}
          >
            {MOVEMENT_SORT_OPTIONS.map((opt) => (
              <FacetOptionItem
                key={opt.value}
                selected={sortValue === opt.value}
                onSelect={() => {
                  const parsed = parseMovementSortOptionValue(opt.value)
                  if (!parsed) return
                  patch({ sortBy: parsed.sortBy, sortDir: parsed.sortDir })
                  setOpenFacet(null)
                }}
              >
                {opt.label}
              </FacetOptionItem>
            ))}
          </FilterFacet>

          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input
              id={searchId}
              type="search"
              role="searchbox"
              aria-label="Buscar movimientos"
              placeholder="Buscar movimientos, categorías, importes..."
              value={searchDraft}
              className="border-stone-200/80 bg-white py-2 pl-9 pr-9 text-sm"
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            {searchDraft.length > 0 && (
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-sm text-stone-500 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchDraft('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <FilterChips
          size="compact"
          chips={activeChips}
          onRemove={onRemoveChip}
          onClearAll={onClearFilters}
          clearAllLabel="Restablecer filtros"
        />
      </div>

      <Dialog
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        title="Filtros"
        className="max-w-lg"
      >
        {advancedFilters}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 bg-white pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            Restablecer
          </Button>
          <Button type="button" size="sm" onClick={() => setShowAdvanced(false)}>
            Ver movimientos
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
