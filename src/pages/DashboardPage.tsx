import { useMemo } from 'react'
import {
  useMovementsInRange,
  useMovementsQuery,
  useCategories,
  useSettings,
  useCoreDataLoading,
  usePendingImports,
  useBudgets,
} from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useAuth } from '@/contexts/AuthContext'
import { useDataContext } from '@/contexts/DataContext'
import {
  OnboardingBanner,
  useOnboarding,
} from '@/components/OnboardingBanner'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import {
  calculateCoupleBalance,
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
  movementVisibleInPersonalView,
} from '@/lib/balance'
import { buildDashboardInsights, buildPeriodComparison } from '@/lib/dashboard-insights'
import { buildBudgetProgress } from '@/lib/budget'
import { getCurrencyConfig } from '@/lib/currency'
import { formatPeriodHeaderTitle } from '@/lib/period-presets'
import { currentMonthRange, previousPeriodForRange } from '@/lib/utils'
import { DashboardHero } from '@/components/DashboardHero'
import { DashboardMovementList } from '@/components/DashboardMovementList'
import { InsightCard } from '@/components/InsightCard'
import { SkeletonDashboard } from '@/components/skeletons/SkeletonDashboard'

export function DashboardPage() {
  const { configured } = useAuth()
  const { mode } = useDataContext()
  const isCoreLoading = useCoreDataLoading()
  const categories = useCategories() ?? []
  const budgets = useBudgets() ?? []
  const pendingImports = usePendingImports() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal, mode: expenseViewMode } = useExpenseViewMode()

  const period = currentMonthRange()
  const previousPeriod = previousPeriodForRange(period)
  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period.from, period.to])

  const { movements: periodMovements, isLoading: periodMovementsLoading } = useMovementsInRange(period)
  const { movements: previousPeriodMovements } = useMovementsInRange(previousPeriod)
  const { movements: allMovements, isLoading: allMovementsLoading } = useMovementsQuery()

  const isLoading = isCoreLoading || periodMovementsLoading || allMovementsLoading

  const onboarding = useOnboarding({
    movementCount: periodMovements.length,
    persons,
    configured,
    mode,
  })

  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const myRole = persons.myRole ?? 'personA'

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

  const coupleBalance = useMemo(
    () => calculateCoupleBalance(allMovements, currencyConfig),
    [allMovements, currencyConfig],
  )

  const budgetSummary = useMemo(() => {
    if (isPersonal) return null
    return buildBudgetProgress({
      budgets,
      movements: periodMovements,
      categories,
      currencyConfig,
      yearMonth: period.from.slice(0, 7),
    })
  }, [isPersonal, budgets, periodMovements, categories, currencyConfig, period.from])

  const pendingImportCount = useMemo(
    () => pendingImports.filter((p) => p.status === 'pending').length,
    [pendingImports],
  )

  const insights = useMemo(
    () =>
      buildDashboardInsights({
        movements: periodMovements,
        coupleBalance,
        summary,
        previousSummary,
        comparison,
        budgetSummary,
        pendingImportCount,
        personAName: persons.personAName,
        personBName: persons.personBName,
        currencyConfig,
        isPersonal,
      }),
    [
      periodMovements,
      coupleBalance,
      summary,
      previousSummary,
      comparison,
      budgetSummary,
      pendingImportCount,
      persons.personAName,
      persons.personBName,
      currencyConfig,
      isPersonal,
    ],
  )

  const primaryInsight = insights[0]
  const secondaryInsights = insights.slice(1, 3)

  const recentMovements = useMemo(() => {
    if (!isPersonal) return periodMovements.slice(0, 5)
    return periodMovements.filter((m) => movementVisibleInPersonalView(m, myRole)).slice(0, 5)
  }, [periodMovements, isPersonal, myRole])

  const hasMovements = periodMovements.length > 0

  if (isLoading) {
    return <SkeletonDashboard />
  }

  return (
    <>
      <DashboardHero
        periodTitle={periodTitle}
        totalExpenses={summary.totalExpenses}
        totalIncome={summary.totalIncome}
        netBalance={summary.netBalance}
        expensesDelta={comparison.expenses}
        currencyConfig={currencyConfig}
        expensesLabel={isPersonal ? 'Mis gastos' : 'Gastado'}
        showPersonalBadge={isPersonal}
      />

      <div className="space-y-4 px-4 pt-4">
        {onboarding.visible && (
          <OnboardingBanner
            movementCount={onboarding.movementCount}
            needsNames={onboarding.needsNames}
            onDismiss={onboarding.dismiss}
          />
        )}

        <InsightCard insight={primaryInsight} secondaryInsights={secondaryInsights} />

        {hasMovements && (
          <DashboardMovementList
            movements={recentMovements}
            categories={categories}
            currencyConfig={currencyConfig}
            myRole={myRole}
            expenseViewMode={expenseViewMode}
          />
        )}
      </div>
    </>
  )
}
