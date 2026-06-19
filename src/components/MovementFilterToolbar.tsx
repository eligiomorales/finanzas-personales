import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PeriodFilter } from '@/components/PeriodFilter'
import { FacetMenu } from '@/components/FacetDropdown'
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/ChoiceChip'
import { Button, Input } from '@/components/ui/Form'
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel'
import { Dialog } from '@/components/ui/Dialog'
import { FilterChips, type FilterChip } from '@/components/ui/FilterChips'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePeriod } from '@/contexts/MovementFiltersContext'
import { formatPeriodHeaderTitle } from '@/lib/period-presets'
import {
  MOVEMENT_SORT_OPTIONS,
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
    <ChoiceChipGroup label={label} labelId={labelId} role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <ChoiceChip
          key={opt.value || '__all'}
          role="radio"
          size="sm"
          selected={(value ?? '') === opt.value}
          onClick={() => onChange(opt.value || undefined)}
        >
          {opt.label}
        </ChoiceChip>
      ))}
    </ChoiceChipGroup>
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

  const { period, setPeriod } = usePeriod()
  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period])
  const advancedActive = advancedFiltersActiveCount(filters)

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
    { value: '', label: 'Todos' },
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
    { value: 'settlement', label: 'Liquidación' },
  ]

  const paidByOptions = [
    { value: '', label: 'Todos' },
    { value: 'personA', label: formLabelWithName('personA', persons) },
    { value: 'personB', label: formLabelWithName('personB', persons) },
  ]

  const sharedOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Compartido' },
    { value: 'false', label: 'Personal' },
  ]

  const currencyOptions = [
    { value: '', label: 'Todas' },
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

  const advancedFilters = (
    <div
      id="movements-advanced-filters"
      className="space-y-5"
      role="group"
      aria-label="Filtros por criterio"
    >
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

      <CollapsiblePanel
        title="Categoría"
        summary={categorySummary}
        open={categoryPanelOpen}
        onOpenChange={setCategoryPanelOpen}
        contentClassName="border-0 p-0"
        className={cn(filters.categoryId && !categoryPanelOpen && 'rounded-lg ring-1 ring-brand-200')}
      >
        <div
          role="radiogroup"
          aria-label="Categoría"
          className="flex max-h-60 touch-pan-y flex-wrap gap-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]"
        >
          <ChoiceChip
            role="radio"
            size="sm"
            selected={!filters.categoryId}
            onClick={() => patch({ categoryId: undefined })}
          >
            Todas
          </ChoiceChip>
          {categories.map((cat) => (
            <ChoiceChip
              key={cat.id}
              role="radio"
              size="sm"
              selected={filters.categoryId === cat.id}
              onClick={() => patch({ categoryId: cat.id })}
            >
              {cat.name}
            </ChoiceChip>
          ))}
        </div>
      </CollapsiblePanel>
    </div>
  )

  return (
    <div className="space-y-3" id="movements-filter-toolbar">
      <PageHeader title={periodTitle}>
        <PeriodFilter
          period={period}
          onChange={setPeriod}
          idPrefix="movements-period"
          variant="full"
          datesLabelOnly
        />
      </PageHeader>

      <div className="space-y-2">
        <div className="relative">
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

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="movements-advanced-filters"
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              showAdvanced || advancedActive > 0
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
            )}
            onClick={() => setShowAdvanced(true)}
          >
            Filtros
            {advancedActive > 0 && (
              <span className="tabular-nums text-brand-600">({advancedActive})</span>
            )}
            <span className="text-stone-400" aria-hidden>
              ▾
            </span>
          </button>

          <div className="min-w-0 shrink-0">
            <FacetMenu
              facetId="sort"
              label="Orden"
              value={movementSortOptionValue(filters)}
              options={MOVEMENT_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              openFacet={openFacet}
              setOpenFacet={setOpenFacet}
              onChange={(v) => {
                if (!v) return
                const parsed = parseMovementSortOptionValue(v)
                if (!parsed) return
                patch({ sortBy: parsed.sortBy, sortDir: parsed.sortDir })
              }}
            />
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
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-stone-100 pt-4">
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
