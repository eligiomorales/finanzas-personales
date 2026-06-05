import { Link } from 'react-router-dom'
import { BudgetProgressBar, BudgetProgressMeta } from '@/components/BudgetProgressBar'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { CategoryBudgetProgress, PeriodSummary } from '@/types'

interface DashboardCategoryBreakdownProps {
  expensesByCategory: PeriodSummary['expensesByCategory']
  totalExpenses: number
  currencyConfig: CurrencyConfig
  budgetProgress?: CategoryBudgetProgress[]
  showBudgetProgress?: boolean
}

export function DashboardCategoryBreakdown({
  expensesByCategory,
  totalExpenses,
  currencyConfig,
  budgetProgress,
  showBudgetProgress = false,
}: DashboardCategoryBreakdownProps) {
  if (expensesByCategory.length === 0) return null

  const progressByCategory = new Map(budgetProgress?.map((p) => [p.categoryId, p]) ?? [])
  const hasAnyBudget = budgetProgress?.some((p) => p.budgeted > 0) ?? false

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {showBudgetProgress && hasAnyBudget ? 'Presupuesto por categoría' : 'Gastos'}
        </p>
        <Link
          to={showBudgetProgress && hasAnyBudget ? '/presupuesto' : '/categorias'}
          className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {showBudgetProgress && hasAnyBudget ? 'Ver presupuesto →' : 'Ver análisis →'}
        </Link>
      </div>
      <div className="space-y-3">
        {expensesByCategory.map((cat, index) => {
          const progress = progressByCategory.get(cat.categoryId)
          const useBudgetBar = showBudgetProgress && progress && progress.budgeted > 0
          const pct = useBudgetBar
            ? Math.round(progress.percentUsed * 100)
            : totalExpenses > 0
              ? Math.round((cat.total / totalExpenses) * 100)
              : 0

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
                  {formatInViewCurrency(
                    useBudgetBar && progress ? progress.spent : cat.total,
                    currencyConfig,
                  )}
                </span>
              </div>
              {useBudgetBar && progress ? (
                <>
                  <div className="mt-1.5">
                    <BudgetProgressBar
                      percentUsed={progress.percentUsed}
                      status={progress.status}
                      color={cat.color}
                    />
                  </div>
                  <div className="mt-1">
                    <BudgetProgressMeta
                      spent={progress.spent}
                      budgeted={progress.budgeted}
                      percentUsed={progress.percentUsed}
                      status={progress.status}
                      currencyConfig={currencyConfig}
                    />
                  </div>
                </>
              ) : (
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
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
