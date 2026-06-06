import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  detectSantanderVisaPdf,
  parseSantanderVisaLine,
  parseSantanderVisaText,
} from '@/lib/pdf/santander-visa'
import { parsePdfText } from '@/lib/pdf/parse-pdf'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const fixtureText = readFileSync(join(fixtureDir, 'santander-visa-apr-2026.txt'), 'utf8')

const CLOSING = { month: 3, year: 2026 }

const SAMPLE_TEXT = `
Santander Río RESUMEN DE CUENTA
VISA
Fecha Comprobante Referencia $ U$S
CIERRE 26 Mar 26 VENCIMIENTO 08 Abr 26
SALDO ANTERIOR 835.579,14 50,31
26 Marzo 05 SU PAGO EN PESOS 835.579,14-
________________________________________________________________________________________________________________
26 Marzo 01 323899 * MERPAGO*LEUTTHE 59.997,00
28 431921 K PLAYSTATION 787026394USD 11,99 11,99
Tarjeta 4536 Total Consumos de CARLO TORRES URANGA 987.352,17 * 22,67 *
`

describe('parseSantanderVisaLine', () => {
  it('parses current-month purchase with full date', () => {
    expect(
      parseSantanderVisaLine('26 Marzo 01 323899 * MERPAGO*LEUTTHE 59.997,00', {
        month: null,
        closing: CLOSING,
      }),
    ).toEqual({
      month: 3,
      row: {
        date: '2026-03-26',
        description: 'MERPAGO*LEUTTHE\nComprobante: 323899',
        amount: 59997,
        currency: 'ARS',
        merchant: '323899',
      },
    })
  })

  it('parses short lines inheriting month from context', () => {
    const first = parseSantanderVisaLine('26 Marzo 01 323899 * MERPAGO*LEUTTHE 59.997,00', {
      month: null,
      closing: CLOSING,
    })
    expect(
      parseSantanderVisaLine('01 490989 * JUMBO MARTINEZ 42.600,50', {
        month: first.month,
        closing: CLOSING,
      }),
    ).toMatchObject({
      month: 3,
      row: {
        date: '2026-03-01',
        amount: 42600.5,
        currency: 'ARS',
        merchant: '490989',
      },
    })
  })

  it('parses USD purchases from dual amount columns', () => {
    expect(
      parseSantanderVisaLine('28 431921 K PLAYSTATION 787026394USD 11,99 11,99', {
        month: 3,
        closing: CLOSING,
      }),
    ).toMatchObject({
      row: {
        currency: 'USD',
        amount: 11.99,
        merchant: '431921',
      },
    })
  })

  it('infers previous year for installment months after closing month', () => {
    expect(
      parseSantanderVisaLine('25 Diciem. 25 272642 * MERPAGO*COMPREFACIL C.04/06 19.183,16', {
        month: null,
        closing: CLOSING,
      }),
    ).toMatchObject({
      month: 12,
      row: {
        date: '2025-12-25',
        amount: 19183.16,
        currency: 'ARS',
      },
    })
  })
})

describe('parseSantanderVisaText', () => {
  it('detects Santander Visa PDF text', () => {
    expect(detectSantanderVisaPdf(SAMPLE_TEXT)).toBe(true)
    expect(detectSantanderVisaPdf('DETALLE DEL CONSUMO Galicia Visa')).toBe(false)
  })

  it('skips payments and stops before taxes', () => {
    const rows = parseSantanderVisaText(SAMPLE_TEXT)
    expect(rows).toHaveLength(2)
    expect(rows.every((row) => !row.description.includes('SU PAGO'))).toBe(true)
  })

  it('parses the April 2026 fixture with 44 movements', () => {
    expect(detectSantanderVisaPdf(fixtureText)).toBe(true)

    const rows = parseSantanderVisaText(fixtureText)
    expect(rows).toHaveLength(44)

    const playstation = rows.find((row) => row.description.startsWith('PLAYSTATION'))
    expect(playstation).toMatchObject({
      date: '2026-03-28',
      amount: 11.99,
      currency: 'USD',
      merchant: '431921',
    })

    const installment = rows.find((row) => row.description.startsWith('MERPAGO*COMPREFACIL'))
    expect(installment).toMatchObject({
      date: '2025-12-25',
      amount: 19183.16,
      currency: 'ARS',
    })
    expect(installment?.description).toContain('C.04/06')
  })
})

describe('parsePdfText', () => {
  it('builds a parse result with per-row currency for Santander Visa', () => {
    const result = parsePdfText(fixtureText)

    expect(result.skipMapping).toBe(true)
    expect(result.perRowCurrency).toBe(true)
    expect(result.pdfProfile).toBe('santander-visa')
    expect(result.rows).toHaveLength(44)
    expect(result.headers).toEqual(['Fecha', 'Referencia', 'Comprobante', 'Pesos', 'Dólares'])
  })
})
