import { useMemo, useState } from 'react'
import {
  ImportShareControls,
  SPLIT_PRESETS,
  type ImportShareValues,
} from '@/components/ImportShareControls'
import {
  buildImportCategoryButtons,
  importRepartoSummary,
  importShareLabelForRole,
} from '@/lib/import-display'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { payerDisplayLabel } from '@/lib/couple/person-labels'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { Button } from '@/components/ui/Form'
import type { Category } from '@/types'

const PRIMARY_CATEGORY_LIMIT = 4

interface ImportBatchDefaultsCardProps {
  expenseCategories: Category[]
  frequentCategoryIds: string[]
  bulkCategoryId: string
  bulkShare: ImportShareValues
  persons: CouplePersonsView
  pendingCount: number
  duplicateCount: number
  onCategoryChange: (categoryId: string) => void
  onShareChange: (share: ImportShareValues) => void
  onApplyCategory: () => void
  onApplyShare: () => void
  onIgnoreDuplicates: () => void
}

export function ImportBatchDefaultsCard({
  expenseCategories,
  frequentCategoryIds,
  bulkCategoryId,
  bulkShare,
  persons,
  pendingCount,
  duplicateCount,
  onCategoryChange,
  onShareChange,
  onApplyCategory,
  onApplyShare,
  onIgnoreDuplicates,
}: ImportBatchDefaultsCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const selectedCategory = expenseCategories.find((c) => c.id === bulkCategoryId)
  const repartoSummary = importRepartoSummary(bulkShare, (role) => importShareLabelForRole(role, persons))
  const repartoChip = bulkShare.isShared
    ? SPLIT_PRESETS.find((preset) => preset.value === bulkShare.splitPreset)?.label ??
      `${bulkShare.sharePersonA} / ${bulkShare.sharePersonB}`
    : payerDisplayLabel(bulkShare.paidBy, persons)

  const primaryCategories = useMemo(
    () =>
      buildImportCategoryButtons(
        expenseCategories,
        frequentCategoryIds,
        bulkCategoryId || null,
        null,
        PRIMARY_CATEGORY_LIMIT,
      ),
    [expenseCategories, frequentCategoryIds, bulkCategoryId],
  )

  const categoryOptions = useMemo(() => {
    if (!showAllCategories) return primaryCategories
    const seen = new Set(primaryCategories.map((c) => c.id))
    const extra = expenseCategories.filter((c) => !seen.has(c.id))
    return [...primaryCategories, ...extra]
  }, [expenseCategories, primaryCategories, showAllCategories])

  return (
    <section className="border-t border-stone-200 pt-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-1 h-4 w-4 shrink-0 rounded-full border border-brand-500 bg-brand-500"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">Defaults del lote</p>
          <p className="text-xs text-stone-500">
            Aplicar a {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="ml-7 mt-2 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <ChoiceChip
            shape="pill"
            size="sm"
            selected={Boolean(selectedCategory)}
            onClick={() => setEditOpen(true)}
          >
            {selectedCategory?.name ?? 'Sin categoría'}
          </ChoiceChip>
          <ChoiceChip shape="pill" size="sm" onClick={() => setEditOpen(true)}>
            {repartoChip}
          </ChoiceChip>
          <button
            type="button"
            onClick={() => setEditOpen((open) => !open)}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
          >
            {editOpen ? 'Cerrar ajustes' : 'Ajustar'}
          </button>
        </div>

        {editOpen && (
          <div className="space-y-3 rounded-lg bg-surface-100/80 p-2.5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-600">Categoría masiva</span>
              <div className="flex flex-wrap gap-1.5">
                {categoryOptions.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    shape="pill"
                    size="sm"
                    selected={bulkCategoryId === option.id}
                    onClick={() => onCategoryChange(option.id)}
                  >
                    {option.name}
                  </ChoiceChip>
                ))}
                <ChoiceChip
                  shape="pill"
                  size="sm"
                  onClick={() => setShowAllCategories((open) => !open)}
                >
                  {showAllCategories ? 'Ver menos' : 'Más'}
                </ChoiceChip>
              </div>
            </div>

            <ImportShareControls
              compact
              idPrefix="import-bulk-share"
              paidBy={bulkShare.paidBy}
              isShared={bulkShare.isShared}
              sharePersonA={bulkShare.sharePersonA}
              sharePersonB={bulkShare.sharePersonB}
              splitPreset={bulkShare.splitPreset}
              persons={persons}
              summaryText={repartoSummary}
              onChange={onShareChange}
            />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={!bulkCategoryId} onClick={onApplyCategory}>
                Aplicar categoría a pendientes
              </Button>
              <Button size="sm" variant="secondary" onClick={onApplyShare}>
                Aplicar reparto a pendientes
              </Button>
              {duplicateCount > 0 && (
                <Button size="sm" variant="ghost" onClick={onIgnoreDuplicates}>
                  Ignorar {duplicateCount} duplicados
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
