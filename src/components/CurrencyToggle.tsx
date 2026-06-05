import { useSettings, useDataMutations } from '@/hooks/useData'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CurrencyCode } from '@/types'

export function CurrencyToggle() {
  const settings = useSettings()
  const { updateDisplayCurrency } = useDataMutations()
  const active = settings?.displayCurrency ?? 'ARS'

  async function handleSelect(currency: CurrencyCode) {
    if (currency === active) return
    await updateDisplayCurrency(currency)
  }

  return (
    <div
      className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
      role="group"
      aria-label="Moneda de visualización"
    >
      {SUPPORTED_CURRENCIES.map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => handleSelect(currency)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            active === currency
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
          aria-pressed={active === currency}
        >
          {currency}
        </button>
      ))}
    </div>
  )
}
