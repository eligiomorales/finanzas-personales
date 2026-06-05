import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'

interface DashboardCompensationRowProps {
  hasPendingCompensation: boolean
  debtorName: string
  creditorName: string
  owedAmount: number
  currencyConfig: CurrencyConfig
}

export function DashboardCompensationRow({
  hasPendingCompensation,
  debtorName,
  creditorName,
  owedAmount,
  currencyConfig,
}: DashboardCompensationRowProps) {
  const amountLabel = formatInViewCurrency(owedAmount, currencyConfig)

  return (
    <Link
      to="/balance"
      className={cn(
        'flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
        hasPendingCompensation
          ? 'bg-amber-50/70 text-slate-800 hover:bg-amber-50'
          : 'bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50/70',
      )}
    >
      <p className="min-w-0 flex-1 truncate">
        {hasPendingCompensation ? (
          <>
            <span className="font-medium">{debtorName}</span> debe{' '}
            <span className="font-semibold tabular-nums">{amountLabel}</span> a{' '}
            <span className="font-medium">{creditorName}</span>
          </>
        ) : (
          <span className="font-medium">Están saldados en el período</span>
        )}
      </p>
      <span className="shrink-0 text-brand-600" aria-hidden>
        →
      </span>
    </Link>
  )
}
