import { useState } from 'react'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { cn } from '@/lib/utils'
import { FormGroup, Select } from '@/components/ui/Form'
import type { Category } from '@/types'

interface ImportCategoryPickerProps {
  idPrefix: string
  expenseCategories: Category[]
  frequentCategoryIds: string[]
  selectedCategoryId: string | null
  suggestedCategoryId?: string | null
  onChange: (categoryId: string) => void
  label?: string
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

  const buttonCategories = buildImportCategoryButtons(
    expenseCategories,
    frequentCategoryIds,
    selectedCategoryId,
    suggestedCategoryId,
  )

  const selectedInButtons = buttonCategories.some((category) => category.id === selectedCategoryId)

  return (
    <FormGroup className="!mb-0">
      <span id={`${idPrefix}-label`} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>

      {buttonCategories.length > 0 && (
        <div
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4"
          role="radiogroup"
          aria-labelledby={`${idPrefix}-label`}
        >
          {buttonCategories.map((category) => {
            const isSelected = selectedCategoryId === category.id
            const isSuggested =
              suggestedCategoryId === category.id && selectedCategoryId !== category.id

            return (
              <button
                key={category.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onChange(category.id)
                  setShowAllCategories(false)
                }}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <span className="block truncate">{category.name}</span>
                {isSuggested && (
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">Sugerida</span>
                )}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setShowAllCategories((open) => !open)}
            aria-expanded={showAllCategories}
            aria-controls={`${idPrefix}-all-categories`}
            className={cn(
              'rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
              showAllCategories
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            Ver todas
          </button>
        </div>
      )}

      {(showAllCategories || buttonCategories.length === 0 || !selectedInButtons) && (
        <Select
          id={`${idPrefix}-select`}
          className={buttonCategories.length > 0 ? 'mt-2' : undefined}
          value={selectedCategoryId ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      )}
    </FormGroup>
  )
}
