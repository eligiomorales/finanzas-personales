import { normalizeRuleKeyword } from '@/lib/category-rules'
import type { Category, CategoryRule, Movement } from '@/types'

export interface InferredRule {
  keyword: string
  categoryId: string
  categoryName: string
  count: number
  dominance: number
}

export interface InferRulesOptions {
  minCount?: number
  minDominance?: number
}

// ponytail: lista mínima; ampliar solo si genera ruido en datos reales
const BANK_STOPWORDS = new Set([
  'compra',
  'debito',
  'débito',
  'credito',
  'crédito',
  'pago',
  'transferencia',
  'visa',
  'mastercard',
  'master',
  'consumo',
  'movimiento',
  'referencia',
  'comprobante',
])

/** Mirrors hardcoded keywords in suggestCategory (import.ts). */
const HARDCODED_KEYWORD_TO_CATEGORY: [string, string][] = [
  ['super', 'Supermercado'],
  ['carrefour', 'Supermercado'],
  ['coto', 'Supermercado'],
  ['jumbo', 'Supermercado'],
  ['dia', 'Supermercado'],
  ['restaurant', 'Restaurantes'],
  ['resto', 'Restaurantes'],
  ['cafe', 'Restaurantes'],
  ['café', 'Restaurantes'],
  ['pizza', 'Restaurantes'],
  ['burger', 'Restaurantes'],
  ['uber', 'Transporte'],
  ['cabify', 'Transporte'],
  ['taxi', 'Transporte'],
  ['subte', 'Transporte'],
  ['colectivo', 'Transporte'],
  ['nafta', 'Transporte'],
  ['ypf', 'Transporte'],
  ['shell', 'Transporte'],
  ['netflix', 'Suscripciones'],
  ['spotify', 'Suscripciones'],
  ['disney', 'Suscripciones'],
  ['hbo', 'Suscripciones'],
  ['suscrip', 'Suscripciones'],
  ['farmacia', 'Salud'],
  ['medico', 'Salud'],
  ['médico', 'Salud'],
  ['hospital', 'Salud'],
  ['osde', 'Salud'],
  ['swiss', 'Salud'],
  ['edenor', 'Servicios'],
  ['metrogas', 'Servicios'],
  ['aysa', 'Servicios'],
  ['internet', 'Servicios'],
  ['telecom', 'Servicios'],
  ['movistar', 'Servicios'],
  ['claro', 'Servicios'],
]

function firstLine(description: string): string {
  return description.split('\n')[0]?.trim() ?? ''
}

export function extractDescriptionTokens(description: string): string[] {
  const line = firstLine(description).toLowerCase()
  if (!line) return []

  const raw = line.split(/[\s*/\-_,.;:]+/)
  const seen = new Set<string>()
  const tokens: string[] = []

  for (const part of raw) {
    const token = part.trim()
    if (token.length < 4) continue
    if (/^\d+$/.test(token)) continue
    if (BANK_STOPWORDS.has(token)) continue
    if (seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }

  return tokens
}

function isRedundantHardcodedKeyword(
  keyword: string,
  categoryId: string,
  categories: Category[],
): boolean {
  const hardcodedCategoryName = HARDCODED_KEYWORD_TO_CATEGORY.find(([k]) => k === keyword)?.[1]
  if (!hardcodedCategoryName) return false
  const hardcodedCat = categories.find(
    (c) => c.type === 'expense' && c.name === hardcodedCategoryName,
  )
  return hardcodedCat?.id === categoryId
}

function buildExistingKeywords(existingRules: CategoryRule[]): Set<string> {
  return new Set(existingRules.map((rule) => normalizeRuleKeyword(rule.keyword)))
}

export function inferRulesFromHistory(
  movements: Movement[],
  existingRules: CategoryRule[],
  categories: Category[],
  options: InferRulesOptions = {},
): InferredRule[] {
  const minCount = options.minCount ?? 2
  const minDominance = options.minDominance ?? 0.8
  const existingKeywords = buildExistingKeywords(existingRules)
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const tokenCategoryCounts = new Map<string, Map<string, number>>()

  for (const movement of movements) {
    if (movement.type !== 'expense' || !movement.categoryId) continue
    if (!categoryById.has(movement.categoryId)) continue

    for (const token of extractDescriptionTokens(movement.description)) {
      let byCategory = tokenCategoryCounts.get(token)
      if (!byCategory) {
        byCategory = new Map()
        tokenCategoryCounts.set(token, byCategory)
      }
      byCategory.set(movement.categoryId, (byCategory.get(movement.categoryId) ?? 0) + 1)
    }
  }

  const inferred: InferredRule[] = []

  for (const [keyword, byCategory] of tokenCategoryCounts) {
    if (existingKeywords.has(keyword)) continue

    let total = 0
    let bestCategoryId = ''
    let bestCount = 0

    for (const [categoryId, count] of byCategory) {
      total += count
      if (count > bestCount) {
        bestCount = count
        bestCategoryId = categoryId
      }
    }

    if (total < minCount) continue

    const dominance = bestCount / total
    if (dominance < minDominance) continue

    const category = categoryById.get(bestCategoryId)
    if (!category || category.type !== 'expense') continue
    if (isRedundantHardcodedKeyword(keyword, bestCategoryId, categories)) continue

    inferred.push({
      keyword,
      categoryId: bestCategoryId,
      categoryName: category.name,
      count: total,
      dominance,
    })
  }

  return inferred.sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
}
