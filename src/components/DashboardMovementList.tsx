import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card } from '@/components/ui/Card'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { ExpenseViewMode } from '@/lib/expense-view-mode'
import { movementAmountColor, cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'
import type { Category, Movement } from '@/types'

interface DashboardMovementListProps {
  movements: Movement[]
  categories: Category[]
  currencyConfig: CurrencyConfig
  myRole: 'personA' | 'personB'
  expenseViewMode: ExpenseViewMode
}

export function DashboardMovementList({
  movements,
  categories,
  currencyConfig,
  myRole,
  expenseViewMode,
}: DashboardMovementListProps) {
  if (movements.length === 0) return null

  return (
    <section>
      <SectionHeader label="Recientes" action={{ label: 'Ver todos →', to: '/movimientos' }} />
      <Card compact className="divide-y divide-stone-100 p-0">
        {movements.map((m, index) => {
          const cat = categories.find((c) => c.id === m.categoryId)
          const amount = formatInViewCurrency(
            getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode),
            currencyConfig,
          )
          const prefix = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''

          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 ${index >= 3 ? 'hidden md:flex' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">{m.description}</p>
                {cat && <p className={cn('mt-0.5 truncate text-xs', textMuted)}>{cat.name}</p>}
              </div>
              <span
                className={`w-[5.75rem] shrink-0 text-right text-sm font-semibold tabular-nums ${movementAmountColor(m.type)}`}
              >
                {prefix}
                {amount}
              </span>
            </div>
          )
        })}
      </Card>
    </section>
  )
}
