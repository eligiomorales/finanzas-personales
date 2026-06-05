import type { ParseResult } from '@/lib/import'
import { extractTextFromPdf } from '@/lib/pdf/extract-text'
import {
  detectGaliciaMastercardPdf,
  parseGaliciaMastercardText,
} from '@/lib/pdf/galicia-mastercard'
import { detectGaliciaVisaPdf, parseGaliciaVisaText } from '@/lib/pdf/galicia-visa'

export type PdfProfile = 'galicia-mastercard' | 'galicia-visa'

const PDF_HEADERS = ['Fecha', 'Referencia', 'Comprobante', 'Pesos', 'Dólares'] as const

function rowsToParseResult(rows: ParseResult['rows'], profile: PdfProfile): ParseResult {
  const rawRows = rows.map((row) => ({
    Fecha: row.date,
    Referencia: row.description,
    Comprobante: row.merchant ?? '',
    Pesos: row.currency === 'ARS' ? String(row.amount) : '',
    Dólares: row.currency === 'USD' ? String(row.amount) : '',
  }))

  return {
    headers: [...PDF_HEADERS],
    rawRows,
    rows,
    skipMapping: true,
    perRowCurrency: true,
    pdfProfile: profile,
  }
}

export function parsePdfText(text: string): ParseResult {
  if (detectGaliciaMastercardPdf(text)) {
    const rows = parseGaliciaMastercardText(text)
    if (rows.length === 0) {
      throw new Error(
        'Se reconoció un resumen Galicia Mastercard, pero no se encontraron consumos. Verificá que el PDF no esté escaneado como imagen.',
      )
    }
    return rowsToParseResult(rows, 'galicia-mastercard')
  }

  if (detectGaliciaVisaPdf(text)) {
    const rows = parseGaliciaVisaText(text)
    if (rows.length === 0) {
      throw new Error(
        'Se reconoció un resumen Galicia Visa, pero no se encontraron consumos. Verificá que el PDF no esté escaneado como imagen.',
      )
    }
    return rowsToParseResult(rows, 'galicia-visa')
  }

  throw new Error(
    'Formato PDF no reconocido. Por ahora solo se soportan resúmenes Galicia Mastercard y Galicia Visa. Podés exportar a Excel/CSV desde el home banking.',
  )
}

export async function parsePdfFile(buffer: ArrayBuffer): Promise<ParseResult> {
  const text = await extractTextFromPdf(buffer)
  return parsePdfText(text)
}

export function pdfProfileLabel(profile: PdfProfile): string {
  switch (profile) {
    case 'galicia-mastercard':
      return 'Galicia Mastercard'
    case 'galicia-visa':
      return 'Galicia Visa'
  }
}
