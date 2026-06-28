import { Link } from 'react-router-dom'
import type { DashboardInsight } from '@/lib/dashboard-insights'
import { cardSurface, focusRing, textMuted } from '@/components/ui/styles'
import { cn } from '@/lib/utils'

const toneStyles = {
  positive: {
    border: 'border-emerald-200/80',
    bg: 'bg-emerald-50/60 hover:bg-emerald-50/80',
    title: 'text-emerald-900',
    description: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'En buen camino',
    chevron: 'text-emerald-600',
  },
  negative: {
    border: 'border-red-200/80',
    bg: 'bg-red-50/60 hover:bg-red-50/80',
    title: 'text-red-900',
    description: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    label: 'Atención',
    chevron: 'text-red-600',
  },
  warning: {
    border: 'border-amber-200/80',
    bg: 'bg-amber-50/60 hover:bg-amber-50/80',
    title: 'text-amber-900',
    description: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Para revisar',
    chevron: 'text-amber-600',
  },
  neutral: {
    border: 'border-brand-200/80',
    bg: 'bg-brand-50/60 hover:bg-brand-50/80',
    title: 'text-stone-900',
    description: 'text-stone-700',
    badge: 'bg-brand-100 text-brand-700',
    label: 'Estado del mes',
    chevron: 'text-brand-600',
  },
}

function InsightCardItem({ insight }: { insight: DashboardInsight }) {
  const styles = toneStyles[insight.tone]
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className={cn('text-sm font-semibold leading-snug', styles.title)}>{insight.title}</h2>
          <p className={cn('mt-0.5 line-clamp-2 text-xs leading-snug', styles.description)}>
            {insight.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', styles.badge)}>
            {styles.label}
          </span>
          {insight.action && (
            <span className={cn('text-sm', styles.chevron)} aria-hidden>
              →
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (!insight.action) {
    return (
      <section
        className={cn(cardSurface, 'block px-3 py-2.5', styles.border, styles.bg)}
        aria-label={insight.title}
      >
        {body}
      </section>
    )
  }

  return (
    <Link
      to={insight.action.to}
      className={cn(
        cardSurface,
        focusRing,
        'block px-3 py-2.5 transition-colors',
        styles.border,
        styles.bg,
      )}
      aria-label={`${insight.title}. ${insight.action.label}`}
    >
      {body}
    </Link>
  )
}

export function InsightCard({ insight }: { insight: DashboardInsight }) {
  return (
    <div className="space-y-2">
      <p className={cn('text-[11px] font-semibold uppercase tracking-wide', textMuted)}>
        Cómo viene el mes
      </p>
      <InsightCardItem insight={insight} />
    </div>
  )
}
