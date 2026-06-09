import { payerDisplayLabel, payerFilterLabel, type CouplePersonsView } from '@/lib/couple/person-labels'
import { movementTypeLabel } from '@/lib/utils'
import type { Category, CurrencyCode, Movement, MovementSource, MovementType } from '@/types'

export interface MovementSearchContext {
  categories: Category[]
  persons: CouplePersonsView
}

export interface ParsedMovementSearch {
  textTerms: string[]
  minAmount?: number
  maxAmount?: number
  minExclusive?: boolean
  maxExclusive?: boolean
  currency?: CurrencyCode
  isShared?: boolean
  source?: MovementSource
  uncategorized?: boolean
  type?: MovementType
}

const MULTI_WORD_KEYWORDS: { pattern: RegExp; apply: (parsed: ParsedMovementSearch) => void }[] = [
  {
    pattern: /\bsin[\s-]categor[ií]a\b/gi,
    apply: (p) => {
      p.uncategorized = true
    },
  },
]

const SINGLE_WORD_KEYWORDS: Record<
  string,
  (parsed: ParsedMovementSearch) => void
> = {
  compartido: (p) => {
    p.isShared = true
  },
  personal: (p) => {
    p.isShared = false
  },
  importado: (p) => {
    p.source = 'imported'
  },
  manual: (p) => {
    p.source = 'manual'
  },
  usd: (p) => {
    p.currency = 'USD'
  },
  dolar: (p) => {
    p.currency = 'USD'
  },
  dólar: (p) => {
    p.currency = 'USD'
  },
  dolares: (p) => {
    p.currency = 'USD'
  },
  dólares: (p) => {
    p.currency = 'USD'
  },
  ars: (p) => {
    p.currency = 'ARS'
  },
  peso: (p) => {
    p.currency = 'ARS'
  },
  pesos: (p) => {
    p.currency = 'ARS'
  },
  gasto: (p) => {
    p.type = 'expense'
  },
  gastos: (p) => {
    p.type = 'expense'
  },
  ingreso: (p) => {
    p.type = 'income'
  },
  ingresos: (p) => {
    p.type = 'income'
  },
  liquidacion: (p) => {
    p.type = 'settlement'
  },
  liquidación: (p) => {
    p.type = 'settlement'
  },
}

const AMOUNT_TOKEN = /^([<>]=?)([\d.,]+)$/

function normalizeToken(token: string): string {
  return token
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function parseAmount(value: string): number | undefined {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

export function parseMovementSearchQuery(query: string): ParsedMovementSearch {
  const parsed: ParsedMovementSearch = { textTerms: [] }
  let remainder = query.trim()
  if (!remainder) return parsed

  for (const { pattern, apply } of MULTI_WORD_KEYWORDS) {
    if (pattern.test(remainder)) {
      apply(parsed)
      remainder = remainder.replace(pattern, ' ')
    }
    pattern.lastIndex = 0
  }

  for (const token of remainder.split(/\s+/).filter(Boolean)) {
    const amountMatch = token.match(AMOUNT_TOKEN)
    if (amountMatch) {
      const op = amountMatch[1]
      const amount = parseAmount(amountMatch[2])
      if (amount !== undefined) {
        if (op.startsWith('>')) {
          parsed.minAmount = amount
          parsed.minExclusive = op === '>'
        } else {
          parsed.maxAmount = amount
          parsed.maxExclusive = op === '<'
        }
      }
      continue
    }

    const key = normalizeToken(token)
    const keyword = SINGLE_WORD_KEYWORDS[key]
    if (keyword) {
      keyword(parsed)
      continue
    }

    parsed.textTerms.push(key)
  }

  return parsed
}

function movementSearchHaystack(m: Movement, ctx: MovementSearchContext): string {
  const cat = ctx.categories.find((c) => c.id === m.categoryId)
  const parts = [
    m.description,
    cat?.name,
    m.currency,
    movementTypeLabel(m.type),
    payerDisplayLabel(m.paidBy, ctx.persons),
    payerFilterLabel(m.paidBy, ctx.persons),
    m.isShared ? 'compartido' : 'personal',
    m.source === 'imported' ? 'importado' : 'manual',
    m.categoryId ? undefined : 'sin categoria',
  ]
  return parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function matchesAmount(m: Movement, parsed: ParsedMovementSearch): boolean {
  if (parsed.minAmount !== undefined) {
    if (parsed.minExclusive) {
      if (m.amount <= parsed.minAmount) return false
    } else if (m.amount < parsed.minAmount) return false
  }
  if (parsed.maxAmount !== undefined) {
    if (parsed.maxExclusive) {
      if (m.amount >= parsed.maxAmount) return false
    } else if (m.amount > parsed.maxAmount) return false
  }
  return true
}

export function movementMatchesSearch(
  m: Movement,
  query: string,
  context?: MovementSearchContext,
): boolean {
  const trimmed = query.trim()
  if (!trimmed) return true

  const parsed = parseMovementSearchQuery(trimmed)

  if (parsed.currency && m.currency !== parsed.currency) return false
  if (parsed.isShared !== undefined && m.isShared !== parsed.isShared) return false
  if (parsed.source && m.source !== parsed.source) return false
  if (parsed.type && m.type !== parsed.type) return false
  if (parsed.uncategorized) {
    if (m.type === 'settlement') return false
    if (m.categoryId !== null) return false
  }
  if (!matchesAmount(m, parsed)) return false

  if (parsed.textTerms.length === 0) return true

  const haystack = context
    ? movementSearchHaystack(m, context)
    : m.description
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()

  return parsed.textTerms.every((term) => haystack.includes(term))
}
