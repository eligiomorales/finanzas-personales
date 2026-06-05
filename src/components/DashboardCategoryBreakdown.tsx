import { Link } from 'react-router-dom'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { PeriodSummary } from '@/types'

interface DashboardCategoryBreakdownProps {
  expensesByCategory: PeriodSummary['expensesByCategory']
  totalExpenses: number
  currencyConfig: CurrencyConfig
}

export function DashboardCategoryBreakdown({
  expensesByCategory,
  totalExpenses,
  currencyConfig,
}: DashboardCategoryBreakdownProps) {
  if (expensesByCategory.length === 0) return null

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gastos</p>
        <Link
          to="/categorias"
          className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Ver análisis →
        </Link>
      </div>
      <div className="space-y-3">
        {expensesByCategory.map((cat, index) => {
          const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0
          return (
            <div
              key={cat.categoryId}
              className={index >= 3 ? 'hidden md:block' : undefined}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                  {cat.categoryName}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
                  {formatInViewCurrency(cat.total, currencyConfig)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.color ?? undefined,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-slate-500">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
