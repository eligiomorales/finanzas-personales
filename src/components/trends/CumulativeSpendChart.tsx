import { useMemo } from 'react'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { CumulativeSpendPoint } from '@/lib/monthly-trends'

const CHART_H = 200
const PAD = { l: 28, r: 8, t: 12, b: 22 }

function formatAxisValue(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`
  return String(Math.round(amount))
}

function toPolyline(
  points: CumulativeSpendPoint[],
  key: 'currentCumulative' | 'baselineCumulative',
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  return points.map((p, i) => `${x(i)},${y(p[key])}`).join(' ')
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
    const maxY = Math.max(
      ...points.map((p) => Math.max(p.currentCumulative, p.baselineCumulative)),
      1,
    )
    const x = (i: number) =>
      PAD.l + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
    const y = (v: number) => PAD.t + plotH - (v / maxY) * plotH
    const ticks = [0, 0.5, 1].map((t) => ({
      y: PAD.t + plotH * (1 - t),
      label: formatAxisValue(maxY * t),
    }))
    return { w, plotH, maxY, x, y, ticks }
  }, [points])

  if (points.length === 0) return null

  const { w, plotH, x, y, ticks } = layout
  const plotBottom = PAD.t + plotH
  const last = points[points.length - 1]
  const currentLine = toPolyline(points, 'currentCumulative', x, y)
  const baselineLine = toPolyline(points, 'baselineCumulative', x, y)
  const areaPath = `${currentLine} L ${x(points.length - 1)},${plotBottom} L ${x(0)},${plotBottom} Z`

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${CHART_H}`}
        className="w-full min-h-[200px]"
        role="img"
        aria-label="Ritmo de gasto acumulado del mes actual vs promedio de los últimos tres meses"
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
          cx={x(points.length - 1)}
          cy={y(last.currentCumulative)}
          r={3}
          className="fill-amber-600"
        />
        <text
          x={x(points.length - 1) - 4}
          y={y(last.currentCumulative) - 8}
          textAnchor="end"
          className="fill-amber-700 text-[8px] font-semibold"
        >
          {formatInViewCurrency(last.currentCumulative, currencyConfig)}
        </text>
      </svg>
      <p className="mt-1 text-right text-[10px] text-stone-400">
        Naranja = mes actual · gris = prom. diario últ. 3 meses
      </p>
    </div>
  )
}
