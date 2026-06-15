import {
  differenceInDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subDays,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { getAmountsVisible, maskFormattedAmount } from '@/lib/amounts-visibility'
import type { Movement, MovementFilters } from '@/types'
import { movementMatchesFilters } from '@/lib/movements-query'

export type FormatCurrencyOptions = {
  /** When true, always show the amount (e.g. live preview while editing a form). */
  visible?: boolean
}

export function formatCurrency(
  amount: number,
  currency = 'ARS',
  options?: FormatCurrencyOptions,
): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  const show = options?.visible ?? getAmountsVisible()
  if (!show) return maskFormattedAmount(formatted)
  return formatted
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: es })
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd/M/yy', { locale: es })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentMonthRange(referenceDate = new Date()): { from: string; to: string } {
  return {
    from: format(startOfMonth(referenceDate), 'yyyy-MM-dd'),
    to: format(endOfMonth(referenceDate), 'yyyy-MM-dd'),
  }
}

/** Inclusive rolling window ending on referenceDate (e.g. 90 → last 90 calendar days). */
export function rollingDaysRange(days: number, referenceDate = new Date()): { from: string; to: string } {
  const safeDays = Math.max(1, days)
  return {
    from: format(subDays(referenceDate, safeDays - 1), 'yyyy-MM-dd'),
    to: format(referenceDate, 'yyyy-MM-dd'),
  }
}

export function dateSpanFromIsoDates(dates: string[]): { from: string; to: string } | undefined {
  if (dates.length === 0) return undefined
  const sorted = [...dates].sort()
  return { from: sorted[0]!, to: sorted[sorted.length - 1]! }
}

export function previousMonthRange(referenceDate = new Date()): { from: string; to: string } {
  const previous = subMonths(referenceDate, 1)
  return {
    from: format(startOfMonth(previous), 'yyyy-MM-dd'),
    to: format(endOfMonth(previous), 'yyyy-MM-dd'),
  }
}

/** Same-length period immediately before `period`. Full calendar months map to the previous month. */
export function previousPeriodForRange(period: { from: string; to: string }): {
  from: string
  to: string
} {
  const from = parseISO(period.from)
  const to = parseISO(period.to)
  const monthStart = startOfMonth(from)
  const monthEnd = endOfMonth(from)

  if (
    format(from, 'yyyy-MM-dd') === format(monthStart, 'yyyy-MM-dd') &&
    format(to, 'yyyy-MM-dd') === format(monthEnd, 'yyyy-MM-dd')
  ) {
    return previousMonthRange(from)
  }

  const days = differenceInDays(to, from) + 1
  const prevTo = subDays(from, 1)
  const prevFrom = subDays(prevTo, days - 1)
  return {
    from: format(prevFrom, 'yyyy-MM-dd'),
    to: format(prevTo, 'yyyy-MM-dd'),
  }
}

export function formatMonthLabel(from: string): string {
  const label = format(parseISO(from), 'MMMM yyyy', { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function filterMovements(movements: Movement[], filters: MovementFilters): Movement[] {
  return movements.filter((m) => movementMatchesFilters(m, filters))
}

export function movementTypeLabel(type: Movement['type']): string {
  switch (type) {
    case 'income':
      return 'Ingreso'
    case 'expense':
      return 'Gasto'
    case 'settlement':
      return 'Liquidación'
  }
}

export function movementTypeColor(type: Movement['type']): string {
  switch (type) {
    case 'income':
      return 'text-emerald-800 bg-emerald-50'
    case 'expense':
      return 'text-red-800 bg-red-50'
    case 'settlement':
      return 'text-blue-800 bg-blue-50'
  }
}

/** Text color for movement amounts on white backgrounds (WCAG-friendly). */
export function movementAmountColor(type: Movement['type']): string {
  switch (type) {
    case 'income':
      return 'text-emerald-700'
    case 'expense':
      return 'text-red-700'
    case 'settlement':
      return 'text-blue-700'
  }
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateId(): string {
  return crypto.randomUUID()
}

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('')
}

export function isInPeriod(dateStr: string, from: string, to: string): boolean {
  const date = parseISO(dateStr)
  return isWithinInterval(date, { start: parseISO(from), end: parseISO(to) })
}
