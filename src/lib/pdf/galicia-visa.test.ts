import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  detectGaliciaVisaPdf,
  parseGaliciaVisaLine,
  parseGaliciaVisaText,
} from '@/lib/pdf/galicia-visa'
import { parsePdfText } from '@/lib/pdf/parse-pdf'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const fixtureText = readFileSync(join(fixtureDir, 'galicia-visa-may-2026.txt'), 'utf8')

const SAMPLE_TEXT = `
Tarjeta Crédito VISA
DETALLE DEL CONSUMO
FECHA REFERENCIA CUOTA COMPROBANTE PESOS DÓLARES
17-12-25 * MERPAGO*GRAMABI 06/06 955106 14.401,16
30-04-26 K MERPAGO*TIENDADEPELUQ 114376 28.370,00
09-05-26 APPLE.COM/BILL MKX7JMSB5USD 0,99 834804 0,99
TARJETA 3908 Total Consumos de BARRIOS ELI MORALES 725.047,66 0,99
`

describe('parseGaliciaVisaLine', () => {
  it('parses installment and current-month purchase lines', () => {
    expect(parseGaliciaVisaLine('17-12-25 * MERPAGO*GRAMABI 06/06 955106 14.401,16')).toEqual({
      date: '2025-12-17',
      description: 'MERPAGO*GRAMABI 06/06\nComprobante: 955106',
      amount: 14401.16,
      currency: 'ARS',
      merchant: '955106',
    })

    expect(parseGaliciaVisaLine('30-04-26 K MERPAGO*TIENDADEPELUQ 114376 28.370,00')).toEqual({
      date: '2026-04-30',
      description: 'MERPAGO*TIENDADEPELUQ\nComprobante: 114376',
      amount: 28370,
      currency: 'ARS',
      merchant: '114376',
    })
  })

  it('parses USD purchases from the Visa format', () => {
    expect(parseGaliciaVisaLine('09-05-26 APPLE.COM/BILL MKX7JMSB5USD 0,99 834804 0,99')).toMatchObject({
      currency: 'USD',
      amount: 0.99,
      merchant: '834804',
      description: 'APPLE.COM/BILL MKX7JMSB5USD 0,99\nComprobante: 834804',
    })
  })
})

describe('parseGaliciaVisaText', () => {
  it('extracts only consumption rows from the detail section', () => {
    const rows = parseGaliciaVisaText(SAMPLE_TEXT)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ currency: 'ARS', merchant: '955106' })
    expect(rows[1].description).toBe('MERPAGO*TIENDADEPELUQ\nComprobante: 114376')
  })

  it('detects Galicia Visa PDF text', () => {
    expect(detectGaliciaVisaPdf(SAMPLE_TEXT)).toBe(true)
    expect(detectGaliciaVisaPdf('extracto bancario random')).toBe(false)
  })

  it('parses the May 2026 fixture with 24 movements', () => {
    expect(detectGaliciaVisaPdf(fixtureText)).toBe(true)

    const rows = parseGaliciaVisaText(fixtureText)
    expect(rows).toHaveLength(24)

    const apple = rows.find((row) => row.description.startsWith('APPLE.COM/BILL'))
    expect(apple).toMatchObject({
      date: '2026-05-09',
      amount: 0.99,
      currency: 'USD',
      merchant: '834804',
    })

    const installment = rows.find((row) => row.description.startsWith('MERPAGO*GRAMABI'))
    expect(installment).toMatchObject({
      date: '2025-12-17',
      amount: 14401.16,
      currency: 'ARS',
    })
    expect(installment?.description).toContain('06/06')
  })
})

describe('parsePdfText', () => {
  it('builds a parse result with per-row currency for Visa', () => {
    const result = parsePdfText(fixtureText)

    expect(result.skipMapping).toBe(true)
    expect(result.perRowCurrency).toBe(true)
    expect(result.pdfProfile).toBe('galicia-visa')
    expect(result.rows).toHaveLength(24)
    expect(result.headers).toEqual(['Fecha', 'Referencia', 'Comprobante', 'Pesos', 'Dólares'])
  })
})
