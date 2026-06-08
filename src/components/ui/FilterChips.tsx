import { cn } from '@/lib/utils'

export interface FilterChip {
  id: string
  label: string
}

interface FilterChipsProps {
  chips: FilterChip[]
  onRemove: (id: string) => void
  onClearAll?: () => void
  clearAllLabel?: string
  className?: string
  size?: 'default' | 'compact'
}

export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  clearAllLabel = 'Quitar todos',
  className,
  size = 'default',
}: FilterChipsProps) {
  if (chips.length === 0) return null

  const compact = size === 'compact'

  return (
    <div
      className={cn('flex flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2', className)}
      role="group"
      aria-label="Filtros activos"
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            'inline-flex max-w-full items-center gap-0.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-800',
            compact ? 'py-0.5 pl-2 pr-0.5 text-xs font-medium' : 'gap-1 rounded-full py-1 pl-3 pr-1 text-sm',
          )}
        >
          <span className="max-w-[10rem] truncate">{chip.label}</span>
          <button
            type="button"
            className={cn(
              'text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              compact ? 'rounded px-1 py-0.5 text-xs leading-none' : 'rounded-full p-1',
            )}
            aria-label={`Quitar filtro: ${chip.label}`}
            onClick={() => onRemove(chip.id)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          className={cn(
            'font-medium text-stone-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
            compact ? 'text-xs' : 'text-sm',
          )}
          onClick={onClearAll}
        >
          {clearAllLabel}
        </button>
      )}
    </div>
  )
}
