import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { DashboardInsight } from '@/lib/dashboard-insights'
import { Button } from '@/components/ui/Form'

const toneStyles = {
  positive: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/60',
    title: 'text-emerald-900',
    description: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'En buen camino',
  },
  negative: {
    border: 'border-red-200',
    bg: 'bg-red-50/60',
    title: 'text-red-900',
    description: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    label: 'Atención',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/60',
    title: 'text-amber-900',
    description: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Para revisar',
  },
  neutral: {
    border: 'border-brand-200',
    bg: 'bg-brand-50/60',
    title: 'text-slate-900',
    description: 'text-slate-700',
    badge: 'bg-brand-100 text-brand-700',
    label: 'Estado del mes',
  },
}

export function InsightCard({ insight }: { insight: DashboardInsight }) {
  const styles = toneStyles[insight.tone]

  return (
    <section
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        styles.border,
        styles.bg,
      )}
      aria-labelledby="dashboard-insight-title"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          <Link to={insight.action.to}>
            <Button size="sm">{insight.action.label}</Button>
          </Link>
          {insight.action.to === '/movimientos/nuevo' && (
            <Link to="/importar">
              <Button size="sm" variant="secondary">
                Importar resumen
              </Button>
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
