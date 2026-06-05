import { parseAmount, parseDate, buildImportDescription, type ParsedRow } from '@/lib/import'
import type { CurrencyCode } from '@/types'

const DATE_LINE = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+)$/
const COMPROBANTE_SUFFIX = /\s(\d{5})$/
const DUAL_AMOUNT_SUFFIX = /\s([\d]{1,3}(?:\.\d{3})*,\d{2})\s+([\d]{1,3}(?:\.\d{3})*,\d{2})\s*$/
const SINGLE_AMOUNT_SUFFIX = /\s([\d]{1,3}(?:\.\d{3})*,\d{2})\s*$/

const SECTION_END = /^(Cuotas a vencer|OPCIONES DE FINANCIACION|INFORMACION INSTITUCIONAL)/i
const SKIP_LINE =
  /^(SUBTOTAL|TOTAL A PAGAR|Resumen de tarjeta|Resumen N°|COMPRAS DEL MES|CUOTA DEL MES|FECHA REFERENCIA COMPROBANTE)/i

function isUsdDescription(description: string): boolean {
  return /\(USA,\s*USD|,\s*USD,|\bU\$S\b|\bUSD\b/i.test(description)
}

function resolveGaliciaAmounts(rest: string): { amount: number; currency: CurrencyCode; rest: string } | null {
  const dual = rest.match(DUAL_AMOUNT_SUFFIX)
  if (dual) {
    const pesos = parseAmount(dual[1])
    const dolares = parseAmount(dual[2])
    const trimmedRest = rest.slice(0, -dual[0].length).trim()

    if (dolares !== null && dolares > 0) {
      return { amount: dolares, currency: 'USD', rest: trimmedRest }
    }
    if (pesos !== null) {
      return { amount: pesos, currency: 'ARS', rest: trimmedRest }
    }
    return null
  }

  const single = rest.match(SINGLE_AMOUNT_SUFFIX)
  if (!single) return null

  const amount = parseAmount(single[1])
  if (amount === null) return null

  const trimmedRest = rest.slice(0, -single[0].length).trim()
  const currency: CurrencyCode = isUsdDescription(trimmedRest) ? 'USD' : 'ARS'
  return { amount, currency, rest: trimmedRest }
}

export function detectGaliciaMastercardPdf(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ')
  return (
    flat.includes('DETALLE DEL CONSUMO') &&
    flat.includes('FECHA REFERENCIA COMPROBANTE') &&
    /MASTERCARD|Tarjeta Cr[eé]dito/i.test(flat)
  )
}

export function parseGaliciaMastercardLine(line: string): ParsedRow | null {
  const match = line.trim().match(DATE_LINE)
  if (!match) return null

  const date = parseDate(match[1])
  if (!date) return null

  const resolved = resolveGaliciaAmounts(match[2])
  if (!resolved) return null

  let rest = resolved.rest
  let comprobante: string | undefined
  const comprobanteMatch = rest.match(COMPROBANTE_SUFFIX)
  if (comprobanteMatch) {
    comprobante = comprobanteMatch[1]
    rest = rest.slice(0, -comprobanteMatch[0].length).trim()
  }

  const description = buildImportDescription({ primary: rest.trim(), comprobante })
  if (!description) return null

  return {
    date,
    description,
    amount: resolved.amount,
    currency: resolved.currency,
    merchant: comprobante,
  }
}

export function parseGaliciaMastercardText(text: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  let inDetail = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.includes('DETALLE DEL CONSUMO')) {
      inDetail = true
      continue
    }
    if (!inDetail) continue
    if (SECTION_END.test(line)) break
    if (SKIP_LINE.test(line)) continue

    const parsed = parseGaliciaMastercardLine(line)
    if (parsed) rows.push(parsed)
  }

  return rows
}
