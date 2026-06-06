import type { ParseResult } from '@/lib/import'
import { extractTextFromImageFile, type OcrProgress } from '@/lib/ocr/extract-text'
import type { ImageProfile } from '@/lib/ocr/profile-labels'
import { detectWallbitDebitText, parseWallbitDebitText } from '@/lib/ocr/wallbit-debit'

export type { ImageProfile } from '@/lib/ocr/profile-labels'
export type { OcrProgress }

const IMAGE_HEADERS = ['Fecha', 'Referencia', 'Comprobante', 'Pesos', 'Dólares'] as const

function rowsToParseResult(rows: ParseResult['rows'], profile: ImageProfile): ParseResult {
  const rawRows = rows.map((row) => ({
    Fecha: row.date,
    Referencia: row.description,
    Comprobante: row.merchant ?? '',
    Pesos: '',
    Dólares: String(row.amount),
  }))

  return {
    headers: [...IMAGE_HEADERS],
    rawRows,
    rows,
    skipMapping: true,
    perRowCurrency: true,
    imageProfile: profile,
  }
}

export function parseImageText(text: string): ParseResult {
  if (detectWallbitDebitText(text)) {
    const outcome = parseWallbitDebitText(text)
    if (outcome.rows.length === 0) {
      throw new Error(
        'Se reconoció una captura Wallbit, pero no se encontraron consumos. Probá con más zoom, mejor luz o una captura más nítida.',
      )
    }
    return rowsToParseResult(outcome.rows, 'wallbit-debit')
  }

  throw new Error(
    'Formato de imagen no reconocido. Por ahora solo se soportan capturas de la lista Transactions de Wallbit (PNG o JPEG).',
  )
}

export async function parseImageFile(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<ParseResult> {
  const text = await extractTextFromImageFile(file, onProgress)
  return parseImageText(text)
}
