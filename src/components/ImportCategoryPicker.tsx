import { useState } from 'react'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
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
  const labelId = `${idPrefix}-label`

  return (
    <FormGroup className="!mb-0">
      <span id={labelId} className="mb-1 block text-xs font-medium text-stone-600">
        {label}
      </span>

      {buttonCategories.length > 0 && (
        <div
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4"
          role="radiogroup"
          aria-labelledby={labelId}
        >
          {buttonCategories.map((category) => {
            const isSelected = selectedCategoryId === category.id
            const isSuggested =
              suggestedCategoryId === category.id && selectedCategoryId !== category.id

            return (
              <ChoiceChip
                key={category.id}
                role="radio"
                size="sm"
                align="start"
                selected={isSelected}
                className="w-full"
                onClick={() => {
                  onChange(category.id)
                  setShowAllCategories(false)
                }}
              >
                <span className="block truncate">{category.name}</span>
                {isSuggested && (
                  <span className="mt-0.5 block text-[10px] font-normal text-stone-400">Sugerida</span>
                )}
              </ChoiceChip>
            )
          })}

          <ChoiceChip
            role="radio"
            size="sm"
            align="start"
            selected={showAllCategories}
            className="w-full"
            aria-expanded={showAllCategories}
            aria-controls={`${idPrefix}-all-categories`}
            onClick={() => setShowAllCategories((open) => !open)}
          >
            Ver todas
          </ChoiceChip>
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
