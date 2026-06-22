import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImportCategoryPicker } from '@/components/ImportCategoryPicker'
import {
  ImportShareControls,
  IMPORT_SPLIT_PRESETS,
  type ImportShareValues,
} from '@/components/ImportShareControls'
import { Badge, Card } from '@/components/ui/Card'
import { Button, Input, Label } from '@/components/ui/Form'
import {
  defaultImportRuleKeyword,
  findExistingImportRuleForItem,
  importItemCategoryWasCorrected,
  importRepartoPreview,
  importRepartoSummary,
  importShareLabelForRole,
  type ImportReviewItem,
} from '@/lib/import-display'
import { formatMovementAmount } from '@/lib/currency'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { cn, formatShortDate, movementAmountColor } from '@/lib/utils'
import type { Category, CategoryRule, CurrencyCode } from '@/types'

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
  categoryRules?: CategoryRule[]
  rememberRule?: boolean
  ruleKeyword?: string
  onRememberRuleChange?: (remember: boolean) => void
  onRuleKeywordChange?: (keyword: string) => void
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
  categoryRules = [],
  rememberRule = false,
  ruleKeyword = '',
  onRememberRuleChange,
  onRuleKeywordChange,
}: ImportReviewItemCardProps) {
  const [shareEdited, setShareEdited] = useState(false)

  const repartoSummary = importRepartoSummary(item, (role) => importShareLabelForRole(role, persons))
  const repartoPreview = importRepartoPreview(item, persons, item.amount, item.currency)
  const extractText = item.originalDescription.trim() || 'Sin descripción'

  const isPending = item.status === 'pending'
  const showFullEditor = isPending
  const categoryWasCorrected = importItemCategoryWasCorrected(item)
  const existingRule = useMemo(() => {
    if (!item.selectedCategoryId) return undefined
    return findExistingImportRuleForItem(item, categoryRules, item.selectedCategoryId)
  }, [categoryRules, item, item.selectedCategoryId])

  function handleShareChange(share: ImportShareValues) {
    setShareEdited(true)
    onShareChange(share)
  }

  function handleRememberToggle(checked: boolean) {
    if (!onRememberRuleChange) return
    onRememberRuleChange(checked)
    if (checked && onRuleKeywordChange && !ruleKeyword.trim()) {
      onRuleKeywordChange(defaultImportRuleKeyword(item))
    }
  }

  function handleStatusToggle() {
    if (isPending) onIgnore()
    else onRestore()
  }

  return (
    <Card
      compact
      className={cn(
        item.status === 'ignored' && 'opacity-60',
        item.possibleDuplicate && item.status === 'pending' && 'border-amber-300 bg-amber-50/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-stone-500">{formatShortDate(item.date)}</span>
            {item.currency === 'USD' && !perRowCurrency && <Badge variant="warning">USD</Badge>}
            {item.possibleDuplicate && isPending && <Badge variant="warning">Duplicado</Badge>}
            {isPending && !item.needsReview && <Badge variant="info">Auto-aprobado</Badge>}
            {item.status === 'ignored' && <Badge>Ignorado</Badge>}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-stone-900">
            {extractText}
          </p>
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

      {showFullEditor && (
        <div className="mt-3 flex flex-col gap-4 border-t border-stone-100 pt-4">
          <ImportCategoryPicker
            idPrefix={`import-item-${item.id}`}
            expenseCategories={expenseCategories}
            frequentCategoryIds={frequentCategoryIds}
            selectedCategoryId={item.selectedCategoryId}
            suggestedCategoryId={item.suggestedCategoryId}
            onChange={onCategoryChange}
          />

          {categoryWasCorrected && onRememberRuleChange && (
            <div className="rounded-lg border border-dashed border-stone-200 bg-surface-50/70 px-2.5 py-2.5">
              {existingRule ? (
                <p className="text-xs text-stone-500">
                  Regla existente: &quot;{existingRule.keyword}&quot; → futuras importaciones.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={rememberRule}
                      onChange={(e) => handleRememberToggle(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600"
                    />
                    <span className="text-xs font-medium text-stone-700">
                      Recordar para próximas importaciones
                    </span>
                  </label>
                  {rememberRule && onRuleKeywordChange && (
                    <div className="space-y-1 pl-6">
                      <Label htmlFor={`remember-rule-${item.id}`} className="text-xs text-stone-600">
                        Palabra clave
                      </Label>
                      <Input
                        id={`remember-rule-${item.id}`}
                        value={ruleKeyword}
                        onChange={(e) => onRuleKeywordChange(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-stone-100 pt-4">
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
              splitPresets={IMPORT_SPLIT_PRESETS}
              includeBothPayer={false}
              currency={perRowCurrency ? item.currency : undefined}
              onCurrencyChange={perRowCurrency ? onCurrencyChange : undefined}
              onChange={handleShareChange}
            />

            {item.possibleDuplicate && item.duplicateMovementId && (
              <Link
                to={`/movimientos/editar/${item.duplicateMovementId}`}
                className="mt-4 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Ver movimiento existente →
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
