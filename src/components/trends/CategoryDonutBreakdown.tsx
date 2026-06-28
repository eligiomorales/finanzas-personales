import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { focusRing } from '@/components/ui/styles'
import { getTapMotionProps } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CategoryBudgetProgress } from '@/types'

const MotionButton = motion.button

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
  budgetByCategory?: Map<string, CategoryBudgetProgress>
  showBudget?: boolean
  onCategoryClick?: (categoryId: string) => void
}

const VIEW_W = 320
const VIEW_H = 200
const DONUT_D = 200
const STROKE = 15
const SEGMENT_GAP = 1
/** 0 = puntas rectas (corte radial); subir para redondear esquinas en las puntas */
export const TIP_ROUND = 4
const R = (DONUT_D - STROKE) / 2
const R_IN = R - STROKE / 2
const R_OUT = R + STROKE / 2
const CX = VIEW_W / 2
const CY = VIEW_H / 2
const CIRC = 2 * Math.PI * R

export const DONUT_CIRC = CIRC

function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
}

/** Annular sector with straight radial ends; TIP_ROUND softens the four corners per tip */
export function donutSlicePath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number,
  tipRound: number,
): string {
  const sweep = endAngle - startAngle
  if (sweep <= 0) return ''

  const large = sweep > Math.PI ? 1 : 0

  if (tipRound <= 0) {
    const o0 = polar(cx, cy, rOut, startAngle)
    const o1 = polar(cx, cy, rOut, endAngle)
    const i1 = polar(cx, cy, rIn, endAngle)
    const i0 = polar(cx, cy, rIn, startAngle)
    return `M ${o0.x} ${o0.y} A ${rOut} ${rOut} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${rIn} ${rIn} 0 ${large} 0 ${i0.x} ${i0.y} Z`
  }

  const cr = Math.min(tipRound, (rOut - rIn) / 2 - 0.5, sweep * rOut * 0.35)
  const trimOut = cr / rOut
  const trimIn = cr / rIn

  const oStart = polar(cx, cy, rOut, startAngle)
  const oArcStart = polar(cx, cy, rOut, startAngle + trimOut)
  const oArcEnd = polar(cx, cy, rOut, endAngle - trimOut)
  const oEnd = polar(cx, cy, rOut, endAngle)

  const iEnd = polar(cx, cy, rIn, endAngle)
  const iArcEnd = polar(cx, cy, rIn, endAngle - trimIn)
  const iArcStart = polar(cx, cy, rIn, startAngle + trimIn)
  const iStart = polar(cx, cy, rIn, startAngle)

  const oRadEnd = polar(cx, cy, rOut - cr, endAngle)
  const iRadEnd = polar(cx, cy, rIn + cr, endAngle)
  const oRadStart = polar(cx, cy, rOut - cr, startAngle)
  const iRadStart = polar(cx, cy, rIn + cr, startAngle)

  return [
    `M ${oArcStart.x} ${oArcStart.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${oArcEnd.x} ${oArcEnd.y}`,
    `Q ${oEnd.x} ${oEnd.y} ${oRadEnd.x} ${oRadEnd.y}`,
    `L ${iRadEnd.x} ${iRadEnd.y}`,
    `Q ${iEnd.x} ${iEnd.y} ${iArcEnd.x} ${iArcEnd.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${iArcStart.x} ${iArcStart.y}`,
    `Q ${iStart.x} ${iStart.y} ${iRadStart.x} ${iRadStart.y}`,
    `L ${oRadStart.x} ${oRadStart.y}`,
    `Q ${oStart.x} ${oStart.y} ${oArcStart.x} ${oArcStart.y}`,
    'Z',
  ].join(' ')
}

function fullRingPath(cx: number, cy: number, rIn: number, rOut: number): string {
  const top = polar(cx, cy, rOut, -Math.PI / 2)
  const topIn = polar(cx, cy, rIn, -Math.PI / 2)
  return [
    `M ${top.x} ${top.y}`,
    `A ${rOut} ${rOut} 0 1 1 ${top.x - 0.001} ${top.y}`,
    `M ${topIn.x} ${topIn.y}`,
    `A ${rIn} ${rIn} 0 1 0 ${topIn.x + 0.001} ${topIn.y}`,
  ].join(' ')
}

export function buildArcSlices(categories: CategorySlice[], total: number) {
  const n = categories.length
  if (n === 0 || total <= 0) return []
  const totalGap = n > 1 ? SEGMENT_GAP * n : 0
  const usable = CIRC - totalGap
  let offset = 0
  return categories.map((cat) => {
    const length = (cat.total / total) * usable
    const slice = {
      ...cat,
      pct: (cat.total / total) * 100,
      length,
      offset,
      startAngle: (offset / CIRC) * 2 * Math.PI,
      endAngle: ((offset + length) / CIRC) * 2 * Math.PI,
    }
    offset += length + (n > 1 ? SEGMENT_GAP : 0)
    return slice
  })
}

export function CategoryDonutBreakdown({
  categories,
  total,
  currencyConfig,
  budgetByCategory,
  showBudget = false,
  onCategoryClick,
}: CategoryDonutBreakdownProps) {
  const { shouldAnimate } = useMotionPreferences()
  const tapMotion = onCategoryClick && shouldAnimate ? getTapMotionProps(true) : {}
  const slices = useMemo(() => buildArcSlices(categories, total), [categories, total])

  if (total <= 0 || slices.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        Sin gastos categorizados este mes
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full min-h-[200px] -rotate-90"
          role="presentation"
        >
          {slices.map((slice) => {
            const isFullRing = slices.length === 1 && slice.length >= CIRC - 0.5
            const d = isFullRing
              ? fullRingPath(CX, CY, R_IN, R_OUT)
              : donutSlicePath(CX, CY, R_IN, R_OUT, slice.startAngle, slice.endAngle, TIP_ROUND)
            return (
              <path
                key={slice.categoryId}
                d={d}
                fill={slice.color ?? '#78716c'}
                fillRule={isFullRing ? 'evenodd' : undefined}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          <p className="text-sm font-bold tabular-nums text-stone-900">
            {formatInViewCurrency(total, currencyConfig)}
          </p>
        </div>
      </div>

      <ul className={cn(onCategoryClick ? 'space-y-3' : 'space-y-6')}>
        {slices.map((slice) => {
          const budgetProgress = budgetByCategory?.get(slice.categoryId)
          const hasBudget =
            showBudget && budgetProgress != null && budgetProgress.budgeted > 0

          const headerRow = (
            <div className="flex min-h-11 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color ?? '#78716c' }}
                />
                <span className="truncate text-sm font-semibold text-stone-800">
                  {slice.categoryName}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                <span>
                  <span className="font-semibold text-stone-900">
                    {formatInViewCurrency(slice.total, currencyConfig)}
                  </span>
                  <span className="font-medium text-stone-500">
                    {' · '}
                    {slice.pct.toFixed(1)}%
                  </span>
                </span>
                {onCategoryClick && (
                  <span className="text-stone-400" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            </div>
          )

          const progressBlock = (
            <div className="space-y-0.5">
              {hasBudget && budgetProgress ? (
                <BudgetProgressBar
                  percentUsed={budgetProgress.percentUsed}
                  status={budgetProgress.status}
                  color={slice.color}
                  colorMode="category"
                />
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(slice.pct, 100)}%`,
                      backgroundColor: slice.color ?? '#3b82f6',
                    }}
                  />
                </div>
              )}
              <p
                className={
                  hasBudget && budgetProgress
                    ? 'text-right text-[11px] tabular-nums text-stone-400'
                    : 'invisible h-[11px] text-[11px]'
                }
                aria-hidden={!hasBudget}
              >
                {hasBudget && budgetProgress
                  ? `${formatInViewCurrency(budgetProgress.spent, currencyConfig)} / ${formatInViewCurrency(budgetProgress.budgeted, currencyConfig)}`
                  : '\u00a0'}
              </p>
            </div>
          )

          if (onCategoryClick) {
            return (
              <li key={slice.categoryId}>
                <MotionButton
                  type="button"
                  className={cn(
                    'block w-full space-y-2 rounded-lg -mx-3 px-3 py-2 text-left transition-colors hover:bg-stone-50 active:bg-stone-100',
                    focusRing,
                  )}
                  onClick={() => onCategoryClick(slice.categoryId)}
                  aria-label={`Ver movimientos de ${slice.categoryName}`}
                  whileTap={tapMotion.whileTap}
                  transition={tapMotion.transition}
                >
                  {headerRow}
                  {progressBlock}
                </MotionButton>
              </li>
            )
          }

          return (
            <li key={slice.categoryId} className="space-y-2">
              {headerRow}
              {progressBlock}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
