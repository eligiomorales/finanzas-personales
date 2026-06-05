import { cn } from '@/lib/utils'
import type { PeriodRange } from '@/components/PeriodFilter'
import { PeriodFilter } from '@/components/PeriodFilter'

export type BalanceScope = 'current_month' | 'all' | 'custom'

const SCOPES: { value: BalanceScope; label: string }[] = [
  { value: 'current_month', label: 'Mes actual' },
  { value: 'all', label: 'Histórico' },
  { value: 'custom', label: 'Personalizado' },
]

interface BalanceScopeSelectorProps {
  scope: BalanceScope
  onScopeChange: (scope: BalanceScope) => void
  customPeriod: PeriodRange
  onCustomPeriodChange: (period: PeriodRange) => void
}

export function BalanceScopeSelector({
  scope,
  onScopeChange,
  customPeriod,
  onCustomPeriodChange,
}: BalanceScopeSelectorProps) {
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Alcance del balance"
        className="flex gap-1 rounded-lg bg-slate-100 p-1"
      >
        {SCOPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => onScopeChange(value)}
            className={cn(
              'flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 sm:text-sm',
              scope === value
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {scope === 'custom' && (
        <PeriodFilter period={customPeriod} onChange={onCustomPeriodChange} idPrefix="balance-period" />
      )}
    </div>
  )
}

export function balanceScopeDescription(
  scope: BalanceScope,
  customPeriod: PeriodRange,
  displayCurrency: string,
): string {
  switch (scope) {
    case 'current_month':
      return `Mes actual · gastos compartidos y liquidaciones del período · montos en ${displayCurrency}`
    case 'all':
      return `Histórico completo · todos los movimientos · montos en ${displayCurrency}`
    case 'custom':
      return `${customPeriod.from} — ${customPeriod.to} · montos en ${displayCurrency}`
  }
}
