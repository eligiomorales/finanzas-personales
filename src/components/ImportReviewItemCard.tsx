import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ImportShareControls,
  SPLIT_PRESETS,
  type ImportShareValues,
} from '@/components/ImportShareControls'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Form'
import {
  buildImportCategoryButtons,
  importItemTitle,
  importRepartoPreview,
  importRepartoSummary,
  importShareLabelForRole,
  type ImportReviewItem,
} from '@/lib/import-display'
import { formatMovementAmount } from '@/lib/currency'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { payerDisplayLabel } from '@/lib/couple/person-labels'
import { cn, formatShortDate, movementAmountColor } from '@/lib/utils'
import type { Category, CurrencyCode } from '@/types'

const EXTRACT_PREVIEW_LINES = 3
const PRIMARY_CATEGORY_LIMIT = 4

interface ImportReviewItemCardProps {
  item: ImportReviewItem
  persons: CouplePersonsView
  expenseCategories: Category[]
  frequentCategoryIds: string[]
  perRowCurrency: boolean
  onCategoryChange: (categoryId: string) => void
  onCurrencyChange: (currency: CurrencyCode) => void
  onShareChange: (share: ImportShareValues) => void
  onIgnore: () => void
  onRestore: () => void
}

export function ImportReviewItemCard({
  item,
  persons,
  expenseCategories,
  frequentCategoryIds,
  perRowCurrency,
  onCategoryChange,
  onCurrencyChange,
  onShareChange,
  onIgnore,
  onRestore,
}: ImportReviewItemCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)
  const [extractFull, setExtractFull] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [shareEdited, setShareEdited] = useState(false)

  const category = expenseCategories.find((c) => c.id === item.selectedCategoryId)
  const suggestedCategory = expenseCategories.find((c) => c.id === item.suggestedCategoryId)
  const title = importItemTitle(item.originalDescription, item.merchant)
  const repartoSummary = importRepartoSummary(item, (role) => importShareLabelForRole(role, persons))
  const repartoPreview = importRepartoPreview(item, persons, item.amount, item.currency)

  const primaryCategories = useMemo(
    () =>
      buildImportCategoryButtons(
        expenseCategories,
        frequentCategoryIds,
        item.selectedCategoryId,
        item.suggestedCategoryId,
        PRIMARY_CATEGORY_LIMIT,
      ),
    [
      expenseCategories,
      frequentCategoryIds,
      item.selectedCategoryId,
      item.suggestedCategoryId,
    ],
  )

  const categoryOptions = useMemo(() => {
    if (!showAllCategories) return primaryCategories
    const seen = new Set(primaryCategories.map((c) => c.id))
    const extra = expenseCategories.filter((c) => !seen.has(c.id))
    return [...primaryCategories, ...extra]
  }, [expenseCategories, primaryCategories, showAllCategories])

  const extractLines = item.originalDescription.split('\n').filter((line) => line.trim()).length
  const isPending = item.status === 'pending'

  const repartoChip = item.isShared
    ? SPLIT_PRESETS.find((preset) => preset.value === item.splitPreset)?.label ??
      `${item.sharePersonA} / ${item.sharePersonB}`
    : payerDisplayLabel(item.paidBy, persons)

  function handleShareChange(share: ImportShareValues) {
    setShareEdited(true)
    onShareChange(share)
  }

  function handleStatusToggle() {
    if (isPending) onIgnore()
    else onRestore()
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-white transition-colors',
        item.status === 'ignored' && 'opacity-60',
        item.possibleDuplicate && item.status === 'pending' && 'border-amber-300 bg-amber-50/20',
        !item.possibleDuplicate && 'border-slate-200',
      )}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">{formatShortDate(item.date)}</span>
              {item.currency === 'USD' && !perRowCurrency && <Badge variant="warning">USD</Badge>}
              {item.possibleDuplicate && isPending && <Badge variant="warning">Duplicado</Badge>}
              {item.status === 'ignored' && <Badge>Ignorado</Badge>}
            </div>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{title}</p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                'text-sm font-bold tabular-nums sm:text-base',
                movementAmountColor('expense'),
              )}
            >
              -{formatMovementAmount(item)}
            </p>
            <Button size="sm" variant="ghost" className="mt-1 h-auto px-1 py-0" onClick={handleStatusToggle}>
              {isPending ? 'Ignorar' : 'Restaurar'}
            </Button>
          </div>
        </div>

        {isPending && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-full border border-brand-500 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                {category?.name ?? 'Sin categoría'}
              </button>
              {perRowCurrency && (
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5">
                  {(['ARS', 'USD'] as const).map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() => onCurrencyChange(currency)}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
                        item.currency === currency
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-slate-500',
                      )}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {repartoChip}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen((open) => !open)}
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
              >
                {editOpen ? 'Cerrar ajustes' : 'Ajustar'}
              </button>
            </div>

            {editOpen && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">Categoría</span>
                    {suggestedCategory && item.selectedCategoryId !== item.suggestedCategoryId && (
                      <span className="text-[11px] text-slate-400">Sugerida: {suggestedCategory.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryOptions.map((option) => {
                      const isSelected = item.selectedCategoryId === option.id
                      const isSuggested =
                        item.suggestedCategoryId === option.id && !isSelected
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onCategoryChange(option.id)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            isSelected
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                          )}
                        >
                          {option.name}
                          {isSuggested ? ' · sugerida' : ''}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((open) => !open)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {showAllCategories ? 'Ver menos' : 'Más'}
                    </button>
                  </div>
                </div>

                {perRowCurrency && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">Moneda</span>
                    <div className="inline-grid grid-cols-2 rounded-full border border-slate-200 bg-white p-0.5">
                      {(['ARS', 'USD'] as const).map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => onCurrencyChange(currency)}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                            item.currency === currency
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-slate-500 hover:text-slate-700',
                          )}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <ImportShareControls
                  compact
                  idPrefix={`import-item-share-${item.id}`}
                  paidBy={item.paidBy}
                  isShared={item.isShared}
                  sharePersonA={item.sharePersonA}
                  sharePersonB={item.sharePersonB}
                  splitPreset={item.splitPreset}
                  persons={persons}
                  summaryText={repartoSummary}
                  previewText={shareEdited ? repartoPreview : null}
                  onChange={handleShareChange}
                />

                <button
                  type="button"
                  onClick={() => setExtractOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-lg bg-white px-2.5 py-2 text-left text-xs font-medium text-slate-600"
                >
                  <span>Detalle del extracto</span>
                  <span className="text-slate-400">
                    {extractLines} línea{extractLines === 1 ? '' : 's'} {extractOpen ? '▴' : '▾'}
                  </span>
                </button>
                {extractOpen && (
                  <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                    <p
                      className={cn(
                        'whitespace-pre-wrap break-words text-xs leading-snug text-slate-600',
                        !extractFull && extractLines > EXTRACT_PREVIEW_LINES && 'line-clamp-3',
                      )}
                    >
                      {item.originalDescription}
                    </p>
                    {extractLines > EXTRACT_PREVIEW_LINES && (
                      <button
                        type="button"
                        onClick={() => setExtractFull((full) => !full)}
                        className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        {extractFull ? 'Ver menos' : 'Ver completo'}
                      </button>
                    )}
                  </div>
                )}

                {item.possibleDuplicate && item.duplicateMovementId && (
                  <Link
                    to={`/movimientos/editar/${item.duplicateMovementId}`}
                    className="inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Ver movimiento existente →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
