import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'

export type MetricVariant = 'default' | 'income' | 'expense' | 'neutral'

const valueColors: Record<MetricVariant, string> = {
  default: 'text-stone-900',
  income: 'text-emerald-700',
  expense: 'text-red-700',
  neutral: 'text-blue-700',
}

const deltaColors = {
  positive: 'text-emerald-700',
  negative: 'text-red-700',
  neutral: 'text-stone-500',
}

const deltaBadgeTones = {
  positive: 'bg-emerald-50 text-emerald-700',
  negative: 'bg-red-50 text-red-700',
  neutral: 'bg-stone-100 text-stone-500',
}

interface MetricCardProps {
  label: string
  value: string
  variant?: MetricVariant
  delta?: { text: string; tone: 'positive' | 'negative' | 'neutral' }
  compact?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  variant = 'default',
  delta,
  compact,
  className,
}: MetricCardProps) {
  return (
    <Card compact={compact} className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-xs font-semibold uppercase tracking-wide', textMuted)}>{label}</span>
        {delta && (
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight',
              deltaBadgeTones[delta.tone],
            )}
          >
            {delta.text}
          </span>
        )}
      </div>
      <span className={cn('text-xl font-bold tabular-nums tracking-tight', valueColors[variant])}>
        {value}
      </span>
      {delta && compact && (
        <span className={cn('text-xs font-medium', deltaColors[delta.tone])}>{delta.text}</span>
      )}
    </Card>
  )
}

/** @deprecated Use MetricCard — kept for gradual migration */
export function StatCard(props: MetricCardProps) {
  return <MetricCard {...props} />
}

export { deltaBadgeTones, deltaColors, valueColors as metricValueColors }
