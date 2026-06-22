import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { FormGroup } from '@/components/ui/Form'
import type { Category } from '@/types'

const CHIP_GAP_PX = 6

interface ImportCategoryPickerProps {
  idPrefix: string
  expenseCategories: Category[]
  frequentCategoryIds: string[]
  selectedCategoryId: string | null
  suggestedCategoryId?: string | null
  onChange: (categoryId: string) => void
  label?: string
}

/** How many category chips fit before "Ver todas" in the collapsed row. */
export function computeCollapsedCategoryCount(
  containerWidth: number,
  categoryWidths: number[],
  toggleWidth: number,
  totalCategoryCount: number,
): { visibleCount: number; showToggle: boolean } {
  if (categoryWidths.length === 0) {
    return { visibleCount: 0, showToggle: false }
  }

  const rowWidth = (widths: number[]) =>
    widths.reduce((sum, width, index) => sum + width + (index > 0 ? CHIP_GAP_PX : 0), 0)

  if (containerWidth > 0 && rowWidth(categoryWidths) <= containerWidth && categoryWidths.length >= totalCategoryCount) {
    return { visibleCount: categoryWidths.length, showToggle: false }
  }

  const available = Math.max(0, containerWidth - toggleWidth - CHIP_GAP_PX)
  let used = 0
  let count = 0
  for (const width of categoryWidths) {
    const next = used + (count > 0 ? CHIP_GAP_PX : 0) + width
    if (next > available) break
    used = next
    count++
  }

  const showToggle = count < totalCategoryCount
  return {
    visibleCount: showToggle ? Math.max(count, 1) : count,
    showToggle,
  }
}

function ensureSelectedInPrimary(
  primary: Category[],
  selectedCategoryId: string | null,
  expenseCategories: Category[],
): Category[] {
  if (!selectedCategoryId || primary.some((category) => category.id === selectedCategoryId)) {
    return primary
  }
  const selected = expenseCategories.find((category) => category.id === selectedCategoryId)
  if (!selected) return primary
  return [...primary, selected]
}

function pickVisibleCategories(
  primary: Category[],
  visibleCount: number,
  selectedCategoryId: string | null,
): Category[] {
  const visible = primary.slice(0, visibleCount)
  if (!selectedCategoryId || visible.some((category) => category.id === selectedCategoryId)) {
    return visible
  }
  const selected = primary.find((category) => category.id === selectedCategoryId)
  if (!selected) return visible
  if (visible.length === 0) return [selected]
  return [...visible.slice(0, -1), selected]
}

function useCollapsedCategoryCount(
  primaryCategories: Category[],
  totalCategoryCount: number,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [{ visibleCount, showToggle }, setLayout] = useState(() => ({
    visibleCount: primaryCategories.length,
    showToggle: totalCategoryCount > primaryCategories.length,
  }))

  const primaryKey = primaryCategories.map((category) => category.id).join('|')

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    function update() {
      const containerEl = containerRef.current
      const measureEl = measureRef.current
      if (!containerEl || !measureEl) return

      const children = Array.from(measureEl.children) as HTMLElement[]
      if (children.length === 0) return

      const toggleWidth = children[children.length - 1]?.offsetWidth ?? 0
      const categoryWidths = children.slice(0, -1).map((child) => child.offsetWidth)
      setLayout(
        computeCollapsedCategoryCount(
          containerEl.clientWidth,
          categoryWidths,
          toggleWidth,
          totalCategoryCount,
        ),
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [primaryKey, totalCategoryCount])

  return { containerRef, measureRef, visibleCount, showToggle }
}

export function ImportCategoryPicker({
  idPrefix,
  expenseCategories,
  frequentCategoryIds,
  selectedCategoryId,
  suggestedCategoryId = null,
  onChange,
  label = 'Categoría',
}: ImportCategoryPickerProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)

  const primaryCategories = useMemo(
    () =>
      ensureSelectedInPrimary(
        buildImportCategoryButtons(
          expenseCategories,
          frequentCategoryIds,
          selectedCategoryId,
          suggestedCategoryId,
        ),
        selectedCategoryId,
        expenseCategories,
      ),
    [expenseCategories, frequentCategoryIds, selectedCategoryId, suggestedCategoryId],
  )

  const categoryOptions = useMemo(() => {
    if (!showAllCategories) return primaryCategories
    const seen = new Set(primaryCategories.map((category) => category.id))
    const extra = expenseCategories.filter((category) => !seen.has(category.id))
    return [...primaryCategories, ...extra]
  }, [expenseCategories, primaryCategories, showAllCategories])

  const { containerRef, measureRef, visibleCount, showToggle } = useCollapsedCategoryCount(
    primaryCategories,
    expenseCategories.length,
  )

  const collapsedCategories = useMemo(
    () => pickVisibleCategories(primaryCategories, visibleCount, selectedCategoryId),
    [primaryCategories, visibleCount, selectedCategoryId],
  )

  const labelId = `${idPrefix}-label`
  const allCategoriesId = `${idPrefix}-all-categories`

  function renderCategoryChip(category: Category) {
    const isSelected = selectedCategoryId === category.id
    const isSuggested = suggestedCategoryId === category.id && !isSelected

    return (
      <ChoiceChip
        key={category.id}
        role="radio"
        size="sm"
        align="start"
        selected={isSelected}
        className="shrink-0 whitespace-nowrap"
        onClick={() => {
          onChange(category.id)
          setShowAllCategories(false)
        }}
      >
        <span className="block">{category.name}</span>
        {isSuggested && (
          <span className="mt-0.5 block text-[10px] font-normal text-stone-400">Sugerida</span>
        )}
      </ChoiceChip>
    )
  }

  return (
    <FormGroup className="!mb-0">
      <span id={labelId} className="mb-1.5 block text-xs font-medium text-stone-600">
        {label}
      </span>

      {expenseCategories.length === 0 ? (
        <p className="text-xs text-stone-500">Sin categorías de gasto.</p>
      ) : showAllCategories ? (
        <div
          id={allCategoriesId}
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-labelledby={labelId}
        >
          {categoryOptions.map((category) => renderCategoryChip(category))}
          <ChoiceChip
            role="radio"
            size="sm"
            align="start"
            selected={showAllCategories}
            aria-expanded={showAllCategories}
            aria-controls={allCategoriesId}
            onClick={() => setShowAllCategories(false)}
          >
            Ver menos
          </ChoiceChip>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={containerRef}
            className="flex flex-nowrap gap-1.5 overflow-hidden"
            role="radiogroup"
            aria-labelledby={labelId}
          >
            {collapsedCategories.map((category) => renderCategoryChip(category))}
            {showToggle && (
              <ChoiceChip
                role="radio"
                size="sm"
                align="start"
                selected={showAllCategories}
                className="shrink-0 whitespace-nowrap"
                aria-expanded={showAllCategories}
                aria-controls={allCategoriesId}
                onClick={() => setShowAllCategories(true)}
              >
                Ver todas
              </ChoiceChip>
            )}
          </div>

          <div
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute inset-x-0 top-0 flex flex-nowrap gap-1.5"
          >
            {primaryCategories.map((category) => renderCategoryChip(category))}
            <ChoiceChip size="sm" align="start" className="shrink-0 whitespace-nowrap" tabIndex={-1}>
              Ver todas
            </ChoiceChip>
          </div>
        </div>
      )}
    </FormGroup>
  )
}
