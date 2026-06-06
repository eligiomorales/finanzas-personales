import { parseAmount, buildImportDescription, type ParsedRow } from '@/lib/import'
import type { CurrencyCode } from '@/types'

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  ene: 1,
  febrero: 2,
  feb: 2,
  marzo: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  jun: 6,
  julio: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  septiembre: 9,
  setiembre: 9,
  sep: 9,
  octubre: 10,
  oct: 10,
  noviembre: 11,
  nov: 11,
  diciembre: 12,
  diciem: 12,
  dic: 12,
}

const CLOSING_DATE = /CIERRE\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/i
const FULL_LINE =
  /^(\d{1,2})\s+([A-Za-z]+\.?)\s+(\d{1,2})\s+(\d{6})\s+([*KF])\s+(.+)$/
const SHORT_LINE = /^(\d{1,2})\s+(\d{6})\s+([*KF])\s+(.+)$/
const DUAL_AMOUNT_SUFFIX =
  /\s([\d]{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s+([\d]{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*$/
const SINGLE_AMOUNT_SUFFIX = /\s([\d]{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})-?\s*$/

const SECTION_END = /^Tarjeta \d+ Total/i
const SKIP_LINE =
  /^(SALDO ANTERIOR|SU PAGO|CR\.RG|DB\.RG|IIBB|IVA RG|Total Consumos de|Santander Río|VISA$|Sucursal:|Grupo:|Cuenta:|Fecha Comprobante|EL PRESENTE|SALDO ACTUAL|PAGO MINIMO|VILLA URQUIZA|SUPERCLUB|Le recordamos|IVA:|TORRES |AVENIDA |CAP\.|Cierre |Prox\.|LIMITES:|_{10,})/i

function parseSpanishMonth(value: string): number | null {
  const key = value.replace(/\./g, '').toLowerCase()
  return SPANISH_MONTHS[key] ?? null
}

function parseClosingMonth(value: string): number | null {
  const months: Record<string, number> = {
    ene: 1,
    feb: 2,
    mar: 3,
    abr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    ago: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dic: 12,
  }
  return months[value.toLowerCase()] ?? null
}

function extractClosingContext(text: string): { month: number; year: number } {
  const match = text.match(CLOSING_DATE)
  if (!match) {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }

  const month = parseClosingMonth(match[2]) ?? 1
  const year = parseInt(match[3], 10)
  const fullYear = year > 50 ? 1900 + year : 2000 + year
  return { month, year: fullYear }
}

function inferYear(transactionMonth: number, closing: { month: number; year: number }): number {
  if (transactionMonth > closing.month) {
    return closing.year - 1
  }
  return closing.year
}

function formatIsoDate(day: number, month: number, year: number): string | null {
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isUsdDescription(description: string): boolean {
  return /\bUSD\b|U\$S/i.test(description)
}

function isInstallmentReference(reference: string): boolean {
  return /\bC\.\d{1,2}\/\d{1,2}\b/.test(reference)
}

function resolveSantanderAmounts(
  rest: string,
): { amount: number; currency: CurrencyCode; rest: string; isPayment: boolean } | null {
  const dual = rest.match(DUAL_AMOUNT_SUFFIX)
  if (dual) {
    const pesos = parseAmount(dual[1])
    const dolares = parseAmount(dual[2])
    const trimmedRest = rest.slice(0, -dual[0].length).trim()

    if (dolares !== null && dolares > 0) {
      return { amount: dolares, currency: 'USD', rest: trimmedRest, isPayment: false }
    }
    if (pesos !== null) {
      return { amount: pesos, currency: 'ARS', rest: trimmedRest, isPayment: false }
    }
    return null
  }

  const single = rest.match(SINGLE_AMOUNT_SUFFIX)
  if (!single) return null

  const isPayment = /-$/.test(single[0])
  const amount = parseAmount(single[1])
  if (amount === null) return null

  const trimmedRest = rest.slice(0, -single[0].length).trim()
  const currency: CurrencyCode = isUsdDescription(trimmedRest) ? 'USD' : 'ARS'
  return { amount, currency, rest: trimmedRest, isPayment }
}

export function detectSantanderVisaPdf(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ')
  return (
    /Santander R[ií]o/i.test(flat) &&
    flat.includes('RESUMEN DE CUENTA') &&
    flat.includes('Fecha Comprobante Referencia') &&
    /\bVISA\b/.test(flat) &&
    !flat.includes('DETALLE DEL CONSUMO')
  )
}

export function parseSantanderVisaLine(
  line: string,
  context: { month: number | null; closing: { month: number; year: number } },
): { row: ParsedRow | null; month: number | null } {
  const trimmed = line.trim()
  let day: number | null = null
  let comprobante: string | undefined
  let rest: string | null = null
  let month = context.month

  const full = trimmed.match(FULL_LINE)
  if (full) {
    day = parseInt(full[1], 10)
    const parsedMonth = parseSpanishMonth(full[2])
    if (parsedMonth) month = parsedMonth
    comprobante = full[4]
    rest = full[6]
  } else {
    const short = trimmed.match(SHORT_LINE)
    if (!short) return { row: null, month }
    day = parseInt(short[1], 10)
    comprobante = short[2]
    rest = short[4]
  }

  if (!day || !month || !rest) return { row: null, month }

  const resolved = resolveSantanderAmounts(rest)
  if (!resolved || resolved.isPayment) return { row: null, month }

  let effectiveMonth = month
  if (!full && !isInstallmentReference(resolved.rest)) {
    effectiveMonth = context.closing.month
  }

  const year = inferYear(effectiveMonth, context.closing)
  const date = formatIsoDate(day, effectiveMonth, year)
  if (!date) return { row: null, month }

  const reference = resolved.rest.trim()
  const description = buildImportDescription({ primary: reference, comprobante })
  if (!description) return { row: null, month }

  return {
    month,
    row: {
      date,
      description,
      amount: resolved.amount,
      currency: resolved.currency,
      merchant: comprobante,
    },
  }
}

export function parseSantanderVisaText(text: string): ParsedRow[] {
  const closing = extractClosingContext(text)
  const rows: ParsedRow[] = []
  let inDetail = false
  let currentMonth: number | null = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.includes('SALDO ANTERIOR')) {
      inDetail = true
      continue
    }
    if (!inDetail) continue
    if (SECTION_END.test(line)) break
    if (SKIP_LINE.test(line)) continue
    if (/^SU PAGO|^CR\.RG/i.test(line)) continue

    const parsed = parseSantanderVisaLine(line, { month: currentMonth, closing })
    if (parsed.month) currentMonth = parsed.month
    if (parsed.row) rows.push(parsed.row)
  }

  return rows
}
