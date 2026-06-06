import type { ImportShareValues } from '@/components/ImportShareControls'
import { SPLIT_PRESETS } from '@/components/ImportShareControls'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { formLabelWithName, payerDisplayLabel } from '@/lib/couple/person-labels'
import { repartoSummary } from '@/lib/movement-form-defaults'
import { formatCurrency } from '@/lib/utils'
import type { Category, CurrencyCode, PendingImportMovement } from '@/types'

export type ImportReviewItem = PendingImportMovement & {
  selectedCategoryId: string | null
} & ImportShareValues

const GENERIC_FIRST_LINES =
  /^(TRANSFERENCIA|COMPRA|PAGO|DEBITO|DÉBITO|CREDITO|CRÉDITO|CONSUMO|PAGO DEBITO|PAGO DÉBITO)/i

/** Receipt numbers from PDF/OCR imports — not a readable merchant name. */
function isComprobanteReference(value: string): boolean {
  return /^\d{4,8}$/.test(value.trim())
}

/** Readable one-line title for an import row in the review list. */
export function importItemTitle(description: string, merchant?: string): string {
  const trimmedMerchant = merchant?.trim()
  if (trimmedMerchant && !isComprobanteReference(trimmedMerchant)) {
    return trimmedMerchant
  }

  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return description.trim() || 'Sin descripción'

  const [first, second] = lines
  if (lines.length > 1 && GENERIC_FIRST_LINES.test(first)) {
    if (/^TRANSFERENCIA/i.test(first) && second) {
      return `Transferencia a ${second}`
    }
    return second ?? first
  }

  return first
}

export function importRepartoSummary(
  share: ImportShareValues,
  labelForRole: (role: 'personA' | 'personB') => string,
): string {
  return repartoSummary(
    {
      paidBy: share.paidBy,
      isShared: share.isShared,
      sharePersonA: share.sharePersonA,
      sharePersonB: share.sharePersonB,
      type: 'expense',
    },
    labelForRole,
    share.splitPreset,
    SPLIT_PRESETS,
  )
}

export function importRepartoPreview(
  share: ImportShareValues,
  persons: CouplePersonsView,
  amount: number,
  currency: CurrencyCode,
): string | null {
  if (amount <= 0) return null

  const amountLabel = formatCurrency(amount, currency)
  const payer = share.paidBy === 'both' ? 'Ambos' : payerDisplayLabel(share.paidBy, persons)

  if (!share.isShared) {
    return `${payer} pagó ${amountLabel} · asume ${amountLabel}`
  }

  const assumeA = (amount * share.sharePersonA) / 100
  const assumeB = (amount * share.sharePersonB) / 100

  if (Math.abs(share.sharePersonA - share.sharePersonB) < 0.01) {
    return `${payer} pagó ${amountLabel} · cada uno asume ${formatCurrency(assumeA, currency)}`
  }

  return `${payer} pagó ${amountLabel} · ${persons.personAName} ${formatCurrency(assumeA, currency)} · ${persons.personBName} ${formatCurrency(assumeB, currency)}`
}

export function importItemMetadata(
  categoryName: string | undefined,
  share: ImportShareValues,
  persons: CouplePersonsView,
): string {
  const parts: string[] = []
  if (categoryName) parts.push(categoryName)
  parts.push(`Pagó: ${payerDisplayLabel(share.paidBy, persons)}`)
  if (share.isShared) {
    parts.push(`${share.sharePersonA}/${share.sharePersonB}`)
  } else {
    parts.push('Personal')
  }
  return parts.join(' · ')
}

/** Categories to show as quick-pick buttons during import review. */
export function buildImportCategoryButtons(
  expenseCategories: Category[],
  frequentCategoryIds: string[],
  selectedCategoryId: string | null,
  suggestedCategoryId: string | null,
  frequentLimit = 6,
): Category[] {
  const byId = new Map(expenseCategories.map((category) => [category.id, category]))
  const result: Category[] = []
  const seen = new Set<string>()

  function push(id: string | null | undefined) {
    if (!id || seen.has(id)) return
    const category = byId.get(id)
    if (!category) return
    seen.add(id)
    result.push(category)
  }

  for (const id of frequentCategoryIds.slice(0, frequentLimit)) {
    push(id)
  }
  push(suggestedCategoryId)
  push(selectedCategoryId)

  return result
}

export function importShareLabelForRole(role: 'personA' | 'personB', persons: CouplePersonsView): string {
  return formLabelWithName(role, persons)
}

export type ImportReviewFilter = 'pending' | 'duplicates' | 'ignored' | 'all'

export function filterImportReviewItems(
  items: ImportReviewItem[],
  filter: ImportReviewFilter,
): ImportReviewItem[] {
  switch (filter) {
    case 'pending':
      return items.filter((item) => item.status === 'pending')
    case 'duplicates':
      return items.filter((item) => item.possibleDuplicate && item.status === 'pending')
    case 'ignored':
      return items.filter((item) => item.status === 'ignored')
    case 'all':
      return items
  }
}
