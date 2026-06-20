import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  currencyInputPrefix,
  formatAmountInputValue,
  parseAmountInput,
} from '@/lib/movement-form-defaults'
import type { CurrencyCode } from '@/types'

function useAmountInputText(value: number, onChange: (amount: number) => void) {
  const [text, setText] = useState(() => formatAmountInputValue(value))

  useEffect(() => {
    setText((current) => {
      if (parseAmountInput(current) === value) return current
      return formatAmountInputValue(value)
    })
  }, [value])

  const handleChange = (raw: string) => {
    const sanitized = raw.replace(/[^\d.,]/g, '')
    setText(sanitized)
    onChange(parseAmountInput(sanitized))
  }

  return { text, handleChange }
}

interface CurrencyAmountInputProps {
  id: string
  currency: CurrencyCode
  value: number
  onChange: (amount: number) => void
  invalid?: boolean
  autoFocus?: boolean
  size?: 'default' | 'hero'
  variant?: 'boxed' | 'bare'
  trailing?: ReactNode
  className?: string
  'aria-describedby'?: string
}

export function CurrencyAmountInput({
  id,
  currency,
  value,
  onChange,
  invalid,
  autoFocus,
  size = 'default',
  variant = 'boxed',
  trailing,
  className,
  'aria-describedby': ariaDescribedBy,
}: CurrencyAmountInputProps) {
  const { text, handleChange } = useAmountInputText(value, onChange)
  const hero = size === 'hero'
  const bare = variant === 'bare'

  if (bare && hero) {
    return (
      <div className={cn('flex min-w-0 items-center gap-3 py-3', className)}>
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span
            className="shrink-0 text-2xl font-semibold tabular-nums text-stone-400"
            aria-hidden="true"
          >
            {currencyInputPrefix(currency)}
          </span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={autoFocus}
            aria-invalid={invalid}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'min-w-0 w-0 flex-1 border-0 bg-transparent py-1 text-4xl font-semibold tabular-nums tracking-tight text-stone-900 outline-none placeholder:text-stone-300',
              'focus-visible:ring-0',
            )}
            value={text}
            placeholder="0"
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
        {trailing}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-w-0 overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
        invalid ? 'border-red-400' : 'border-stone-300',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center border-r border-stone-300 bg-surface-50 font-semibold text-stone-600',
          hero ? 'px-3 py-3.5 text-base' : 'px-3 py-3 text-sm',
        )}
        aria-hidden="true"
      >
        {currencyInputPrefix(currency)}
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'min-w-0 flex-1 bg-white outline-none tabular-nums',
          hero ? 'px-3 py-3.5 text-2xl font-semibold' : 'px-3 py-3 text-sm',
        )}
        value={text}
        placeholder="0"
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  )
}
