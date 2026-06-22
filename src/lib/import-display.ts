import type { ImportShareValues } from '@/components/ImportShareControls'
import { SPLIT_PRESETS } from '@/components/ImportShareControls'
import type { CouplePersonsView } from '@/lib/couple/person-labels'
import { importPayerChipLabel, payerDisplayLabel } from '@/lib/couple/person-labels'
import { normalizeRuleKeyword, ruleKeywordMatchesDescription } from '@/lib/category-rules'
import { repartoSummary } from '@/lib/movement-form-defaults'
import { formatCurrency } from '@/lib/utils'
import type { Category, CategoryRule, CurrencyCode, PendingImportMovement } from '@/types'

export type ImportReviewItem = PendingImportMovement & {
  selectedCategoryId: string | null
  confidence: number
  needsReview: boolean
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
  return importPayerChipLabel(role, persons)
}

export type ImportReviewFilter = 'pending' | 'needs_review' | 'auto_approved' | 'duplicates' | 'ignored' | 'all'

export interface ImportPreviewSummary {
  expenseCount: number
  totalArs: number
  reviewRequiredCount: number
  autoApprovedCount: number
  aggregateConfidence: number
  parserWarnings: string[]
}

export function importItemNeedsReview(item: ImportReviewItem): boolean {
  return item.status === 'pending' && item.needsReview
}

export function importItemAutoApproved(item: ImportReviewItem): boolean {
  return item.status === 'pending' && !item.needsReview
}

/** Bulk category/share actions apply only to exceptions, not auto-approved rows. */
export function shouldApplyImportBulkAction(item: ImportReviewItem): boolean {
  return importItemNeedsReview(item)
}

/** Pending rows that cannot be confirmed without a category. */
export function importPendingMissingCategory(items: ImportReviewItem[]): ImportReviewItem[] {
  return items.filter((item) => item.status === 'pending' && !item.selectedCategoryId)
}

export function buildImportPreviewSummary(
  items: ImportReviewItem[],
  defaultExchangeRateUsd: number,
  parserWarnings: string[] = [],
): ImportPreviewSummary {
  const pending = items.filter((item) => item.status === 'pending')
  const totalArs = pending.reduce(
    (sum, item) =>
      sum + (item.currency === 'USD' ? item.amount * defaultExchangeRateUsd : item.amount),
    0,
  )
  const reviewRequiredCount = pending.filter(importItemNeedsReview).length
  const autoApprovedCount = pending.length - reviewRequiredCount
  const aggregateConfidence =
    pending.length === 0
      ? 0
      : Math.round(pending.reduce((sum, item) => sum + item.confidence, 0) / pending.length)

  return {
    expenseCount: pending.length,
    totalArs,
    reviewRequiredCount,
    autoApprovedCount,
    aggregateConfidence,
    parserWarnings,
  }
}

export function filterImportReviewItems(
  items: ImportReviewItem[],
  filter: ImportReviewFilter,
): ImportReviewItem[] {
  switch (filter) {
    case 'pending':
      return items.filter((item) => item.status === 'pending')
    case 'needs_review':
      return items.filter(importItemNeedsReview)
    case 'auto_approved':
      return items.filter(importItemAutoApproved)
    case 'duplicates':
      return items.filter((item) => item.possibleDuplicate && item.status === 'pending')
    case 'ignored':
      return items.filter((item) => item.status === 'ignored')
    case 'all':
      return items
  }
}

/** ponytail: in-memory key from visible title, not raw PDF comprobante in `merchant`. */
export function normalizeImportMerchantKey(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function importMerchantGroupKey(item: ImportReviewItem): string | null {
  const title = importItemTitle(item.originalDescription, item.merchant)
  const normalized = normalizeImportMerchantKey(title)
  return normalized || null
}

export interface ImportMerchantGroup {
  key: string
  displayName: string
  itemIds: string[]
  count: number
  totalArs: number
}

/** Repeated merchants among review exceptions only (count >= 2). */
export function buildImportMerchantGroups(
  items: ImportReviewItem[],
  defaultExchangeRateUsd: number,
): ImportMerchantGroup[] {
  const byKey = new Map<string, { displayName: string; groupItems: ImportReviewItem[] }>()

  for (const item of items) {
    if (!importItemNeedsReview(item)) continue
    const key = importMerchantGroupKey(item)
    if (!key) continue

    const displayName = importItemTitle(item.originalDescription, item.merchant)
    const existing = byKey.get(key)
    if (existing) {
      existing.groupItems.push(item)
    } else {
      byKey.set(key, { displayName, groupItems: [item] })
    }
  }

  const groups: ImportMerchantGroup[] = []
  for (const [key, { displayName, groupItems }] of byKey) {
    if (groupItems.length < 2) continue
    groups.push({
      key,
      displayName,
      itemIds: groupItems.map((item) => item.id),
      count: groupItems.length,
      totalArs: groupItems.reduce(
        (sum, item) =>
          sum + (item.currency === 'USD' ? item.amount * defaultExchangeRateUsd : item.amount),
        0,
      ),
    })
  }

  return groups.sort(
    (a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName, 'es'),
  )
}

export function applyCategoryToImportMerchantGroup(
  items: ImportReviewItem[],
  groupKey: string,
  categoryId: string,
): ImportReviewItem[] {
  return items.map((item) => {
    if (!importItemNeedsReview(item)) return item
    if (importMerchantGroupKey(item) !== groupKey) return item
    return { ...item, selectedCategoryId: categoryId }
  })
}

export interface ImportRuleCandidate {
  keyword: string
  categoryId: string
}

/** Default keyword when user checks "Recordar" — readable merchant title, not raw extract. */
export function defaultImportRuleKeyword(
  item: Pick<ImportReviewItem, 'originalDescription' | 'merchant'>,
): string {
  return importItemTitle(item.originalDescription, item.merchant)
}

export function importItemCategoryWasCorrected(item: ImportReviewItem): boolean {
  return Boolean(item.selectedCategoryId) && item.selectedCategoryId !== item.suggestedCategoryId
}

export function findExistingImportRuleForItem(
  item: ImportReviewItem,
  categoryRules: CategoryRule[],
  categoryId: string,
): CategoryRule | undefined {
  return categoryRules.find(
    (rule) =>
      rule.categoryId === categoryId &&
      ruleKeywordMatchesDescription(rule.keyword, item.originalDescription),
  )
}

/** Pending remembered rows → unique normalized keywords to upsert on confirm. */
export function buildImportRuleCandidatesToSave(
  items: ImportReviewItem[],
  rememberedKeywordsByItemId: Record<string, string>,
  categoryRules: CategoryRule[],
): ImportRuleCandidate[] {
  const candidates: ImportRuleCandidate[] = []
  const seenKeywords = new Set<string>()

  for (const item of items) {
    if (item.status !== 'pending' || !item.selectedCategoryId) continue
    if (!importItemCategoryWasCorrected(item)) continue

    const rawKeyword = rememberedKeywordsByItemId[item.id]?.trim()
    if (!rawKeyword) continue
    if (findExistingImportRuleForItem(item, categoryRules, item.selectedCategoryId)) continue

    const keyword = normalizeRuleKeyword(rawKeyword)
    if (!keyword || seenKeywords.has(keyword)) continue

    seenKeywords.add(keyword)
    candidates.push({ keyword, categoryId: item.selectedCategoryId })
  }

  return candidates
}
