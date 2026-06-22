import { useMemo, useState } from 'react'
import { ImportCategoryPicker } from '@/components/ImportCategoryPicker'
import type { ImportMerchantGroup } from '@/lib/import-display'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Form'
import type { Category } from '@/types'

interface ImportMerchantBulkActionsCardProps {
  groups: ImportMerchantGroup[]
  expenseCategories: Category[]
  frequentCategoryIds: string[]
  pendingItems: { id: string; selectedCategoryId: string | null }[]
  onApplyCategory: (groupKey: string, categoryId: string) => void
  embedded?: boolean
}

function initialCategoryForGroup(
  group: ImportMerchantGroup,
  pendingItems: { id: string; selectedCategoryId: string | null }[],
): string | null {
  const selected = group.itemIds
    .map((id) => pendingItems.find((item) => item.id === id)?.selectedCategoryId)
    .filter(Boolean) as string[]
  if (selected.length === 0) return null
  const first = selected[0]
  return selected.every((id) => id === first) ? first : null
}

export function ImportMerchantBulkActionsCard({
  groups,
  expenseCategories,
  frequentCategoryIds,
  pendingItems,
  onApplyCategory,
  embedded = false,
}: ImportMerchantBulkActionsCardProps) {
  const [categoryByGroup, setCategoryByGroup] = useState<Record<string, string>>({})

  const resolvedCategories = useMemo(() => {
    const resolved: Record<string, string> = { ...categoryByGroup }
    for (const group of groups) {
      if (resolved[group.key]) continue
      const initial = initialCategoryForGroup(group, pendingItems)
      if (initial) resolved[group.key] = initial
    }
    return resolved
  }, [categoryByGroup, groups, pendingItems])

  if (groups.length === 0) return null

  const groupList = (
    <div className={embedded ? 'space-y-3' : 'ml-7 mt-3 space-y-3'}>
      {groups.map((group) => {
        const selectedCategoryId = resolvedCategories[group.key] ?? null
        return (
          <div
            key={group.key}
            className="space-y-2 rounded-lg border border-stone-200 bg-surface-50/70 p-2.5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="min-w-0 text-sm font-semibold text-stone-900">{group.displayName}</p>
              <p className="shrink-0 text-xs text-stone-500">
                {group.count} fila{group.count === 1 ? '' : 's'} · ~{formatCurrency(group.totalArs, 'ARS')}
              </p>
            </div>

            <ImportCategoryPicker
              idPrefix={`import-merchant-${group.key}`}
              expenseCategories={expenseCategories}
              frequentCategoryIds={frequentCategoryIds}
              selectedCategoryId={selectedCategoryId}
              onChange={(categoryId) =>
                setCategoryByGroup((current) => ({ ...current, [group.key]: categoryId }))
              }
            />

            <Button
              size="sm"
              variant="secondary"
              disabled={!selectedCategoryId}
              onClick={() => {
                if (!selectedCategoryId) return
                onApplyCategory(group.key, selectedCategoryId)
              }}
            >
              Aplicar categoría a {group.count} fila{group.count === 1 ? '' : 's'}
            </Button>
          </div>
        )
      })}
    </div>
  )

  if (embedded) return groupList

  return (
    <section className="border-t border-stone-200 pt-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-1 h-4 w-4 shrink-0 rounded-full border border-stone-300 bg-stone-100"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">Comercios repetidos</p>
          <p className="text-xs text-stone-500">
            Aplicá una categoría a todas las filas del mismo comercio
          </p>
        </div>
      </div>
      {groupList}
    </section>
  )
}
