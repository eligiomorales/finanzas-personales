import { cn } from '@/lib/utils'
import type { PeriodRange } from '@/components/PeriodFilter'
import { PERIOD_PRESETS, activePeriodPresetId } from '@/lib/period-presets'

interface PeriodPresetsProps {
  period: PeriodRange
  onChange: (period: PeriodRange) => void
  className?: string
  compact?: boolean
}

export function PeriodPresets({ period, onChange, className, compact }: PeriodPresetsProps) {
  const activeId = activePeriodPresetId(period)

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Períodos rápidos">
      {PERIOD_PRESETS.map((preset) => {
        const selected = activeId === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            className={cn(
              'shrink-0 rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              selected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
            )}
            onClick={() => onChange(preset.range())}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}
