import type { PeriodRange } from '@/components/PeriodFilter'
import { PeriodFilter } from '@/components/PeriodFilter'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

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
      <SegmentedControl
        aria-label="Alcance del balance"
        options={SCOPES}
        value={scope}
        onChange={onScopeChange}
        size="sm"
      />
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
