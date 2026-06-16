import type { CurrencyCode, Movement, MovementFormData, MovementType } from '@/types'
import { todayISO } from '@/lib/utils'

export function parseAmountInput(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function currencyInputPrefix(currency: CurrencyCode): string {
  return currency === 'USD' ? 'US$' : '$'
}

function movementMatchesCategoryType(movement: Movement, formType: MovementType): boolean {
  if (formType === 'settlement') return movement.type !== 'settlement'
  const categoryType = formType === 'income' ? 'income' : 'expense'
  return movement.type === categoryType
}

export function getFrequentCategoryIds(
  movements: Movement[],
  formType: MovementType,
  limit = 3,
): string[] {
  const counts = new Map<string, number>()
  const lastUsed = new Map<string, string>()

  for (const movement of movements) {
    if (!movementMatchesCategoryType(movement, formType)) continue
    if (!movement.categoryId) continue
    counts.set(movement.categoryId, (counts.get(movement.categoryId) ?? 0) + 1)
    const previousDate = lastUsed.get(movement.categoryId)
    if (!previousDate || movement.date > previousDate) {
      lastUsed.set(movement.categoryId, movement.date)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return (lastUsed.get(b[0]) ?? '').localeCompare(lastUsed.get(a[0]) ?? '')
    })
    .slice(0, limit)
    .map(([categoryId]) => categoryId)
}

/** @deprecated Use getFrequentCategoryIds */
export function getRecentCategoryIds(
  movements: Movement[],
  formType: MovementType,
  limit = 3,
): string[] {
  return getFrequentCategoryIds(movements, formType, limit)
}

export function getDefaultCategoryId(movements: Movement[], formType: MovementType): string | null {
  return getFrequentCategoryIds(movements, formType, 1)[0] ?? null
}

export function buildNewMovementDefaults(params: {
  movements: Movement[]
  displayCurrency?: CurrencyCode
  payerRole?: 'personA' | 'personB'
}): MovementFormData {
  return {
    type: 'expense',
    amount: 0,
    currency: params.displayCurrency ?? 'ARS',
    date: todayISO(),
    description: '',
    categoryId: null,
    paidBy: params.payerRole ?? 'personA',
    sharePersonA: 50,
    sharePersonB: 50,
    isShared: true,
  }
}

export function payerFieldLabel(type: MovementType): string {
  return type === 'income' ? 'Quién lo recibió' : 'Quién pagó'
}

export function splitDistributionLabel(type: MovementType): string {
  if (type === 'income') return 'Distribución del ingreso'
  if (type === 'settlement') return 'Reparto de la liquidación'
  return 'Distribución del gasto'
}

export function repartoSummary(
  form: Pick<MovementFormData, 'paidBy' | 'isShared' | 'sharePersonA' | 'sharePersonB' | 'type'>,
  labelForRole: (role: 'personA' | 'personB') => string,
  splitPreset: string,
  splitPresets: { value: string; label: string }[],
): string {
  const payer =
    form.paidBy === 'personA'
      ? labelForRole('personA')
      : form.paidBy === 'personB'
        ? labelForRole('personB')
        : 'Ambos'

  if (form.type === 'settlement') {
    return `${payer} · Liquidación`
  }

  if (form.type === 'income') {
    return `${payer} lo recibió`
  }

  if (!form.isShared) {
    return `${payer} pagó · Personal`
  }

  const splitLabel =
    splitPreset === 'custom'
      ? `${form.sharePersonA}/${form.sharePersonB}`
      : (splitPresets.find((p) => p.value === splitPreset)?.label ?? '50 / 50')

  return `${payer} pagó · Compartido ${splitLabel}`
}
