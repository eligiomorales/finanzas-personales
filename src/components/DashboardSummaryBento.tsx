import { Card } from '@/components/ui/Card'
import type { MetricDelta, PeriodComparison } from '@/lib/dashboard-insights'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'

function DeltaBadge({ delta }: { delta: MetricDelta }) {
  const tones = {
    positive: 'bg-emerald-50 text-emerald-700',
    negative: 'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-500',
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight',
        tones[delta.tone],
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
    <Card compact>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">Saldo neto</p>
        {comparison.netBalance && <DeltaBadge delta={comparison.netBalance} />}
      </div>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums tracking-tight',
          netBalance >= 0 ? 'text-emerald-800' : 'text-red-700',
        )}
      >
        {formatInViewCurrency(netBalance, currencyConfig)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[11px] text-slate-500">Ingresos</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700">
            {formatInViewCurrency(totalIncome, currencyConfig)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">{expensesLabel}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-red-700">
            {formatInViewCurrency(totalExpenses, currencyConfig)}
          </p>
        </div>
      </div>
    </Card>
  )
}
