import { useMemo } from 'react'
import { useMovements, useCategories, useSettings, useBudgets } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import {
  OnboardingBanner,
  useOnboarding,
} from '@/components/OnboardingBanner'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { usePeriod } from '@/contexts/PeriodContext'
import {
  calculateCoupleBalance,
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
  movementVisibleInPersonalView,
} from '@/lib/balance'
import { buildPeriodComparison } from '@/lib/dashboard-insights'
import { buildBudgetProgress, getBudgetMonthKey } from '@/lib/budget'
import { getCurrencyConfig } from '@/lib/currency'
import { formatPeriodHeaderTitle } from '@/lib/period-presets'
import { filterMovements, formatDate, previousPeriodForRange } from '@/lib/utils'
import { Card, EmptyState } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { PeriodFilter } from '@/components/PeriodFilter'
import { DashboardSummaryBento } from '@/components/DashboardSummaryBento'
import { DashboardCompensationRow } from '@/components/DashboardCompensationRow'
import { DashboardCategoryBreakdown } from '@/components/DashboardCategoryBreakdown'
import { DashboardMovementList } from '@/components/DashboardMovementList'

export function DashboardPage() {
  const movements = useMovements() ?? []
  const categories = useCategories() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { isPersonal, mode: expenseViewMode } = useExpenseViewMode()
  const onboarding = useOnboarding()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const myRole = persons.myRole ?? 'personA'
  const { period, setPeriod } = usePeriod()
  const budgetMonth = useMemo(() => getBudgetMonthKey(period.from), [period.from])
  const budgets = useBudgets() ?? []
  const previousPeriod = useMemo(() => previousPeriodForRange(period), [period])
  const periodTitle = useMemo(() => formatPeriodHeaderTitle(period), [period])

  const periodMovements = useMemo(
    () => filterMovements(movements, { dateFrom: period.from, dateTo: period.to }),
    [movements, period],
  )

  const previousPeriodMovements = useMemo(
    () =>
      filterMovements(movements, {
        dateFrom: previousPeriod.from,
        dateTo: previousPeriod.to,
      }),
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

  const coupleBalance = useMemo(
    () => calculateCoupleBalance(periodMovements, currencyConfig),
    [periodMovements, currencyConfig],
  )

  const personAName = persons.personAName
  const personBName = persons.personBName

  const recentMovements = useMemo(() => {
    if (!isPersonal) return periodMovements.slice(0, 5)
    return periodMovements.filter((m) => movementVisibleInPersonalView(m, myRole)).slice(0, 5)
  }, [periodMovements, isPersonal, myRole])

  const hasMovements = periodMovements.length > 0
  const balanceDebtorName = coupleBalance.owedBy === 'personA' ? personAName : personBName
  const balanceCreditorName = coupleBalance.owedBy === 'personA' ? personBName : personAName
  const hasPendingCompensation =
    coupleBalance.owedBy !== 'balanced' && coupleBalance.owedAmount > 0.01

  const periodSubtitle = [
    `Del ${formatDate(period.from)} al ${formatDate(period.to)}`,
    `montos en ${currencyConfig.displayCurrency}`,
    isPersonal ? 'Vista personal' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-4">
      {onboarding.visible && (
        <OnboardingBanner
          movementCount={onboarding.movementCount}
          needsNames={onboarding.needsNames}
          onDismiss={onboarding.dismiss}
        />
      )}

      <PageHeader
        title={periodTitle}
        subtitle={periodSubtitle}
        trailing={
          <PeriodFilter
            period={period}
            onChange={setPeriod}
            idPrefix="dashboard-period"
            variant="dates"
            datesLabelOnly
          />
        }
      >
        <PeriodFilter
          period={period}
          onChange={setPeriod}
          idPrefix="dashboard-period"
          variant="presets"
        />
      </PageHeader>

      {hasMovements ? (
        <>
          <DashboardSummaryBento
            netBalance={summary.netBalance}
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            comparison={comparison}
            currencyConfig={currencyConfig}
            expensesLabel={isPersonal ? 'Mis gastos' : 'Gastos'}
          />

          <DashboardCompensationRow
            hasPendingCompensation={hasPendingCompensation}
            debtorName={balanceDebtorName}
            creditorName={balanceCreditorName}
            owedAmount={coupleBalance.owedAmount}
            currencyConfig={currencyConfig}
          />

          {summary.expensesByCategory.length > 0 && (
            <DashboardCategoryBreakdown
              expensesByCategory={summary.expensesByCategory}
              totalExpenses={summary.totalExpenses}
              currencyConfig={currencyConfig}
              budgetProgress={budgetSummary?.categories}
              showBudgetProgress={!isPersonal}
            />
          )}

          <DashboardMovementList
            movements={recentMovements}
            categories={categories}
            currencyConfig={currencyConfig}
            myRole={myRole}
            expenseViewMode={expenseViewMode}
          />
        </>
      ) : (
        <Card>
          <EmptyState
            title="Sin movimientos en el período"
            description="Empezá registrando un gasto o importando un resumen bancario para ver el estado financiero del período seleccionado."
            actions={[
              { label: 'Registrar movimiento', to: '/movimientos/nuevo' },
              { label: 'Importar resumen', to: '/importar', variant: 'secondary' },
            ]}
          />
        </Card>
      )}
    </div>
  )
}
