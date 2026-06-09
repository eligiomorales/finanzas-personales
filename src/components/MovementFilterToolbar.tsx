import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { PeriodFilter } from '@/components/PeriodFilter'
import { FacetMenu, FilterFacet, FacetOptionItem, type FacetOption } from '@/components/FacetDropdown'
import { Input } from '@/components/ui/Form'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePeriod } from '@/contexts/PeriodContext'
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

export function MovementFilterToolbar({
  filters,
  onChange,
  categories,
  persons,
}: MovementFilterToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '')
  const [openFacet, setOpenFacet] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchId = useId()
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const { period, setPeriod } = usePeriod()
  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period])
  const periodSubtitle = `Del ${formatDate(period.from)} al ${formatDate(period.to)}`
  const moreActive = moreFiltersActiveCount(filters)
  const advancedActive = advancedFiltersActiveCount(filters)

  useEffect(() => {
    setSearchDraft(filters.search ?? '')
  }, [filters.search])

  useEffect(() => {
    if (advancedActive > 0) setShowAdvanced(true)
  }, [advancedActive])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchDraft.trim() || undefined
      if (next === (filtersRef.current.search?.trim() || undefined)) return
      onChange({ ...filtersRef.current, search: next })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchDraft, onChange])

  const typeOptions: FacetOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
    { value: 'settlement', label: 'Liquidación' },
  ]

  const categoryOptions: FacetOption[] = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const paidByOptions: FacetOption[] = [
    { value: '', label: 'Todos' },
    { value: 'personA', label: formLabelWithName('personA', persons) },
    { value: 'personB', label: formLabelWithName('personB', persons) },
    { value: 'both', label: 'Ambos' },
  ]

  function patch(patch: Partial<MovementFilters>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="space-y-2" id="movements-filter-toolbar">
      <PageHeader
        title={periodTitle}
        subtitle={periodSubtitle}
        trailing={
          <PeriodFilter
            period={period}
            onChange={setPeriod}
            idPrefix="movements-period"
            variant="dates"
            datesLabelOnly
          />
        }
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <PeriodFilter
              period={period}
              onChange={setPeriod}
              idPrefix="movements-period"
              variant="presets"
            />
          </div>
          <button
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="movements-advanced-filters"
            className={cn(
              'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              showAdvanced || advancedActive > 0
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
            )}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            Filtros
            {advancedActive > 0 && (
              <span className="ml-1 tabular-nums text-brand-600">({advancedActive})</span>
            )}
            <span className="ml-0.5 text-stone-400" aria-hidden>
              {showAdvanced ? '▴' : '▾'}
            </span>
          </button>
        </div>
      </PageHeader>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id={searchId}
            type="search"
            role="searchbox"
            aria-label="Buscar movimientos"
            placeholder="Buscar descripción, categoría, pagador… (>10000, usd, importado)"
            value={searchDraft}
            className="py-1.5 pl-9 pr-9 text-sm"
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
        <div className="shrink-0">
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

      {showAdvanced && (
        <div
          id="movements-advanced-filters"
          className="flex flex-wrap gap-1.5 rounded-lg border border-stone-200 bg-white p-2"
          role="group"
          aria-label="Filtros por criterio"
        >
          <FacetMenu
            facetId="type"
            label="Tipo"
            value={filters.type ?? ''}
            options={typeOptions}
            openFacet={openFacet}
            setOpenFacet={setOpenFacet}
            onChange={(v) => patch({ type: (v as MovementType) || undefined })}
          />
          <FacetMenu
            facetId="category"
            label="Categoría"
            value={filters.categoryId ?? ''}
            options={categoryOptions}
            openFacet={openFacet}
            setOpenFacet={setOpenFacet}
            onChange={(v) => patch({ categoryId: v || undefined })}
          />
          <FacetMenu
            facetId="paidBy"
            label="Pagó"
            value={filters.paidBy ?? ''}
            options={paidByOptions}
            openFacet={openFacet}
            setOpenFacet={setOpenFacet}
            onChange={(v) => patch({ paidBy: (v as Payer) || undefined })}
          />
          <FilterFacet
            label={moreActive > 0 ? `Más (${moreActive})` : 'Más'}
            active={moreActive > 0}
            open={openFacet === 'more'}
            onOpen={() => setOpenFacet('more')}
            onClose={() => setOpenFacet(null)}
          >
            <li className="px-3 py-2 text-xs font-semibold text-stone-500">Compartido</li>
            {(
              [
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Compartido' },
                { value: 'false', label: 'Personal' },
              ] as FacetOption[]
            ).map((opt) => (
              <FacetOptionItem
                key={`shared-${opt.value || 'all'}`}
                selected={
                  filters.isShared === undefined
                    ? opt.value === ''
                    : String(filters.isShared) === opt.value
                }
                onSelect={() =>
                  patch({
                    isShared: opt.value === '' ? undefined : opt.value === 'true',
                  })
                }
              >
                {opt.label}
              </FacetOptionItem>
            ))}
            <li className="border-t border-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">Moneda</li>
            {(
              [
                { value: '', label: 'Todas' },
                { value: 'ARS', label: 'ARS' },
                { value: 'USD', label: 'USD' },
              ] as FacetOption[]
            ).map((opt) => (
              <FacetOptionItem
                key={`currency-${opt.value || 'all'}`}
                selected={(filters.currency ?? '') === opt.value}
                onSelect={() => patch({ currency: (opt.value as CurrencyCode) || undefined })}
              >
                {opt.label}
              </FacetOptionItem>
            ))}
          </FilterFacet>
        </div>
      )}
    </div>
  )
}
