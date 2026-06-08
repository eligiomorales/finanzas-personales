import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  className?: string
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
  size = 'md',
  fullWidth = true,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex rounded-lg border border-stone-200 bg-surface-100 p-0.5',
        fullWidth && 'w-full',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'rounded-md font-medium transition-colors',
              focusRing,
              fullWidth && 'flex-1',
              size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
              selected
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-800',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
