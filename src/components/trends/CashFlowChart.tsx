import { useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { toMotionSeconds, motionDurations, motionEasings } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { MonthlyTrend } from '@/lib/monthly-trends'
import { TREND_CHART_H } from '@/components/trends/chart-layout'

const CHART_H = TREND_CHART_H
const PAD = { l: 8, r: 8, t: 16, b: 28 }

interface CashFlowChartProps {
  months: MonthlyTrend[]
  currencyConfig: CurrencyConfig
  selectedYearMonth: string
  onSelectMonth: (yearMonth: string) => void
}

export function CashFlowChart({
  months,
  currencyConfig,
  selectedYearMonth,
  onSelectMonth,
}: CashFlowChartProps) {
  const { shouldAnimate } = useMotionPreferences()

  const layout = useMemo(() => {
    const w = 320
    const plotW = w - PAD.l - PAD.r
    const plotH = CHART_H - PAD.t - PAD.b
    const maxY = Math.max(...months.map((m) => m.totalIncome + m.totalExpenses), 1)
    const barW = plotW / months.length - 4
    const x = (i: number) =>
      PAD.l + i * (plotW / months.length) + (plotW / months.length - barW) / 2
    const y = (v: number) => PAD.t + plotH - (v / maxY) * plotH
    return { w, plotH, maxY, barW, x, y }
  }, [months])

  const { w, plotH, maxY, barW, x, y } = layout
  const plotBottom = PAD.t + plotH

  const defaultYearMonth = months.find((m) => m.isCurrent)?.yearMonth
  const isFiltering = defaultYearMonth !== undefined && selectedYearMonth !== defaultYearMonth
  const selectedMonth = months.find((m) => m.yearMonth === selectedYearMonth) ?? null

  const savingsPoints = months
    .map((m, i) => `${x(i) + barW / 2},${y(Math.max(m.netBalance, 0))}`)
    .join(' ')

  const handleMonthTap = useCallback(
    (yearMonth: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelectMonth(yearMonth)
    },
    [onSelectMonth],
  )

  const transition = shouldAnimate
    ? { duration: toMotionSeconds(motionDurations.fast), ease: motionEasings.standard }
    : { duration: 0 }

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${CHART_H}`}
        className="w-full min-h-[220px]"
        role="img"
        aria-label="Flujo de caja: ingresos, gastos y ahorro por mes. Tocá un mes para ver el detalle."
      >
        {months.map((month, i) => {
          const hasData = month.totalExpenses > 0 || month.totalIncome > 0
          const isSelected = month.yearMonth === selectedYearMonth
          const isDimmed = isFiltering && !isSelected

          if (!hasData) {
            return (
              <g key={month.yearMonth} opacity={isDimmed ? 0.45 : 1}>
                <rect
                  x={x(i) - 2}
                  y={PAD.t}
                  width={barW + 4}
                  height={plotH + PAD.b}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={handleMonthTap(month.yearMonth)}
                />
                <rect x={x(i)} y={plotBottom - 2} width={barW} height={2} className="fill-stone-100" rx={1} />
                <text
                  x={x(i) + barW / 2}
                  y={CHART_H - 6}
                  textAnchor="middle"
                  className={cn(
                    'pointer-events-none text-[10px] capitalize',
                    isSelected || month.isCurrent ? 'fill-stone-800 font-semibold' : 'fill-stone-400',
                  )}
                >
                  {month.label}
                </text>
              </g>
            )
          }

          const expH = (month.totalExpenses / maxY) * plotH
          const incH = (month.totalIncome / maxY) * plotH
          const bx = x(i)
          const expY = plotBottom - expH
          const incY = expY - incH

          return (
            <g key={month.yearMonth} opacity={isDimmed ? 0.45 : 1}>
              <rect
                x={bx - 2}
                y={PAD.t}
                width={barW + 4}
                height={plotH + PAD.b}
                fill="transparent"
                className="cursor-pointer"
                onClick={handleMonthTap(month.yearMonth)}
              />
              <rect
                x={bx} y={expY} width={barW} height={expH} rx={3}
                className={cn(month.isCurrent ? 'fill-red-400' : 'fill-red-200', isSelected && 'stroke-red-500 stroke-[1.5]')}
              />
              <rect
                x={bx} y={incY} width={barW} height={incH} rx={3}
                className={cn(month.isCurrent ? 'fill-emerald-500' : 'fill-emerald-200', isSelected && 'stroke-emerald-600 stroke-[1.5]')}
              />
              <text
                x={bx + barW / 2}
                y={CHART_H - 6}
                textAnchor="middle"
                className={cn(
                  'pointer-events-none text-[10px] capitalize',
                  isSelected || month.isCurrent ? 'fill-stone-800 font-semibold' : 'fill-stone-400',
                )}
              >
                {month.label}
              </text>
            </g>
          )
        })}

        {months.some((m) => m.netBalance > 0) && (
          <>
            <polyline
              points={savingsPoints}
              fill="none"
              className="pointer-events-none stroke-stone-900"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {months.map((m, i) =>
              m.netBalance > 0 ? (
                <circle key={m.yearMonth} cx={x(i) + barW / 2} cy={y(m.netBalance)} r={2.5} className="pointer-events-none fill-stone-900" />
              ) : null,
            )}
          </>
        )}
      </svg>

      {/* Resumen inline — nunca se corta, ocupa flujo normal debajo del gráfico */}
      <AnimatePresence initial={false}>
        {selectedMonth ? (
          <motion.div
            key={selectedMonth.yearMonth}
            initial={shouldAnimate ? { opacity: 0, y: -4 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldAnimate ? { opacity: 0, y: -4 } : undefined}
            transition={transition}
            className="mt-3 border-t border-stone-100 pt-3"
          >
            <p className="mb-2 text-[11px] font-semibold capitalize text-stone-500">
              {selectedMonth.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-stone-400">Ingresos</p>
                <p className="text-xs font-semibold tabular-nums text-emerald-700">
                  {selectedMonth.totalIncome > 0
                    ? formatInViewCurrency(selectedMonth.totalIncome, currencyConfig)
                    : '–'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">Gastos</p>
                <p className="text-xs font-semibold tabular-nums text-stone-800">
                  {selectedMonth.totalExpenses > 0
                    ? formatInViewCurrency(selectedMonth.totalExpenses, currencyConfig)
                    : '–'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">Ahorro</p>
                <p
                  className={cn(
                    'text-xs font-semibold tabular-nums',
                    selectedMonth.totalIncome === 0
                      ? 'text-stone-400'
                      : selectedMonth.netBalance >= 0
                        ? 'text-emerald-700'
                        : 'text-red-600',
                  )}
                >
                  {selectedMonth.totalIncome === 0
                    ? '–'
                    : selectedMonth.netBalance >= 0
                      ? formatInViewCurrency(selectedMonth.netBalance, currencyConfig)
                      : `−${formatInViewCurrency(Math.abs(selectedMonth.netBalance), currencyConfig)}`}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
