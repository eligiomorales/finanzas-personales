import { useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMovementsInRange, useCategories, useSettings, useBudgets } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { getCurrencyConfig, formatInViewCurrency } from '@/lib/currency'
import {
  getLast6MonthsRange,
  buildMonthlyTrends,
  buildCumulativeSpendSeries,
} from '@/lib/monthly-trends'
import {
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
} from '@/lib/balance'
import { buildBudgetProgress } from '@/lib/budget'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { Card, EmptyState } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { motionVariants } from '@/design/motion'
import { TrendChartCarousel } from '@/components/trends/TrendChartCarousel'
import { TREND_CAROUSEL_BODY_MIN_H } from '@/components/trends/chart-layout'
import { CashFlowChart } from '@/components/trends/CashFlowChart'
import { CumulativeSpendChart } from '@/components/trends/CumulativeSpendChart'
import { CategoryDonutBreakdown } from '@/components/trends/CategoryDonutBreakdown'
import { cn } from '@/lib/utils'
import type { BudgetProgressStatus } from '@/types'

// ponytail: stable ref — recomputes on page refresh, not on every render.
// Ceiling: stale if tab stays open past a month boundary.
const RANGE = getLast6MonthsRange()

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

export function TrendPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const categories = useCategories() ?? []
  const budgets = useBudgets() ?? []
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const { isPersonal } = useExpenseViewMode()
  const persons = useCouplePersons()
  const myRole = persons.myRole ?? 'personA'
  const { movements } = useMovementsInRange(RANGE)

  const currentYearMonth = format(new Date(), 'yyyy-MM')
  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth)

  const trendOptions = useMemo(
    () => ({ personalRole: isPersonal ? myRole : undefined }),
    [isPersonal, myRole],
  )

  const months = useMemo(
    () => buildMonthlyTrends(movements, currencyConfig, trendOptions),
    [movements, currencyConfig, trendOptions],
  )

  const cumulativePoints = useMemo(
    () => buildCumulativeSpendSeries(movements, currencyConfig, trendOptions),
    [movements, currencyConfig, trendOptions],
  )

  const monthMovements = useMemo(
    () => movements.filter((m) => m.date.startsWith(selectedYearMonth)),
    [movements, selectedYearMonth],
  )

  const filteredSummary = useMemo(() => {
    if (isPersonal) {
      return calculatePersonalExpenseSummary(monthMovements, categories, currencyConfig, myRole)
    }
    return calculatePeriodSummary(monthMovements, categories, currencyConfig)
  }, [monthMovements, categories, currencyConfig, isPersonal, myRole])

  const budgetSummary = useMemo(() => {
    if (isPersonal) return null
    return buildBudgetProgress({
      budgets,
      movements: monthMovements,
      categories,
      currencyConfig,
      yearMonth: selectedYearMonth,
    })
  }, [isPersonal, budgets, monthMovements, categories, currencyConfig, selectedYearMonth])

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

  const selectedMonthLabel = months.find((m) => m.yearMonth === selectedYearMonth)?.label

  const handleSelectMonth = useCallback((yearMonth: string) => {
    setSelectedYearMonth(yearMonth)
  }, [])

  const hasAnyData = months.some((m) => m.totalExpenses > 0 || m.totalIncome > 0)

  const carouselSlides = useMemo(
    () => [
      {
        id: 'cashflow',
        label: 'Flujo de caja',
        content: (
          <div className="space-y-2">
            <SectionHeader label="Flujo de caja" />
            <Card className="py-6">
              <div className={`flex flex-col ${TREND_CAROUSEL_BODY_MIN_H}`}>
                <CashFlowChart
                  months={months}
                  currencyConfig={currencyConfig}
                  selectedYearMonth={selectedYearMonth}
                  onSelectMonth={handleSelectMonth}
                />
              </div>
            </Card>
          </div>
        ),
      },
      {
        id: 'pace',
        label: 'Ritmo de gasto',
        content: (
          <div className="space-y-2">
            <SectionHeader label="Ritmo de gasto" />
            <Card className="py-6">
              <div className={`flex flex-col ${TREND_CAROUSEL_BODY_MIN_H}`}>
                {cumulativePoints.length > 0 ? (
                  <CumulativeSpendChart points={cumulativePoints} currencyConfig={currencyConfig} />
                ) : (
                  <p className="py-12 text-center text-sm text-stone-500">
                    Sin gastos este mes todavía
                  </p>
                )}
              </div>
            </Card>
          </div>
        ),
      },
    ],
    [months, cumulativePoints, currencyConfig, selectedYearMonth, handleSelectMonth],
  )

  if (!hasAnyData) {
    return (
      <EmptyState
        title="Sin datos en los últimos 6 meses"
        description="Registrá movimientos para ver la evolución mensual"
        actions={[{ label: 'Registrar movimiento', to: '/movimientos/nuevo' }]}
      />
    )
  }

  return (
    <motion.div
      className="space-y-4"
      variants={motionVariants.blurIn}
      initial="initial"
      animate="animate"
    >
      <TrendChartCarousel slides={carouselSlides} />

      {!isPersonal && (budgetSummary?.totalBudgeted ?? 0) > 0 && (
        <div className="space-y-2">
          <SectionHeader label="Presupuesto compartido">
            {selectedYearMonth !== currentYearMonth && selectedMonthLabel ? (
              <span className="shrink-0 text-xs font-medium capitalize text-brand-600">
                {selectedMonthLabel}
              </span>
            ) : null}
          </SectionHeader>
          <Card
            compact
            onClick={() => navigate('/analisis/presupuesto')}
            className="space-y-2"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  budgetSummary!.totalRemaining >= 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {formatInViewCurrency(Math.abs(budgetSummary!.totalRemaining), currencyConfig)}{' '}
                {budgetSummary!.totalRemaining >= 0 ? 'disponible' : 'excedido'}
              </p>
              <span
                className={cn(
                  'shrink-0 text-sm font-bold tabular-nums',
                  percentStatusColorClass(budgetOverallStatus),
                )}
              >
                {Math.round(budgetOverallPercent * 100)}%
              </span>
            </div>
            <BudgetProgressBar
              percentUsed={budgetOverallPercent}
              status={budgetOverallStatus}
            />
            <p className="text-right text-xs tabular-nums text-stone-500">
              {formatInViewCurrency(budgetSummary!.totalSpent, currencyConfig)}
              {' / '}
              {formatInViewCurrency(budgetSummary!.totalBudgeted, currencyConfig)}
            </p>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <SectionHeader label={isPersonal ? 'Mis gastos por categoría' : 'Gastos por categoría'}>
          {selectedYearMonth !== currentYearMonth && selectedMonthLabel ? (
            <span className="shrink-0 text-xs font-medium capitalize text-brand-600">
              {selectedMonthLabel}
            </span>
          ) : null}
        </SectionHeader>
        <Card className="py-6">
          <CategoryDonutBreakdown
            categories={filteredSummary.expensesByCategory}
            total={filteredSummary.totalExpenses}
            currencyConfig={currencyConfig}
            budgetByCategory={budgetByCategory}
            showBudget={!isPersonal}
          />
        </Card>
      </div>
    </motion.div>
  )
}
