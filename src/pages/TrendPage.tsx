import { useCallback, useMemo, useState } from 'react'
import { endOfMonth, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMovementsInRange, useCategories, useSettings, useBudgets } from '@/hooks/useData'
import { useMovementFilters } from '@/contexts/MovementFiltersContext'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { getCurrencyConfig, formatInViewCurrency } from '@/lib/currency'
import {
  getLast6MonthsRange,
  buildMonthlyTrends,
  buildCumulativeSpendSeries,
  buildCategoryMonthlyTrends,
} from '@/lib/monthly-trends'
import {
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
} from '@/lib/balance'
import { buildBudgetProgress } from '@/lib/budget'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { Card, EmptyState } from '@/components/ui/Card'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { motionVariants } from '@/design/motion'
import { TrendChartCarousel } from '@/components/trends/TrendChartCarousel'
import { TrendCarouselSlide } from '@/components/trends/TrendCarouselSlide'
import { TREND_MONTH_SUMMARY_H } from '@/components/trends/chart-layout'
import { CashFlowChart } from '@/components/trends/CashFlowChart'
import { CumulativeSpendChart } from '@/components/trends/CumulativeSpendChart'
import { CategoryDonutBreakdown } from '@/components/trends/CategoryDonutBreakdown'
import { CategoryTrendBarChart } from '@/components/trends/CategoryTrendBarChart'
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
  const { setFilters } = useMovementFilters()
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

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

  const categoryTrends = useMemo(
    () =>
      buildCategoryMonthlyTrends({
        movements,
        currencyConfig,
        categories,
        options: trendOptions,
      }),
    [movements, currencyConfig, categories, trendOptions],
  )

  const activeCategoryTrend = useMemo(() => {
    if (categoryTrends.length === 0) return null
    if (selectedCategoryId && categoryTrends.some((t) => t.categoryId === selectedCategoryId)) {
      return categoryTrends.find((t) => t.categoryId === selectedCategoryId) ?? categoryTrends[0]
    }
    return categoryTrends[0]
  }, [categoryTrends, selectedCategoryId])

  const expenseTotalsByMonth = useMemo(
    () => new Map(months.map((m) => [m.yearMonth, m.totalExpenses])),
    [months],
  )

  const categoryShareForSelectedMonth = useMemo(() => {
    if (!activeCategoryTrend) return null
    const monthSpend = activeCategoryTrend.months.find((m) => m.yearMonth === selectedYearMonth)
    const monthTotal = expenseTotalsByMonth.get(selectedYearMonth) ?? 0
    if (!monthSpend || monthSpend.amount <= 0 || monthTotal <= 0) return null
    return (monthSpend.amount / monthTotal) * 100
  }, [activeCategoryTrend, selectedYearMonth, expenseTotalsByMonth])

  const selectedCategoryMonthAmount = useMemo(() => {
    if (!activeCategoryTrend) return 0
    return activeCategoryTrend.months.find((m) => m.yearMonth === selectedYearMonth)?.amount ?? 0
  }, [activeCategoryTrend, selectedYearMonth])

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

  const handleCategoryDrillDown = useCallback(
    (categoryId: string) => {
      const monthStart = parseISO(`${selectedYearMonth}-01`)
      setFilters({
        categoryId,
        dateFrom: format(monthStart, 'yyyy-MM-dd'),
        dateTo: format(endOfMonth(monthStart), 'yyyy-MM-dd'),
        type: 'expense',
      })
      navigate('/movimientos')
    },
    [selectedYearMonth, setFilters, navigate],
  )

  const hasAnyData = months.some((m) => m.totalExpenses > 0 || m.totalIncome > 0)

  const carouselSlides = useMemo(
    () => [
      {
        id: 'cashflow',
        label: 'Flujo de caja',
        content: (
          <TrendCarouselSlide label="Flujo de caja">
            <CashFlowChart
              months={months}
              currencyConfig={currencyConfig}
              selectedYearMonth={selectedYearMonth}
              onSelectMonth={handleSelectMonth}
            />
          </TrendCarouselSlide>
        ),
      },
      {
        id: 'category',
        label: 'Categoría',
        content: (
          <TrendCarouselSlide
            label="Tendencia por categoría"
            filter={
              categoryTrends.length > 0 ? (
                <div
                  className="flex w-full gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="radiogroup"
                  aria-label="Categoría"
                >
                  {categoryTrends.map((trend) => (
                    <ChoiceChip
                      key={trend.categoryId}
                      size="sm"
                      shape="pill"
                      role="radio"
                      selected={trend.categoryId === activeCategoryTrend?.categoryId}
                      onClick={() => setSelectedCategoryId(trend.categoryId)}
                      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: trend.color ?? '#78716c' }}
                        aria-hidden
                      />
                      {trend.categoryName}
                    </ChoiceChip>
                  ))}
                </div>
              ) : null
            }
          >
            {categoryTrends.length === 0 ? (
              <p className="py-12 text-center text-sm text-stone-500">
                Sin gastos categorizados en los últimos 6 meses
              </p>
            ) : activeCategoryTrend ? (
              <>
                <CategoryTrendBarChart
                  months={activeCategoryTrend.months}
                  categoryName={activeCategoryTrend.categoryName}
                  color={activeCategoryTrend.color}
                  selectedYearMonth={selectedYearMonth}
                  onSelectMonth={handleSelectMonth}
                  expenseTotalsByMonth={expenseTotalsByMonth}
                />
                <div
                  className={cn(
                    'mt-3 shrink-0 border-t border-stone-100 pt-3',
                    TREND_MONTH_SUMMARY_H,
                  )}
                >
                  {selectedMonthLabel && (
                    <div className="text-right">
                      <p className="text-xs font-semibold tabular-nums text-stone-800">
                        {selectedCategoryMonthAmount > 0
                          ? formatInViewCurrency(selectedCategoryMonthAmount, currencyConfig)
                          : '–'}
                      </p>
                      {categoryShareForSelectedMonth != null ? (
                        <p className="text-[10px] tabular-nums text-stone-500">
                          {categoryShareForSelectedMonth >= 10
                            ? `${Math.round(categoryShareForSelectedMonth)}%`
                            : `${categoryShareForSelectedMonth.toFixed(1)}%`}{' '}
                          del gasto total
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </TrendCarouselSlide>
        ),
      },
      {
        id: 'pace',
        label: 'Ritmo de gasto',
        content: (
          <TrendCarouselSlide label="Ritmo de gasto">
            {cumulativePoints.length > 0 ? (
              <CumulativeSpendChart points={cumulativePoints} currencyConfig={currencyConfig} />
            ) : (
              <p className="py-12 text-center text-sm text-stone-500">
                Sin gastos este mes todavía
              </p>
            )}
          </TrendCarouselSlide>
        ),
      },
    ],
    [months, cumulativePoints, currencyConfig, selectedYearMonth, handleSelectMonth, categoryTrends, activeCategoryTrend, expenseTotalsByMonth, categoryShareForSelectedMonth, selectedCategoryMonthAmount, selectedMonthLabel],
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

      {selectedYearMonth !== currentYearMonth && selectedMonthLabel && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2">
          <p className="text-xs font-medium capitalize text-brand-700">
            Viendo {selectedMonthLabel}
          </p>
          <button
            type="button"
            onClick={() => setSelectedYearMonth(currentYearMonth)}
            className="text-xs font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            Volver al mes actual
          </button>
        </div>
      )}

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
            onCategoryClick={handleCategoryDrillDown}
          />
        </Card>
      </div>
    </motion.div>
  )
}
