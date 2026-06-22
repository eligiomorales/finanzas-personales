import { useMemo } from 'react'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface CategorySlice {
  categoryId: string
  categoryName: string
  color?: string
  total: number
}

interface CategoryDonutBreakdownProps {
  categories: CategorySlice[]
  total: number
  currencyConfig: CurrencyConfig
}

const DONUT_SIZE = 200
const STROKE = 30
const R = (DONUT_SIZE - STROKE) / 2
const CX = DONUT_SIZE / 2
const CY = DONUT_SIZE / 2
const CIRC = 2 * Math.PI * R

function sliceOffset(index: number, lengths: number[]): number {
  return lengths.slice(0, index).reduce((sum, len) => sum + len, 0)
}

export function CategoryDonutBreakdown({
  categories,
  total,
  currencyConfig,
}: CategoryDonutBreakdownProps) {
  const slices = useMemo(() => {
    if (total <= 0) return []
    return categories.map((cat) => ({
      ...cat,
      pct: (cat.total / total) * 100,
      length: (cat.total / total) * CIRC,
    }))
  }, [categories, total])

  if (total <= 0 || slices.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        Sin gastos categorizados este mes
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-2">
        <div className="relative" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg width={DONUT_SIZE} height={DONUT_SIZE} className="-rotate-90" role="presentation">
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              className="stroke-surface-100"
              strokeWidth={STROKE}
            />
            {slices.map((slice, i) => (
              <circle
                key={slice.categoryId}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={slice.color ?? '#78716c'}
                strokeWidth={STROKE}
                strokeDasharray={`${slice.length} ${CIRC - slice.length}`}
                strokeDashoffset={-sliceOffset(i, slices.map((s) => s.length))}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-bold tabular-nums text-stone-900">
              {formatInViewCurrency(total, currencyConfig)}
            </p>
            <p className="text-xs text-stone-400">Total</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.categoryId} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color ?? '#78716c' }}
              />
              <span className="truncate text-sm font-medium text-stone-800">
                {slice.categoryName}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-stone-800">
              {formatInViewCurrency(slice.total, currencyConfig)}{' '}
              <span className={cn('font-medium text-stone-500')}>
                ({Math.round(slice.pct)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
