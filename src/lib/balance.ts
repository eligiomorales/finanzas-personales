import type { Movement, MovementFormData, Payer, PeriodSummary } from '@/types'
import { getAmountInView, type CurrencyConfig } from '@/lib/currency'
import type { ExpenseViewMode } from '@/lib/expense-view-mode'

/** Share split for personal (non-shared) movements: the payer assumes 100%. */
export function personalSharesFromPayer(paidBy: Payer): { sharePersonA: number; sharePersonB: number } {
  switch (paidBy) {
    case 'personA':
      return { sharePersonA: 100, sharePersonB: 0 }
    case 'personB':
      return { sharePersonA: 0, sharePersonB: 100 }
    case 'both':
      return { sharePersonA: 50, sharePersonB: 50 }
  }
}

/** Effective share percentages, honoring isShared for balance calculations. */
export function getEffectiveShares(
  movement: Pick<Movement, 'isShared' | 'paidBy' | 'sharePersonA' | 'sharePersonB'>,
): { sharePersonA: number; sharePersonB: number } {
  if (movement.isShared) {
    return { sharePersonA: movement.sharePersonA, sharePersonB: movement.sharePersonB }
  }
  return personalSharesFromPayer(movement.paidBy)
}

/** Normalize form data so personal movements always store payer-assumes-100% shares. */
export function normalizeMovementFormData(data: MovementFormData): MovementFormData {
  if (data.type === 'settlement' || data.isShared) return data
  return { ...data, ...personalSharesFromPayer(data.paidBy) }
}

/** How much each person actually paid (in the active display currency). */
export function getPaidAmounts(
  movement: Movement,
  config: CurrencyConfig,
): { personA: number; personB: number } {
  const amount = getAmountInView(movement, config)

  if (movement.type === 'settlement') {
    if (movement.paidBy === 'personA') return { personA: amount, personB: 0 }
    if (movement.paidBy === 'personB') return { personA: 0, personB: amount }
    return { personA: amount / 2, personB: amount / 2 }
  }

  if (movement.type === 'income') {
    if (movement.paidBy === 'personA') return { personA: amount, personB: 0 }
    if (movement.paidBy === 'personB') return { personA: 0, personB: amount }
    return { personA: amount / 2, personB: amount / 2 }
  }

  switch (movement.paidBy) {
    case 'personA':
      return { personA: amount, personB: 0 }
    case 'personB':
      return { personA: 0, personB: amount }
    case 'both':
      return { personA: amount / 2, personB: amount / 2 }
  }
}

/** How much each person should have assumed (in the active display currency). */
export function getAssumedAmounts(
  movement: Movement,
  config: CurrencyConfig,
): { personA: number; personB: number } {
  if (movement.type === 'settlement') {
    return { personA: 0, personB: 0 }
  }

  const amount = getAmountInView(movement, config)
  const { sharePersonA, sharePersonB } = getEffectiveShares(movement)
  const shareA = sharePersonA / 100
  const shareB = sharePersonB / 100
  return {
    personA: amount * shareA,
    personB: amount * shareB,
  }
}

/** Shared expenses included in period balance breakdown (excludes settlements and personal). */
export function filterSharedCoupleExpenseMovements(movements: Movement[]): Movement[] {
  return movements.filter((m) => m.type === 'expense' && m.isShared)
}

export type CoupleBalance = ReturnType<typeof calculateCoupleBalance>

/**
 * Balance for a scope:
 * - 'all': full history including settlements (pass all movements).
 * - 'period': only shared expenses of the filtered window; settlements are ignored because
 *   they represent corrections to the accumulated debt, not to a specific period's activity.
 */
export function calculateCoupleBalanceForScope(
  movements: Movement[],
  config: CurrencyConfig,
  scope: 'all' | 'period',
): CoupleBalance {
  if (scope === 'all') {
    return calculateCoupleBalance(movements, config)
  }
  return calculateCoupleBalance(filterSharedCoupleExpenseMovements(movements), config)
}

export function calculateCoupleBalance(movements: Movement[], config: CurrencyConfig) {
  let paidA = 0
  let paidB = 0
  let assumedA = 0
  let assumedB = 0
  let settlementsA = 0
  let settlementsB = 0

  for (const m of movements) {
    const paid = getPaidAmounts(m, config)
    const assumed = getAssumedAmounts(m, config)

    if (m.type === 'settlement') {
      settlementsA += paid.personA
      settlementsB += paid.personB
      continue
    }

    if (m.type === 'expense') {
      paidA += paid.personA
      paidB += paid.personB
      assumedA += assumed.personA
      assumedB += assumed.personB
    }
  }

  paidA += settlementsA - settlementsB
  paidB += settlementsB - settlementsA

  const diffA = paidA - assumedA
  const diffB = paidB - assumedB

  const netOwed = diffA
  let owedBy: 'personA' | 'personB' | 'balanced' = 'balanced'
  let owedAmount = 0

  if (Math.abs(netOwed) > 0.01) {
    if (netOwed > 0) {
      owedBy = 'personB'
      owedAmount = netOwed
    } else {
      owedBy = 'personA'
      owedAmount = Math.abs(netOwed)
    }
  }

  return {
    personA: { paid: paidA, assumed: assumedA, difference: diffA },
    personB: { paid: paidB, assumed: assumedB, difference: diffB },
    netOwed,
    owedBy,
    owedAmount,
  }
}

/** How much of an expense a given person should assume (in the active display currency). */
export function getPersonalExpenseAmount(
  movement: Movement,
  role: 'personA' | 'personB',
  config: CurrencyConfig,
): number {
  if (movement.type !== 'expense') return 0
  const assumed = getAssumedAmounts(movement, config)
  return role === 'personA' ? assumed.personA : assumed.personB
}

/** Whether a movement should appear in personal view for the given role. */
export function movementVisibleInPersonalView(
  movement: Movement,
  role: 'personA' | 'personB',
): boolean {
  if (movement.type === 'expense') {
    const { sharePersonA, sharePersonB } = getEffectiveShares(movement)
    const share = role === 'personA' ? sharePersonA : sharePersonB
    return share > 0.01
  }
  if (movement.type === 'income') {
    if (movement.paidBy === 'both') return true
    return movement.paidBy === role
  }
  return true
}

/** Income attributed to a person in personal view. */
export function getPersonalIncomeAmount(
  movement: Movement,
  role: 'personA' | 'personB',
  config: CurrencyConfig,
): number {
  if (movement.type !== 'income') return 0
  const paid = getPaidAmounts(movement, config)
  return role === 'personA' ? paid.personA : paid.personB
}

/** Period summary counting only the portion assumed by one person (personal + shared share). */
export function calculatePersonalExpenseSummary(
  movements: Movement[],
  categories: { id: string; name: string; color?: string }[],
  config: CurrencyConfig,
  role: 'personA' | 'personB',
): PeriodSummary {
  let totalIncome = 0
  let totalExpenses = 0
  const categoryTotals = new Map<string, number>()

  for (const m of movements) {
    if (m.type === 'income') {
      totalIncome += getPersonalIncomeAmount(m, role, config)
    } else if (m.type === 'expense') {
      const amount = getPersonalExpenseAmount(m, role, config)
      if (amount <= 0) continue
      totalExpenses += amount
      if (m.categoryId) {
        categoryTotals.set(m.categoryId, (categoryTotals.get(m.categoryId) ?? 0) + amount)
      }
    }
  }

  const expensesByCategory = Array.from(categoryTotals.entries())
    .map(([categoryId, total]) => {
      const cat = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        color: cat?.color,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    expensesByCategory,
  }
}

/** Display amount for a movement based on view mode. */
export function getDisplayAmountForView(
  movement: Movement,
  role: 'personA' | 'personB',
  config: CurrencyConfig,
  mode: ExpenseViewMode,
): number {
  if (mode === 'couple') return getAmountInView(movement, config)
  if (movement.type === 'expense') return getPersonalExpenseAmount(movement, role, config)
  if (movement.type === 'income') return getPersonalIncomeAmount(movement, role, config)
  return getAmountInView(movement, config)
}

export function calculatePeriodSummary(
  movements: Movement[],
  categories: { id: string; name: string; color?: string }[],
  config: CurrencyConfig,
): PeriodSummary {
  let totalIncome = 0
  let totalExpenses = 0
  const categoryTotals = new Map<string, number>()

  for (const m of movements) {
    const amount = getAmountInView(m, config)
    if (m.type === 'income') {
      totalIncome += amount
    } else if (m.type === 'expense') {
      totalExpenses += amount
      if (m.categoryId) {
        categoryTotals.set(m.categoryId, (categoryTotals.get(m.categoryId) ?? 0) + amount)
      }
    }
  }

  const expensesByCategory = Array.from(categoryTotals.entries())
    .map(([categoryId, total]) => {
      const cat = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        color: cat?.color,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    expensesByCategory,
  }
}

export function splitPreset(ratio: string): { sharePersonA: number; sharePersonB: number } {
  switch (ratio) {
    case '50-50':
      return { sharePersonA: 50, sharePersonB: 50 }
    case '60-40':
      return { sharePersonA: 60, sharePersonB: 40 }
    case '100-0':
      return { sharePersonA: 100, sharePersonB: 0 }
    case '0-100':
      return { sharePersonA: 0, sharePersonB: 100 }
    default:
      return { sharePersonA: 50, sharePersonB: 50 }
  }
}

export function payerLabel(paidBy: Payer, personAName: string, personBName: string): string {
  switch (paidBy) {
    case 'personA':
      return personAName
    case 'personB':
      return personBName
    case 'both':
      return 'Ambos'
  }
}

export function isDuplicateMovement(
  existing: Movement,
  candidate: { date: string; amount: number; description: string; currency?: Movement['currency'] },
): boolean {
  const sameDate = existing.date === candidate.date
  const sameAmount = Math.abs(existing.amount - candidate.amount) < 0.01
  const sameCurrency =
    !candidate.currency || !existing.currency || existing.currency === candidate.currency
  const descA = existing.description.toLowerCase().trim()
  const descB = candidate.description.toLowerCase().trim()
  const similarDesc = descA === descB || descA.includes(descB) || descB.includes(descA)
  return sameDate && sameAmount && sameCurrency && similarDesc
}
