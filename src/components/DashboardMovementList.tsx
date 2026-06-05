import { Link } from 'react-router-dom'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { ExpenseViewMode } from '@/lib/expense-view-mode'
import { movementAmountColor } from '@/lib/utils'
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
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recientes</p>
        <Link
          to="/movimientos"
          className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Ver todos →
        </Link>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              className={`flex items-center gap-3 px-3 py-2.5 ${index >= 3 ? 'hidden md:flex' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{m.description}</p>
                {cat && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{cat.name}</p>
                )}
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
      </div>
    </section>
  )
}
