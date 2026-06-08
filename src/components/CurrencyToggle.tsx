import { useSettings, useDataMutations } from '@/hooks/useData'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
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
    <SegmentedControl
      aria-label="Moneda de visualización"
      options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
      value={active}
      onChange={handleSelect}
      fullWidth={false}
    />
  )
}
