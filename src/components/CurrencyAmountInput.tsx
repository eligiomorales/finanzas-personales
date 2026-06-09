import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { currencyInputPrefix, parseAmountInput } from '@/lib/movement-form-defaults'
import type { CurrencyCode } from '@/types'

interface CurrencyAmountInputProps {
  id: string
  currency: CurrencyCode
  value: number
  onChange: (amount: number) => void
  invalid?: boolean
  autoFocus?: boolean
  'aria-describedby'?: string
}

export const CurrencyAmountInput = forwardRef<HTMLInputElement, CurrencyAmountInputProps>(function CurrencyAmountInput(
  {
    id,
    currency,
    value,
    onChange,
    invalid,
    autoFocus,
    'aria-describedby': ariaDescribedBy,
  },
  ref,
) {
  return (
    <div
      className={cn(
        'flex min-w-0 overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
        invalid ? 'border-red-400' : 'border-stone-300',
      )}
    >
      <span
        className="flex shrink-0 items-center border-r border-stone-300 bg-surface-50 px-3 py-3 text-sm font-semibold text-stone-600"
        aria-hidden="true"
      >
        {currencyInputPrefix(currency)}
      </span>
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
        className="min-w-0 flex-1 bg-white px-3 py-3 text-sm outline-none"
        value={value > 0 ? String(value) : ''}
        placeholder="0"
        onChange={(e) => onChange(parseAmountInput(e.target.value))}
      />
    </div>
  )
})
