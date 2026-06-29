import { SectionHeader } from '@/components/ui/SectionHeader'
import { MovementRow } from '@/components/ui/MovementRow'
import { getDisplayAmountForView } from '@/lib/balance'
import { formatMovementAmountLinesForView, type CurrencyConfig } from '@/lib/currency'
import { cn } from '@/lib/utils'
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
      <div className="space-y-2">
        {movements.map((m, index) => {
          const cat = categories.find((c) => c.id === m.categoryId)
          const categoryName = cat?.name ?? 'Sin categoría'
          const displayAmount = getDisplayAmountForView(m, myRole, currencyConfig, expenseViewMode)
          const amountLines = formatMovementAmountLinesForView(m, currencyConfig, displayAmount)
          const amountSign = m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''

          return (
            <div key={m.id} className={cn(index >= 3 && 'hidden md:block')}>
              <MovementRow
                variant="grouped-card"
                to={`/movimientos/editar/${m.id}`}
                movementId={m.id}
                categoryName={categoryName}
                categoryColor={cat?.color}
                description={m.description}
                movementType={m.type}
                amountPrimary={amountLines.primary}
                amountSecondary={amountLines.secondary}
                amountSign={amountSign}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
