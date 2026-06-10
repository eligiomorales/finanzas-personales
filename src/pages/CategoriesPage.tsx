import { useMemo } from 'react'
import { useMovements, useCategories, useSettings, useBudgets } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { calculatePeriodSummary, calculatePersonalExpenseSummary } from '@/lib/balance'
import {
  buildCategoryExpenseComparison,
  buildPeriodComparison,
} from '@/lib/dashboard-insights'
import { buildBudgetProgress, getBudgetMonthKey } from '@/lib/budget'
import { BudgetProgressBar, BudgetProgressMeta } from '@/components/BudgetProgressBar'
import { formatInViewCurrency, getCurrencyConfig } from '@/lib/currency'
import { formatPeriodHeaderTitle } from '@/lib/period-presets'
import { previousPeriodForRange, cn } from '@/lib/utils'
import { Card, EmptyState, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextLink } from '@/components/ui/TextLink'
import { PeriodFilter } from '@/components/PeriodFilter'

const deltaColors = {
  positive: 'text-emerald-700',
  negative: 'text-red-700',
  neutral: 'text-stone-500',
}

export function CategoriesPage() {
  const movements = useMovements() ?? []
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal } = useExpenseViewMode()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const myRole = persons.myRole ?? 'personA'
  const { period, setPeriod } = usePeriod()
  const budgetMonth = useMemo(() => getBudgetMonthKey(period.from), [period.from])
  const budgets = useBudgets() ?? []

  const previousPeriod = useMemo(() => previousPeriodForRange(period), [period])

  const periodMovements = useMemo(
    () => movements.filter((m) => m.date >= period.from && m.date <= period.to && m.type === 'expense'),
    [movements, period],
  )

  const previousPeriodMovements = useMemo(
    () =>
      movements.filter(
        (m) =>
          m.date >= previousPeriod.from &&
          m.date <= previousPeriod.to &&
          m.type === 'expense',
      ),
    [movements, previousPeriod],
  )

  const summary = useMemo(() => {
    if (isPersonal) {
      return calculatePersonalExpenseSummary(periodMovements, categories, currencyConfig, myRole)
    }
    return calculatePeriodSummary(periodMovements, categories, currencyConfig)
  }, [periodMovements, categories, currencyConfig, isPersonal, myRole])

  const previousSummary = useMemo(() => {
    if (isPersonal) {
      return calculatePersonalExpenseSummary(
        previousPeriodMovements,
        categories,
        currencyConfig,
        myRole,
      )
    }
    return calculatePeriodSummary(previousPeriodMovements, categories, currencyConfig)
  }, [previousPeriodMovements, categories, currencyConfig, isPersonal, myRole])

  const comparison = useMemo(
    () => buildPeriodComparison(summary, previousSummary),
    [summary, previousSummary],
  )

  const categoriesWithDelta = useMemo(
    () => buildCategoryExpenseComparison(summary, previousSummary),
    [summary, previousSummary],
  )

  const budgetSummary = useMemo(() => {
    if (isPersonal) return null
    return buildBudgetProgress({
      budgets,
      movements,
      categories,
      currencyConfig,
      yearMonth: budgetMonth,
    })
  }, [isPersonal, budgets, movements, categories, currencyConfig, budgetMonth])

  const budgetByCategory = useMemo(
    () => new Map(budgetSummary?.categories.map((c) => [c.categoryId, c]) ?? []),
    [budgetSummary],
  )

  const maxTotal = categoriesWithDelta[0]?.total ?? 1

  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period])

  return (
    <div className="space-y-4">
      <PageHeader
        title={periodTitle}
        trailing={
          <PeriodFilter
            period={period}
            onChange={setPeriod}
            idPrefix="categories-period"
            variant="dates"
            datesLabelOnly
          />
        }
      >
        <PeriodFilter
          period={period}
          onChange={setPeriod}
          idPrefix="categories-period"
          variant="presets"
        />
      </PageHeader>

      <StatCard
        label={isPersonal ? 'Mis gastos del período' : 'Total gastos del período'}
        value={formatInViewCurrency(summary.totalExpenses, currencyConfig)}
        variant="expense"
        delta={comparison.expenses ?? undefined}
      />

      {!isPersonal && (budgetSummary?.totalBudgeted ?? 0) > 0 && (
        <Card compact className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Presupuesto compartido
            </p>
            <p className="text-sm text-stone-700">
              {formatInViewCurrency(budgetSummary!.totalSpent, currencyConfig)} de{' '}
              {formatInViewCurrency(budgetSummary!.totalBudgeted, currencyConfig)}
            </p>
          </div>
          <TextLink to="/presupuesto" className="text-sm">
            Editar →
          </TextLink>
        </Card>
      )}

      {categoriesWithDelta.length === 0 ? (
        <EmptyState
          title="Sin gastos categorizados"
          description="Registra gastos con categoría para ver el análisis"
        />
      ) : (
        <div className="space-y-3">
          {categoriesWithDelta.map((cat) => {
            const pct = summary.totalExpenses > 0 ? (cat.total / summary.totalExpenses) * 100 : 0
            const barWidth = (cat.total / maxTotal) * 100
            const budgetProgress = budgetByCategory.get(cat.categoryId)
            const showBudget = !isPersonal && budgetProgress && budgetProgress.budgeted > 0
            return (
              <Card key={cat.categoryId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {cat.color && (
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <span className="truncate font-medium text-stone-800">{cat.categoryName}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold tabular-nums text-stone-900">
                      {formatInViewCurrency(cat.total, currencyConfig)}
                    </p>
                    <p className="text-xs text-stone-500">{pct.toFixed(1)}% del total</p>
                    {cat.delta && (
                      <p className={cn('text-xs font-medium', deltaColors[cat.delta.tone])}>
                        {cat.delta.text}
                      </p>
                    )}
                  </div>
                </div>
                {showBudget && budgetProgress ? (
                  <>
                    <BudgetProgressBar
                      percentUsed={budgetProgress.percentUsed}
                      status={budgetProgress.status}
                      color={cat.color}
                    />
                    <div className="mt-1">
                      <BudgetProgressMeta
                        spent={budgetProgress.spent}
                        budgeted={budgetProgress.budgeted}
                        percentUsed={budgetProgress.percentUsed}
                        status={budgetProgress.status}
                        currencyConfig={currencyConfig}
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: cat.color ?? '#3b82f6',
                      }}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
