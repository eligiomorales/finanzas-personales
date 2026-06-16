import { useMemo } from 'react'
import { useMovementsInRange, useCategories, useSettings, useBudgets } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { usePeriod } from '@/contexts/MovementFiltersContext'
import { calculatePeriodSummary, calculatePersonalExpenseSummary } from '@/lib/balance'
import {
  buildCategoryExpenseComparison,
  buildPeriodComparison,
} from '@/lib/dashboard-insights'
import { buildBudgetProgress, getBudgetMonthKey, getMonthDateRange } from '@/lib/budget'
import { BudgetMeter } from '@/components/BudgetProgressBar'
import { CategoryAvatar } from '@/components/CategoryAvatar'
import { formatInViewCurrency, getCurrencyConfig } from '@/lib/currency'
import { formatPeriodHeaderTitle } from '@/lib/period-presets'
import { previousPeriodForRange, cn } from '@/lib/utils'
import { Card, EmptyState } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { TextLink } from '@/components/ui/TextLink'
import { PeriodFilter } from '@/components/PeriodFilter'
import { deltaColors } from '@/components/ui/MetricCard'
import type { BudgetProgressStatus, CategoryBudgetProgress } from '@/types'
import type { CategoryExpenseWithDelta } from '@/lib/dashboard-insights'
import type { CurrencyConfig } from '@/lib/currency'

function overallBudgetStatus(
  totalBudgeted: number,
  totalSpent: number,
  totalRemaining: number,
): BudgetProgressStatus {
  if (totalBudgeted <= 0) return 'unbudgeted'
  if (totalRemaining < 0) return 'over'
  if (totalSpent / totalBudgeted >= 0.85) return 'near'
  return 'ok'
}

function percentStatusColorClass(status: BudgetProgressStatus): string {
  switch (status) {
    case 'near':
      return 'text-amber-600'
    case 'over':
      return 'text-red-600'
    case 'ok':
      return 'text-emerald-600'
    default:
      return 'text-stone-600'
  }
}

function CategoryExpenseCard({
  cat,
  sharePercent,
  currencyConfig,
  budgetProgress,
  showBudget,
}: {
  cat: CategoryExpenseWithDelta
  sharePercent: number
  currencyConfig: CurrencyConfig
  budgetProgress?: CategoryBudgetProgress
  showBudget: boolean
}) {
  return (
    <Card compact>
      <div className="flex items-start gap-3">
        <CategoryAvatar name={cat.categoryName} color={cat.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
              {cat.categoryName}
            </p>
            <span className="shrink-0 text-sm font-bold tabular-nums text-stone-600">
              {sharePercent.toFixed(1)}%
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold tabular-nums text-stone-900">
            {formatInViewCurrency(cat.total, currencyConfig)}
          </p>

          {showBudget && budgetProgress ? (
            <>
              <BudgetMeter
                spent={budgetProgress.spent}
                limit={budgetProgress.budgeted}
                percentUsed={budgetProgress.percentUsed}
                status={budgetProgress.status}
                color={cat.color}
                currencyConfig={currencyConfig}
              />
              {cat.delta && (
                <p className={cn('mt-1 text-right text-xs font-medium', deltaColors[cat.delta.tone])}>
                  {cat.delta.text}
                </p>
              )}
            </>
          ) : (
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(sharePercent, 100)}%`,
                    backgroundColor: cat.color ?? '#3b82f6',
                  }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-stone-500">
                {sharePercent.toFixed(1)}% del total
                {cat.delta && (
                  <>
                    {' · '}
                    <span className={cn('font-medium', deltaColors[cat.delta.tone])}>
                      {cat.delta.text}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function CategoriesPage() {
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal } = useExpenseViewMode()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const myRole = persons.myRole ?? 'personA'
  const { period, setPeriod } = usePeriod()
  const budgetMonth = useMemo(() => getBudgetMonthKey(period.from), [period.from])
  const budgetMonthRange = useMemo(() => getMonthDateRange(budgetMonth), [budgetMonth])
  const budgets = useBudgets() ?? []

  const previousPeriod = useMemo(() => previousPeriodForRange(period), [period])

  const { movements: periodMovementsRaw } = useMovementsInRange(period)
  const { movements: previousPeriodMovementsRaw } = useMovementsInRange(previousPeriod)
  const { movements: budgetMonthMovements } = useMovementsInRange(budgetMonthRange)

  const periodMovements = useMemo(
    () => periodMovementsRaw.filter((m) => m.type === 'expense'),
    [periodMovementsRaw],
  )

  const previousPeriodMovements = useMemo(
    () => previousPeriodMovementsRaw.filter((m) => m.type === 'expense'),
    [previousPeriodMovementsRaw],
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
      movements: budgetMonthMovements,
      categories,
      currencyConfig,
      yearMonth: budgetMonth,
    })
  }, [isPersonal, budgets, budgetMonthMovements, categories, currencyConfig, budgetMonth])

  const budgetByCategory = useMemo(
    () => new Map(budgetSummary?.categories.map((c) => [c.categoryId, c]) ?? []),
    [budgetSummary],
  )

  const budgetOverallStatus = budgetSummary
    ? overallBudgetStatus(
        budgetSummary.totalBudgeted,
        budgetSummary.totalSpent,
        budgetSummary.totalRemaining,
      )
    : 'unbudgeted'
  const budgetOverallPercent =
    budgetSummary && budgetSummary.totalBudgeted > 0
      ? budgetSummary.totalSpent / budgetSummary.totalBudgeted
      : 0

  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period])

  return (
    <div className="space-y-4">
      <PageHeader title={periodTitle}>
        <PeriodFilter
          period={period}
          onChange={setPeriod}
          idPrefix="categories-period"
          variant="full"
          datesLabelOnly
        />
      </PageHeader>

      <div className="space-y-2">
        <SectionHeader label={isPersonal ? 'Mis gastos del período' : 'Total gastos del período'}>
          {comparison.expenses && (
            <span className={cn('text-sm font-bold', deltaColors[comparison.expenses.tone])}>
              {comparison.expenses.text}
            </span>
          )}
        </SectionHeader>
        <Card compact>
          <p className="text-sm font-semibold tabular-nums text-stone-900">
            {formatInViewCurrency(summary.totalExpenses, currencyConfig)}
          </p>
        </Card>
      </div>

      {!isPersonal && (budgetSummary?.totalBudgeted ?? 0) > 0 && (
        <div className="space-y-2">
          <SectionHeader label="Presupuesto compartido">
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  percentStatusColorClass(budgetOverallStatus),
                )}
              >
                {Math.round(budgetOverallPercent * 100)}%
              </span>
              <TextLink to="/analisis/presupuesto" className="text-xs">
                Editar →
              </TextLink>
            </div>
          </SectionHeader>
          <Card compact>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                budgetSummary!.totalRemaining >= 0 ? 'text-emerald-700' : 'text-red-700',
              )}
            >
              {formatInViewCurrency(Math.abs(budgetSummary!.totalRemaining), currencyConfig)}{' '}
              {budgetSummary!.totalRemaining >= 0 ? 'disponible' : 'excedido'}
            </p>
            <BudgetMeter
              spent={budgetSummary!.totalSpent}
              limit={budgetSummary!.totalBudgeted}
              percentUsed={budgetOverallPercent}
              status={budgetOverallStatus}
              currencyConfig={currencyConfig}
            />
          </Card>
        </div>
      )}

      {categoriesWithDelta.length === 0 ? (
        <EmptyState
          title="Sin gastos categorizados"
          description="Registra gastos con categoría para ver el análisis"
        />
      ) : (
        <div className="space-y-2">
          <SectionHeader label="Por categoría" />
          <div className="space-y-3">
            {categoriesWithDelta.map((cat) => {
              const sharePercent =
                summary.totalExpenses > 0 ? (cat.total / summary.totalExpenses) * 100 : 0
              const budgetProgress = budgetByCategory.get(cat.categoryId)
              const showBudget = !isPersonal && budgetProgress != null && budgetProgress.budgeted > 0
              return (
                <CategoryExpenseCard
                  key={cat.categoryId}
                  cat={cat}
                  sharePercent={sharePercent}
                  currencyConfig={currencyConfig}
                  budgetProgress={budgetProgress}
                  showBudget={showBudget}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
