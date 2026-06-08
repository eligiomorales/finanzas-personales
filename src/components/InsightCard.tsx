import type { DashboardInsight } from '@/lib/dashboard-insights'
import { ButtonLink } from '@/components/ui/TextLink'
import { cardSurface } from '@/components/ui/styles'
import { cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'

const toneStyles = {
  positive: {
    border: 'border-emerald-200/80',
    bg: 'bg-emerald-50/60',
    title: 'text-emerald-900',
    description: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'En buen camino',
  },
  negative: {
    border: 'border-red-200/80',
    bg: 'bg-red-50/60',
    title: 'text-red-900',
    description: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    label: 'Atención',
  },
  warning: {
    border: 'border-amber-200/80',
    bg: 'bg-amber-50/60',
    title: 'text-amber-900',
    description: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Para revisar',
  },
  neutral: {
    border: 'border-brand-200/80',
    bg: 'bg-brand-50/60',
    title: 'text-stone-900',
    description: 'text-stone-700',
    badge: 'bg-brand-100 text-brand-700',
    label: 'Estado del mes',
  },
}

export function InsightCard({ insight }: { insight: DashboardInsight }) {
  const styles = toneStyles[insight.tone]

  return (
    <section
      className={cn(cardSurface, 'p-4', styles.border, styles.bg)}
      aria-labelledby="dashboard-insight-title"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-wide', textMuted)}>
            Cómo viene el mes
          </p>
          <h2 id="dashboard-insight-title" className={cn('mt-1 text-lg font-bold', styles.title)}>
            {insight.title}
          </h2>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', styles.badge)}>
          {styles.label}
        </span>
      </div>

      <p className={cn('text-sm leading-relaxed', styles.description)}>{insight.description}</p>

      {insight.action && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to={insight.action.to} size="sm">
            {insight.action.label}
          </ButtonLink>
          {insight.action.to === '/movimientos/nuevo' && (
            <ButtonLink to="/importar" size="sm" variant="secondary">
              Importar resumen
            </ButtonLink>
          )}
        </div>
      )}
    </section>
  )
}
