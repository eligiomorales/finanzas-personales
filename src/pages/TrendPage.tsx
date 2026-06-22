import { useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useMovementsInRange, useCategories, useSettings } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { getCurrencyConfig } from '@/lib/currency'
import {
  getLast6MonthsRange,
  buildMonthlyTrends,
  buildCumulativeSpendSeries,
} from '@/lib/monthly-trends'
import {
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
} from '@/lib/balance'
import { Card, EmptyState } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { motionVariants } from '@/design/motion'
import { TrendChartCarousel } from '@/components/trends/TrendChartCarousel'
import { TREND_CAROUSEL_BODY_MIN_H } from '@/components/trends/chart-layout'
import { CashFlowChart } from '@/components/trends/CashFlowChart'
import { CumulativeSpendChart } from '@/components/trends/CumulativeSpendChart'
import { CategoryDonutBreakdown } from '@/components/trends/CategoryDonutBreakdown'

// ponytail: stable ref — recomputes on page refresh, not on every render.
// Ceiling: stale if tab stays open past a month boundary.
const RANGE = getLast6MonthsRange()

export function TrendPage() {
  const settings = useSettings()
  const categories = useCategories() ?? []
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

  const filteredSummary = useMemo(() => {
    const monthMovements = movements.filter((m) => m.date.startsWith(selectedYearMonth))
    if (isPersonal) {
      return calculatePersonalExpenseSummary(monthMovements, categories, currencyConfig, myRole)
    }
    return calculatePeriodSummary(monthMovements, categories, currencyConfig)
  }, [movements, selectedYearMonth, categories, currencyConfig, isPersonal, myRole])

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
          />
        </Card>
      </div>
    </motion.div>
  )
}
