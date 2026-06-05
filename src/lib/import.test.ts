import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import {
  applyColumnMapping,
  buildImportDescription,
  findHeaderRowIndex,
  guessColumnMapping,
  normalizeDescription,
  parseAmount,
  parseDate,
} from '@/lib/import'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const GALICIA_EXCEL = join(fixtureDir, 'galicia-extracto.xlsx')

function parseGaliciaExcel() {
  const buffer = readFileSync(GALICIA_EXCEL)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const headerRowIndex = findHeaderRowIndex(matrix)
  const headers = (matrix[headerRowIndex] as unknown[]).map((cell) => String(cell ?? '').trim())
  const rawRows = matrix.slice(headerRowIndex + 1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header || `Columna ${index + 1}`] = String((row as unknown[])[index] ?? '').trim()
    })
    return record
  })
  return { headers, rawRows }
}

describe('parseDate', () => {
  it('parses ISO and Argentine formats', () => {
    expect(parseDate('2025-10-01')).toBe('2025-10-01')
    expect(parseDate('28/05/2026')).toBe('2026-05-28')
    expect(parseDate('01-Oct-25')).toBe('2025-10-01')
  })
})

describe('parseAmount', () => {
  it('parses Argentine amounts and ignores zero', () => {
    expect(parseAmount('-7.640,00')).toBe(7640)
    expect(parseAmount('0,00')).toBeNull()
    expect(parseAmount('3.249.689,00')).toBe(3249689)
  })
})

describe('normalizeDescription', () => {
  it('preserves the full multiline bank text for categorization', () => {
    expect(
      normalizeDescription(' COMPRA DEBITO\n SAN ANTONIO\n 4517XXXXXXXXXX73\n A105\n'),
    ).toBe('COMPRA DEBITO\nSAN ANTONIO\n4517XXXXXXXXXX73\nA105')
  })
})

describe('buildImportDescription', () => {
  it('appends comprobante metadata when available', () => {
    expect(buildImportDescription({ primary: 'FARMACITY', comprobante: '06569' })).toBe(
      'FARMACITY\nComprobante: 06569',
    )
  })

  it('keeps multiline bank movement text intact', () => {
    expect(
      buildImportDescription({
        primary: 'COMPRA DEBITO\nSAN ANTONIO\n4517XXXXXXXXXX73',
      }),
    ).toBe('COMPRA DEBITO\nSAN ANTONIO\n4517XXXXXXXXXX73')
  })
})

describe('Galicia Excel extract', () => {
  it('detects the real header row after account metadata', () => {
    const buffer = readFileSync(GALICIA_EXCEL)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

    expect(findHeaderRowIndex(matrix)).toBe(5)
  })

  it('maps Galicia columns and extracts movements', () => {
    const { headers, rawRows } = parseGaliciaExcel()
    const mapping = guessColumnMapping(headers)

    expect(mapping.date).toBe('Fecha')
    expect(mapping.description).toBe('Movimiento')
    expect(mapping.debit).toBe('Débito')
    expect(mapping.credit).toBe('Crédito')

    const rows = applyColumnMapping(rawRows, mapping as Required<typeof mapping>, 'debit')
    expect(rows.length).toBeGreaterThan(50)

    const purchase = rows.find((row) => row.description.startsWith('COMPRA DEBITO'))
    expect(purchase).toMatchObject({
      date: '2026-05-26',
      amount: 18600,
      currency: 'ARS',
    })
    expect(purchase?.description).toContain('SAN ANTONIO')
    expect(purchase?.description).not.toContain('Comprobante:')
  })

  it('assigns USD when the dólares column has value', () => {
    const rows = applyColumnMapping(
      [
        {
          Fecha: '01/10/2025',
          Referencia: 'APPLE.COM/BILL',
          Pesos: '0,00',
          Dólares: '9,99',
        },
      ],
      {
        date: 'Fecha',
        description: 'Referencia',
        amount: 'Pesos',
        amountUsd: 'Dólares',
      },
      'credit',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ amount: 9.99, currency: 'USD' })
  })
})
