import { Card } from '@/components/ui/Card'
import { deltaBadgeTones } from '@/components/ui/MetricCard'
import type { MetricDelta, PeriodComparison } from '@/lib/dashboard-insights'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'

function DeltaBadge({ delta }: { delta: MetricDelta }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight',
        deltaBadgeTones[delta.tone],
      )}
    >
      {delta.text}
    </span>
  )
}

interface DashboardSummaryBentoProps {
  netBalance: number
  totalIncome: number
  totalExpenses: number
  comparison: PeriodComparison
  currencyConfig: CurrencyConfig
  expensesLabel?: string
}

export function DashboardSummaryBento({
  netBalance,
  totalIncome,
  totalExpenses,
  comparison,
  currencyConfig,
  expensesLabel = 'Gastos',
}: DashboardSummaryBentoProps) {
  return (
    <Card compact className="bg-gradient-to-br from-white to-surface-50">
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-semibold uppercase tracking-wide', textMuted)}>Saldo neto</p>
        {comparison.netBalance && <DeltaBadge delta={comparison.netBalance} />}
      </div>
      <p
        className={cn(
          'mt-1 text-3xl font-bold tabular-nums tracking-tight',
          netBalance >= 0 ? 'text-emerald-800' : 'text-red-700',
        )}
      >
        {formatInViewCurrency(netBalance, currencyConfig)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
        <div className="rounded-lg bg-emerald-50/60 px-3 py-2">
          <p className={cn('text-[11px] font-medium', textMuted)}>Ingresos</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700">
            {formatInViewCurrency(totalIncome, currencyConfig)}
          </p>
        </div>
        <div className="rounded-lg bg-red-50/50 px-3 py-2">
          <p className={cn('text-[11px] font-medium', textMuted)}>{expensesLabel}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-red-700">
            {formatInViewCurrency(totalExpenses, currencyConfig)}
          </p>
        </div>
      </div>
    </Card>
  )
}
