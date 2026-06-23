import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { budgetStatusColorClass, budgetStatusLabel } from '@/lib/budget'
import { motionTransitions } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { BudgetProgressStatus } from '@/types'
import { cn } from '@/lib/utils'

export function BudgetProgressBar({
  percentUsed,
  status,
  color,
  colorMode = 'status',
}: {
  percentUsed: number
  status: BudgetProgressStatus
  color?: string
  /** `status`: amber/red when near/over. `category`: always use category color. */
  colorMode?: 'status' | 'category'
}) {
  const { shouldAnimate } = useMotionPreferences()
  const targetWidth = status === 'unbudgeted' ? 0 : Math.min(percentUsed * 100, 100)
  const useCategoryColor = colorMode === 'category' || status === 'ok' || status === 'unbudgeted'
  const widthMotion = useMotionValue(targetWidth)
  const widthStyle = useTransform(widthMotion, (value) => `${value}%`)

  useEffect(() => {
    if (!shouldAnimate) {
      widthMotion.set(targetWidth)
      return
    }

    const controls = animate(widthMotion, targetWidth, {
      duration: motionTransitions.sharedElement.duration,
      ease: motionTransitions.sharedElement.ease,
    })

    return () => controls.stop()
  }, [targetWidth, shouldAnimate, widthMotion])

  const barClassName = cn(
    'h-full rounded-full',
    !useCategoryColor && budgetStatusColorClass(status),
  )
  const barColorStyle = {
    backgroundColor: useCategoryColor ? (color ?? '#3b82f6') : undefined,
  }

  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-100">
      {shouldAnimate ? (
        <motion.div className={barClassName} style={{ width: widthStyle, ...barColorStyle }} />
      ) : (
        <div
          className={barClassName}
          style={{ width: `${targetWidth}%`, ...barColorStyle }}
        />
      )}
    </div>
  )
}

export function BudgetMeter({
  spent,
  limit,
  percentUsed,
  status,
  color,
  currencyConfig,
}: {
  spent: number
  limit: number
  percentUsed: number
  status: BudgetProgressStatus
  color?: string
  currencyConfig: CurrencyConfig
}) {
  return (
    <div className="mt-2">
      <BudgetProgressBar percentUsed={percentUsed} status={status} color={color} />
      <p className="mt-1 text-right text-xs tabular-nums text-stone-500">
        {formatInViewCurrency(spent, currencyConfig)}
        {' / '}
        {formatInViewCurrency(limit, currencyConfig)}
      </p>
    </div>
  )
}

export function BudgetProgressMeta({
  spent,
  budgeted,
  percentUsed,
  status,
  currencyConfig,
}: {
  spent: number
  budgeted: number
  percentUsed: number
  status: BudgetProgressStatus
  currencyConfig: CurrencyConfig
}) {
  const { shouldAnimate } = useMotionPreferences()

  if (budgeted <= 0) return null

  const percentDisplay = Math.round(percentUsed * 100)

  return (
    <p className="text-xs text-stone-500">
      {formatInViewCurrency(spent, currencyConfig)} / {formatInViewCurrency(budgeted, currencyConfig)}
      {' · '}
      {shouldAnimate ? (
        <motion.span
          key={percentDisplay}
          initial={{ opacity: 0.5, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransitions.microInteraction}
          className="inline-block tabular-nums"
        >
          {percentDisplay}%
        </motion.span>
      ) : (
        `${percentDisplay}%`
      )}
      {' · '}
      {budgetStatusLabel(status)}
    </p>
  )
}
