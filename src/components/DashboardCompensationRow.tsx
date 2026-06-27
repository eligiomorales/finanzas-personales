import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { cardSurface, focusRing, textMuted } from '@/components/ui/styles'

interface DashboardCompensationRowProps {
  hasPendingCompensation: boolean
  debtorName: string
  creditorName: string
  owedAmount: number
  currencyConfig: CurrencyConfig
}

const toneStyles = {
  pending: {
    border: 'border-amber-200/80',
    bg: 'bg-amber-50/70 hover:bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    badgeLabel: 'Pendiente',
    amount: 'text-amber-950',
    description: 'text-amber-900',
  },
  settled: {
    border: 'border-emerald-200/80',
    bg: 'bg-emerald-50/50 hover:bg-emerald-50/70',
    badge: 'bg-emerald-100 text-emerald-800',
    badgeLabel: 'Saldado',
    description: 'text-emerald-800',
  },
} as const

export function DashboardCompensationRow({
  hasPendingCompensation,
  debtorName,
  creditorName,
  owedAmount,
  currencyConfig,
}: DashboardCompensationRowProps) {
  const amountLabel = formatInViewCurrency(owedAmount, currencyConfig)
  const styles = hasPendingCompensation ? toneStyles.pending : toneStyles.settled

  return (
    <Link
      to="/balance?scope=period"
      className={cn(
        cardSurface,
        focusRing,
        'block px-3 py-2.5 transition-colors',
        styles.border,
        styles.bg,
      )}
      aria-label={
        hasPendingCompensation
          ? `${debtorName} debe ${amountLabel} a ${creditorName}. Ver balance del período.`
          : 'Están saldados en el período. Ver balance del período.'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', textMuted)}>
          Balance entre integrantes
        </p>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', styles.badge)}>
          {styles.badgeLabel}
        </span>
      </div>

      <div className="mt-1 flex min-h-[44px] items-center gap-2">
        <div className="min-w-0 flex-1">
          {hasPendingCompensation ? (
            <>
              <p className={cn('text-xl font-bold tabular-nums tracking-tight', toneStyles.pending.amount)}>
                {amountLabel}
              </p>
              <p className={cn('text-sm leading-snug', styles.description)}>
                <span className="font-semibold">{debtorName}</span> debe a{' '}
                <span className="font-semibold">{creditorName}</span>
              </p>
            </>
          ) : (
            <p className={cn('text-sm font-semibold leading-snug', styles.description)}>
              Están saldados en el período
            </p>
          )}
        </div>
        <span className="shrink-0 text-brand-600" aria-hidden>
          →
        </span>
      </div>
    </Link>
  )
}
