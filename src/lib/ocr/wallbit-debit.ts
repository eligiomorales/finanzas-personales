import type { ParsedRow } from '@/lib/import'

const MONTHS_EN: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
}

const DATE_HEADER_EN =
  /^\W*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})\s*$/i

const ROW_DATE_MDY = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/

const AMOUNT_RE = /-\s*US\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi

const UI_SKIP = new Set([
  'transactions',
  'transaction',
  'balance',
  'home',
  'settings',
  'wallbit',
])

const OCR_SIGN_CHARS: [string, string][] = [
  ['\u2212', '-'],
  ['\u2013', '-'],
  ['\u2014', '-'],
]

/** Transferencias internas en Wallbit — no son gastos al comercio. */
const IGNORED_DESC_SUBSTRINGS = ['carlos', 'eligio'] as const

export interface WallbitParseOutcome {
  rows: ParsedRow[]
  forceNeedsReview: boolean
}

function normDescKey(value: string): string {
  const lowered = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  return lowered.split(/\s+/).filter(Boolean).join(' ')
}

export function isIgnoredWallbitDescription(description: string): boolean {
  if (!description.trim()) return false
  const key = normDescKey(description)
  return IGNORED_DESC_SUBSTRINGS.some((sub) => key.includes(sub))
}

function normalizeLine(line: string): string {
  let s = line.trim()
  for (const [bad, good] of OCR_SIGN_CHARS) {
    s = s.replaceAll(bad, good)
  }
  return s
}

function normMonthToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function parseHeaderDateEn(match: RegExpMatchArray): string | null {
  const month = MONTHS_EN[normMonthToken(match[1] ?? '')]
  if (!month) return null
  const day = Number(match[2])
  const year = Number(match[3])
  if (!Number.isInteger(day) || !Number.isInteger(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseRowMdy(match: RegExpMatchArray): string | null {
  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseUsAmountToken(num: string): number | null {
  const cleaned = num.trim().replace(/\s/g, '').replace(/,/g, '')
  if (!cleaned) return null
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : null
}

function lastAmountMatch(line: string): RegExpExecArray | null {
  const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags)
  let last: RegExpExecArray | null = null
  let match = re.exec(line)
  while (match) {
    last = match
    match = re.exec(line)
  }
  return last
}

function lineHasAmount(line: string): boolean {
  return lastAmountMatch(line) !== null
}

function isUiNoise(value: string): boolean {
  const t = value.trim().toLowerCase()
  if (!t || t.length <= 1) return true
  if (UI_SKIP.has(t)) return true
  if (t === '<' || t === '>' || t === 'v' || t === '^') return true
  return false
}

function collectDescription(lines: string[], amountIdx: number, amountStart: number): string {
  const parts: string[] = []
  const same = lines[amountIdx]?.slice(0, amountStart).trim() ?? ''
  if (same && !isUiNoise(same)) parts.push(same)

  let j = amountIdx - 1
  while (j >= 0) {
    const line = lines[j]?.trim() ?? ''
    if (!line) break
    if (DATE_HEADER_EN.test(line)) break
    if (ROW_DATE_MDY.test(line)) {
      j -= 1
      continue
    }
    if (lineHasAmount(line)) break
    if (isUiNoise(line)) {
      j -= 1
      continue
    }
    parts.push(line)
    j -= 1
  }

  parts.reverse()
  return parts.filter(Boolean).join(' — ').trim()
}

function rowDateAbove(lines: string[], amountIdx: number): string | null {
  if (amountIdx <= 0) return null
  const prev = lines[amountIdx - 1]?.trim() ?? ''
  const match = prev.match(ROW_DATE_MDY)
  if (!match) return null
  return parseRowMdy(match)
}

export function detectWallbitDebitText(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ').toLowerCase()
  const hasWallbitCue = flat.includes('transactions') || flat.includes('wallbit')
  const hasUsdCharges = /-\s*us\s*\$?\s*[\d,]+(?:\.\d{1,2})?/i.test(text)
  const hasEnglishDateHeader =
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4}/i.test(
      text,
    )
  const hasRowDate = /\d{1,2}\/\d{1,2}\/\d{4}/.test(text)
  return hasWallbitCue && hasUsdCharges && (hasEnglishDateHeader || hasRowDate)
}

export function parseWallbitDebitText(text: string): WallbitParseOutcome {
  const lines = text.split('\n').map(normalizeLine)
  const rows: ParsedRow[] = []
  let currentSection: string | null = null

  if (!lines.some((line) => line.trim())) {
    return { rows, forceNeedsReview: true }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    if (!line) continue

    const headerMatch = line.match(DATE_HEADER_EN)
    if (headerMatch) {
      const sectionDate = parseHeaderDateEn(headerMatch)
      if (sectionDate) currentSection = sectionDate
      continue
    }

    const amountMatch = lastAmountMatch(line)
    if (!amountMatch) continue

    const magnitude = parseUsAmountToken(amountMatch[1] ?? '')
    if (magnitude === null || magnitude < 0) continue

    const rowDate = rowDateAbove(lines, i)
    const purchaseDate = rowDate ?? currentSection
    let description = collectDescription(lines, i, amountMatch.index ?? 0)
    if (!description) description = `Wallbit (${magnitude})`

    if (isIgnoredWallbitDescription(description)) continue

    rows.push({
      date: purchaseDate ?? '',
      description,
      amount: magnitude,
      currency: 'USD',
    })
  }

  return {
    rows,
    forceNeedsReview: rows.length === 0,
  }
}
