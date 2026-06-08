import { SectionHeader } from '@/components/ui/SectionHeader'
import { MovementList, MovementRow } from '@/components/ui/MovementRow'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { ExpenseViewMode } from '@/lib/expense-view-mode'
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
      <MovementList>
        {movements.map((m, index) => {
          const cat = categories.find((c) => c.id === m.categoryId)
          const amount = formatInViewCurrency(
            getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode),
            currencyConfig,
          )
          const amountSign = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''

          return (
            <MovementRow
              key={m.id}
              variant="compact"
              description={m.description}
              categoryName={cat?.name}
              movementType={m.type}
              amount={amount}
              amountSign={amountSign}
              className={index >= 3 ? 'hidden md:flex' : undefined}
            />
          )
        })}
      </MovementList>
    </section>
  )
}
