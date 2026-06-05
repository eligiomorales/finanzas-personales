import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { budgetStatusColorClass, budgetStatusLabel } from '@/lib/budget'
import type { BudgetProgressStatus } from '@/types'
import { cn } from '@/lib/utils'

export function BudgetProgressBar({
  percentUsed,
  status,
  color,
}: {
  percentUsed: number
  status: BudgetProgressStatus
  color?: string
}) {
  const width = status === 'unbudgeted' ? 0 : Math.min(percentUsed * 100, 100)
  const useCategoryColor = status === 'ok' || status === 'unbudgeted'

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          !useCategoryColor && budgetStatusColorClass(status),
        )}
        style={{
          width: `${width}%`,
          backgroundColor: useCategoryColor ? (color ?? '#3b82f6') : undefined,
        }}
      />
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
  if (budgeted <= 0) return null

  return (
    <p className="text-xs text-slate-500">
      {formatInViewCurrency(spent, currencyConfig)} / {formatInViewCurrency(budgeted, currencyConfig)}
      {' · '}
      {Math.round(percentUsed * 100)}% · {budgetStatusLabel(status)}
    </p>
  )
}
