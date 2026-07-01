import { useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CategoryMonthSpend } from '@/lib/monthly-trends'
import { TREND_CHART_H, TREND_BAR_SLOT_INSET } from '@/components/trends/chart-layout'

const CHART_H = TREND_CHART_H
const PAD = { l: 8, r: 8, t: 16, b: 28 }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length !== 6) return [120, 113, 108]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('')}`
}

/** Mix hex toward a target — same pattern as CashFlow fill-red-400 vs fill-red-200 */
function mixHex(hex: string, amount: number, target: string): string {
  const [r1, g1, b1] = hexToRgb(hex)
  const [r2, g2, b2] = hexToRgb(target)
  return rgbToHex(r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount)
}

function barFillColor(base: string, isCurrent: boolean): string {
  return isCurrent ? base : mixHex(base, 0.55, '#ffffff')
}

function barStrokeColor(base: string): string {
  return mixHex(base, 0.28, '#000000')
}

interface CategoryTrendBarChartProps {
  months: CategoryMonthSpend[]
  categoryName: string
  color?: string
  selectedYearMonth: string
  onSelectMonth: (yearMonth: string) => void
  /** Total expenses per yearMonth (all categories) for share % line */
  expenseTotalsByMonth: Map<string, number>
}

function monthSharePct(categoryAmount: number, monthTotal: number): number {
  if (monthTotal <= 0 || categoryAmount <= 0) return 0
  return (categoryAmount / monthTotal) * 100
}

export function CategoryTrendBarChart({
  months,
  categoryName,
  color = '#78716c',
  selectedYearMonth,
  onSelectMonth,
  expenseTotalsByMonth,
}: CategoryTrendBarChartProps) {
  const defaultYearMonth = months.find((m) => m.isCurrent)?.yearMonth
  const isFiltering = defaultYearMonth !== undefined && selectedYearMonth !== defaultYearMonth

  const handleMonthTap = useCallback(
    (yearMonth: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelectMonth(yearMonth)
    },
    [onSelectMonth],
  )
  const layout = useMemo(() => {
    const w = 320
    const plotW = w - PAD.l - PAD.r
    const plotH = CHART_H - PAD.t - PAD.b
    const maxY = Math.max(...months.map((m) => m.amount), 1)
    const barW = plotW / months.length - TREND_BAR_SLOT_INSET
    const x = (i: number) =>
      PAD.l + i * (plotW / months.length) + (plotW / months.length - barW) / 2
    const yShare = (pct: number) => PAD.t + plotH - (pct / 100) * plotH
    return { w, plotH, maxY, barW, x, yShare }
  }, [months])

  const { w, plotH, maxY, barW, x, yShare } = layout
  const plotBottom = PAD.t + plotH
  const total = months.reduce((sum, m) => sum + m.amount, 0)

  const shareValues = useMemo(
    () =>
      months.map((m) => {
        const monthTotal = expenseTotalsByMonth.get(m.yearMonth) ?? 0
        return monthSharePct(m.amount, monthTotal)
      }),
    [months, expenseTotalsByMonth],
  )

  const sharePoints = months
    .map((_, i) => `${x(i) + barW / 2},${yShare(shareValues[i])}`)
    .join(' ')

  const hasShareLine = shareValues.some((pct) => pct > 0)

  if (total <= 0) {
    return (
      <p className="py-12 text-center text-sm text-stone-500">
        Sin gastos en esta categoría en los últimos 6 meses
      </p>
    )
  }

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${w} ${CHART_H}`}
        className="w-full min-h-[220px]"
        role="img"
        aria-label={`Gasto mensual de ${categoryName} en los últimos 6 meses. Tocá un mes para ver el detalle.`}
      >
        {months.map((month, i) => {
          const hasData = month.amount > 0
          const isSelected = month.yearMonth === selectedYearMonth
          const isDimmed = isFiltering && !isSelected
          const barH = hasData ? (month.amount / maxY) * plotH : 0
          const bx = x(i)
          const barY = plotBottom - barH

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
              {!hasData ? (
                <rect x={bx} y={plotBottom - 2} width={barW} height={2} className="fill-stone-100" rx={1} />
              ) : (
                <rect
                  x={bx}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={barFillColor(color, month.isCurrent)}
                  stroke={isSelected ? barStrokeColor(color) : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
              )}
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

        {hasShareLine ? (
          <>
            <polyline
              points={sharePoints}
              fill="none"
              className="pointer-events-none stroke-stone-900"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {months.map((m, i) =>
              shareValues[i] > 0 ? (
                <circle
                  key={m.yearMonth}
                  cx={x(i) + barW / 2}
                  cy={yShare(shareValues[i])}
                  r={2.5}
                  className="pointer-events-none fill-stone-900"
                />
              ) : null,
            )}
          </>
        ) : null}
      </svg>
    </div>
  )
}
