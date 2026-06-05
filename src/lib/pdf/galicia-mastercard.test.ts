import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  detectGaliciaMastercardPdf,
  parseGaliciaMastercardLine,
  parseGaliciaMastercardText,
} from '@/lib/pdf/galicia-mastercard'
import { parsePdfText } from '@/lib/pdf/parse-pdf'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const fixtureText = readFileSync(join(fixtureDir, 'galicia-mastercard-nov-2025.txt'), 'utf8')

const SAMPLE_TEXT = `
Tarjeta Crédito MASTERCARD GOLD
DETALLE DEL CONSUMO
FECHA REFERENCIA COMPROBANTE PESOS DÓLARES
COMPRAS DEL MES
01-Oct-25 FARMACITY 06569 29.539,50
04-Oct-25 DIA TIENDA 568 05158 16.223,00
05-Oct-25 MERPAGO*BIDCOM 01/03 05614 153.583,00
SUBTOTAL 1.378.206,58 0,00
Cuotas a vencer
`

describe('parseGaliciaMastercardLine', () => {
  it('parses ARS purchase and installment lines', () => {
    expect(parseGaliciaMastercardLine('01-Oct-25 FARMACITY 06569 29.539,50')).toEqual({
      date: '2025-10-01',
      description: 'FARMACITY\nComprobante: 06569',
      amount: 29539.5,
      currency: 'ARS',
      merchant: '06569',
    })

    expect(parseGaliciaMastercardLine('04-Oct-25 DIA TIENDA 568 05158 16.223,00')).toEqual({
      date: '2025-10-04',
      description: 'DIA TIENDA 568\nComprobante: 05158',
      amount: 16223,
      currency: 'ARS',
      merchant: '05158',
    })

    expect(parseGaliciaMastercardLine('05-Oct-25 MERPAGO*BIDCOM 01/03 05614 153.583,00')).toEqual({
      date: '2025-10-05',
      description: 'MERPAGO*BIDCOM 01/03\nComprobante: 05614',
      amount: 153583,
      currency: 'ARS',
      merchant: '05614',
    })
  })

  it('parses dual-column lines and USD-only purchases', () => {
    expect(parseGaliciaMastercardLine('01-Oct-25 FARMACITY 06569 29.539,50 0,00')).toMatchObject({
      currency: 'ARS',
      amount: 29539.5,
    })

    expect(parseGaliciaMastercardLine('07-Abr-24 APPLE.COM/BILL (USA,USD, 9,99) 00677 0,00 9,99')).toMatchObject({
      currency: 'USD',
      amount: 9.99,
      description: 'APPLE.COM/BILL (USA,USD, 9,99)\nComprobante: 00677',
    })

    expect(parseGaliciaMastercardLine('07-Abr-24 APPLE.COM/BILL (USA,USD, 9,99) 00677 9,99')).toMatchObject({
      currency: 'USD',
      amount: 9.99,
    })
  })
})

describe('parseGaliciaMastercardText', () => {
  it('extracts only consumption rows from the detail section', () => {
    const rows = parseGaliciaMastercardText(SAMPLE_TEXT)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ description: 'FARMACITY\nComprobante: 06569', currency: 'ARS' })
    expect(rows[2].description).toBe('MERPAGO*BIDCOM 01/03\nComprobante: 05614')
  })

  it('detects Galicia Mastercard PDF text', () => {
    expect(detectGaliciaMastercardPdf(SAMPLE_TEXT)).toBe(true)
    expect(detectGaliciaMastercardPdf('extracto bancario random')).toBe(false)
  })

  it('parses the November 2025 fixture with 36 movements in ARS', () => {
    expect(detectGaliciaMastercardPdf(fixtureText)).toBe(true)

    const rows = parseGaliciaMastercardText(fixtureText)
    expect(rows).toHaveLength(36)
    expect(rows.every((row) => row.currency === 'ARS')).toBe(true)

    const farmacity = rows.find((row) => row.description.startsWith('FARMACITY'))
    expect(farmacity).toMatchObject({
      date: '2025-10-01',
      amount: 29539.5,
      merchant: '06569',
    })
    expect(farmacity?.description).toContain('Comprobante: 06569')
  })
})

describe('parsePdfText', () => {
  it('builds a parse result with per-row currency', () => {
    const result = parsePdfText(fixtureText)

    expect(result.skipMapping).toBe(true)
    expect(result.perRowCurrency).toBe(true)
    expect(result.pdfProfile).toBe('galicia-mastercard')
    expect(result.rows).toHaveLength(36)
    expect(result.headers).toEqual(['Fecha', 'Referencia', 'Comprobante', 'Pesos', 'Dólares'])
    expect(result.rows[0].currency).toBe('ARS')
  })
})
