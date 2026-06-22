import { useMemo } from 'react'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { CumulativeSpendPoint } from '@/lib/monthly-trends'
import { TREND_PACE_CHART_H } from '@/components/trends/chart-layout'

const CHART_H = TREND_PACE_CHART_H
const PAD = { l: 28, r: 8, t: 12, b: 28 }

function formatAxisValue(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`
  return String(Math.round(amount))
}

function toPolyline(
  points: CumulativeSpendPoint[],
  key: 'currentCumulative' | 'baselineCumulative',
  xForDay: (day: number) => number,
  y: (v: number) => number,
): string {
  return points
    .filter((p) => p[key] != null)
    .map((p) => `${xForDay(p.day)},${y(p[key] as number)}`)
    .join(' ')
}

interface CumulativeSpendChartProps {
  points: CumulativeSpendPoint[]
  currencyConfig: CurrencyConfig
}

export function CumulativeSpendChart({ points, currencyConfig }: CumulativeSpendChartProps) {
  const layout = useMemo(() => {
    const w = 320
    const plotW = w - PAD.l - PAD.r
    const plotH = CHART_H - PAD.t - PAD.b
    const daysInMonth = points.length
    const maxY = Math.max(
      ...points.map((p) => Math.max(p.currentCumulative ?? 0, p.baselineCumulative)),
      1,
    )
    const xForDay = (day: number) =>
      PAD.l + (daysInMonth <= 1 ? plotW / 2 : ((day - 1) / (daysInMonth - 1)) * plotW)
    const y = (v: number) => PAD.t + plotH - (v / maxY) * plotH
    const ticks = [0, 0.5, 1].map((t) => ({
      y: PAD.t + plotH * (1 - t),
      label: formatAxisValue(maxY * t),
    }))
    return { w, plotH, maxY, xForDay, y, ticks, daysInMonth }
  }, [points])

  const currentPoints = useMemo(
    () => points.filter((p) => p.currentCumulative != null),
    [points],
  )

  if (points.length === 0 || currentPoints.length === 0) return null

  const { w, plotH, xForDay, y, ticks } = layout
  const plotBottom = PAD.t + plotH
  const last = currentPoints[currentPoints.length - 1]
  const currentLine = toPolyline(currentPoints, 'currentCumulative', xForDay, y)
  const baselineLine = toPolyline(points, 'baselineCumulative', xForDay, y)
  const areaPath = `${currentLine} L ${xForDay(last.day)},${plotBottom} L ${xForDay(currentPoints[0].day)},${plotBottom} Z`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <svg
        viewBox={`0 0 ${w} ${CHART_H}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Ritmo de gasto: mes actual hasta hoy vs promedio acumulado de los últimos tres meses"
      >
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.l}
              y1={tick.y}
              x2={w - PAD.r}
              y2={tick.y}
              className="stroke-surface-200"
              strokeWidth={1}
            />
            <text x={4} y={tick.y + 3} className="fill-stone-400 text-[8px]">
              {tick.label}
            </text>
          </g>
        ))}

        <path d={areaPath} className="fill-amber-100" />
        <polyline
          points={baselineLine}
          fill="none"
          className="stroke-stone-400"
          strokeWidth={1.5}
        />
        <polyline
          points={currentLine}
          fill="none"
          className="stroke-amber-600"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <circle
          cx={xForDay(last.day)}
          cy={y(last.currentCumulative!)}
          r={3}
          className="fill-amber-600"
        />
        <text
          x={xForDay(last.day) - 4}
          y={y(last.currentCumulative!) - 8}
          textAnchor="end"
          className="fill-amber-700 text-[8px] font-semibold"
        >
          {formatInViewCurrency(last.currentCumulative!, currencyConfig)}
        </text>
      </svg>
      <div className="mt-1 flex justify-center gap-4 text-[10px] uppercase tracking-wide text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-stone-400" />
          Prom. 3 meses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-amber-600" />
          Este mes
        </span>
      </div>
    </div>
  )
}
