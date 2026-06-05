import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImportCategoryPicker } from '@/components/ImportCategoryPicker'
import {
  ImportShareControls,
  type ImportShareValues,
} from '@/components/ImportShareControls'
import { Badge, Card } from '@/components/ui/Card'
import { Button, Label, Select, FormGroup } from '@/components/ui/Form'
import {
  importItemMetadata,
  importItemTitle,
  importRepartoPreview,
  importRepartoSummary,
  importShareLabelForRole,
  type ImportReviewItem,
} from '@/lib/import-display'
import { formatMovementAmount } from '@/lib/currency'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { cn, formatShortDate, movementAmountColor } from '@/lib/utils'
import type { Category, CurrencyCode } from '@/types'

const EXTRACT_PREVIEW_LINES = 3

type ExpandedSection = 'extract' | 'reparto' | null

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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null)
  const [extractFull, setExtractFull] = useState(false)
  const [shareEdited, setShareEdited] = useState(false)

  const category = expenseCategories.find((c) => c.id === item.selectedCategoryId)
  const title = importItemTitle(item.originalDescription, item.merchant)
  const metadata = importItemMetadata(category?.name, item, persons)
  const repartoSummary = importRepartoSummary(item, (role) => importShareLabelForRole(role, persons))
  const repartoPreview = importRepartoPreview(item, persons, item.amount, item.currency)

  const extractLines = item.originalDescription.split('\n').filter((line) => line.trim()).length
  const isPending = item.status === 'pending'
  const extractOpen = expandedSection === 'extract'
  const repartoOpen = expandedSection === 'reparto'

  function toggleExtract() {
    setExpandedSection((current) => {
      if (current === 'extract') {
        setExtractFull(false)
        return null
      }
      return 'extract'
    })
  }

  function handleShareChange(share: ImportShareValues) {
    setShareEdited(true)
    onShareChange(share)
  }

  return (
    <Card
      className={cn(
        '!p-3',
        item.status === 'ignored' && 'opacity-60',
        item.possibleDuplicate && item.status === 'pending' && 'border-amber-300',
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">{formatShortDate(item.date)}</span>
              {item.currency === 'USD' && (
                <Badge variant="warning">{item.currency}</Badge>
              )}
              {item.possibleDuplicate && isPending && (
                <Badge variant="warning">Posible duplicado</Badge>
              )}
              {item.status === 'ignored' && <Badge>Ignorado</Badge>}
            </div>
            <p className="mt-1 break-words font-medium text-slate-800">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{metadata}</p>
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
            {isPending ? (
              <Button size="sm" variant="ghost" className="mt-1" onClick={onIgnore}>
                Ignorar
              </Button>
            ) : (
              <Button size="sm" variant="ghost" className="mt-1" onClick={onRestore}>
                Restaurar
              </Button>
            )}
          </div>
        </div>

        {isPending && (
          <>
            <ImportCategoryPicker
              idPrefix={`import-item-category-${item.id}`}
              expenseCategories={expenseCategories}
              frequentCategoryIds={frequentCategoryIds}
              selectedCategoryId={item.selectedCategoryId}
              suggestedCategoryId={item.suggestedCategoryId}
              onChange={onCategoryChange}
            />

            {perRowCurrency && (
              <FormGroup className="!mb-0">
                <Label htmlFor={`import-item-currency-${item.id}`} className="text-xs">
                  Moneda
                </Label>
                <Select
                  id={`import-item-currency-${item.id}`}
                  value={item.currency}
                  onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </Select>
              </FormGroup>
            )}

            <div>
              <button
                type="button"
                onClick={toggleExtract}
                aria-expanded={extractOpen}
                aria-controls={`import-item-extract-${item.id}`}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
              >
                <span className="text-sm font-medium text-slate-700">Detalle del extracto</span>
                <span className="text-xs text-slate-500">
                  {extractLines} línea{extractLines === 1 ? '' : 's'} {extractOpen ? '▴' : '▾'}
                </span>
              </button>
              {extractOpen && (
                <div
                  id={`import-item-extract-${item.id}`}
                  className="mt-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5"
                >
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
            </div>

            <ImportShareControls
              collapsible
              compact
              idPrefix={`import-item-share-${item.id}`}
              paidBy={item.paidBy}
              isShared={item.isShared}
              sharePersonA={item.sharePersonA}
              sharePersonB={item.sharePersonB}
              splitPreset={item.splitPreset}
              persons={persons}
              summaryText={repartoSummary}
              previewText={shareEdited && repartoOpen ? repartoPreview : null}
              open={repartoOpen}
              onOpenChange={(nextOpen) => {
                setExpandedSection(nextOpen ? 'reparto' : null)
              }}
              onChange={handleShareChange}
            />

            {item.possibleDuplicate && item.duplicateMovementId && (
              <Link
                to={`/movimientos/editar/${item.duplicateMovementId}`}
                className="inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Ver movimiento existente
              </Link>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
