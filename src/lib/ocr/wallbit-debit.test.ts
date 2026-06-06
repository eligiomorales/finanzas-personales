import { describe, expect, it } from 'vitest'
import {
  detectWallbitDebitText,
  isIgnoredWallbitDescription,
  parseWallbitDebitText,
} from '@/lib/ocr/wallbit-debit'

const SAMPLE = `
Transactions

March 21, 2026

Carrefour
03/21/2026
-US$ 29.64

asiatica
03/21/2026
-US$ 9.21

Carlos Luis Torres Uranga
03/21/2026
-US$ 207.16

Eligio Morales
03/21/2026
-US$ 88.00

March 20, 2026

Macowens Villa Urquiza
03/20/2026
-US$ 45.00
`

describe('parseWallbitDebitText', () => {
  it('parses grouped transactions and omits internal transfers', () => {
    const outcome = parseWallbitDebitText(SAMPLE)
    expect(outcome.forceNeedsReview).toBe(false)
    expect(outcome.rows).toHaveLength(3)

    const carrefour = outcome.rows.find((row) => row.description.includes('Carrefour'))
    expect(carrefour).toMatchObject({
      date: '2026-03-21',
      amount: 29.64,
      currency: 'USD',
    })

    const asiatica = outcome.rows.find((row) => row.description.includes('asiatica'))
    expect(asiatica?.amount).toBe(9.21)

    expect(outcome.rows.some((row) => /torres|uranga/i.test(row.description))).toBe(false)
    expect(outcome.rows.some((row) => /eligio/i.test(row.description))).toBe(false)

    const macowens = outcome.rows.find((row) => row.description.includes('Macowens'))
    expect(macowens).toMatchObject({
      date: '2026-03-20',
      amount: 45,
      currency: 'USD',
    })
  })

  it('parses amount on the same line as merchant', () => {
    const outcome = parseWallbitDebitText(`
March 1, 2026
DLC* SHEIN 03/01/2026 -US$ 12.50
`)
    expect(outcome.rows).toHaveLength(1)
    expect(outcome.rows[0]?.description).toContain('SHEIN')
    expect(outcome.rows[0]?.date).toBe('2026-03-01')
    expect(outcome.rows[0]?.amount).toBe(12.5)
  })

  it('uses row date when section header is missing', () => {
    const outcome = parseWallbitDebitText(`
Orphan merchant
03/15/2026
-US$ 5.00
`)
    expect(outcome.rows).toHaveLength(1)
    expect(outcome.rows[0]?.date).toBe('2026-03-15')
  })

  it('parses thousands separator in amount', () => {
    const outcome = parseWallbitDebitText(`
January 10, 2026
Big buy
01/10/2026
-US$ 1,234.56
`)
    expect(outcome.rows).toHaveLength(1)
    expect(outcome.rows[0]?.amount).toBe(1234.56)
  })

  it('marks empty text as needs review', () => {
    const outcome = parseWallbitDebitText('')
    expect(outcome.forceNeedsReview).toBe(true)
    expect(outcome.rows).toEqual([])
  })

  it('tolerates leading OCR junk in date headers', () => {
    const outcome = parseWallbitDebitText(`
> March 5, 2026
Store X
03/05/2026
-US$ 1.00
`)
    expect(outcome.rows).toHaveLength(1)
    expect(outcome.rows[0]?.date).toBe('2026-03-05')
  })
})

describe('isIgnoredWallbitDescription', () => {
  it('matches Carlos and Eligio case-insensitively without accents', () => {
    expect(isIgnoredWallbitDescription('CARLOS LUIS TORRES URANGA')).toBe(true)
    expect(isIgnoredWallbitDescription('Carlos  Luis  Torres  Uranga')).toBe(true)
    expect(isIgnoredWallbitDescription('Eligio Morales')).toBe(true)
    expect(isIgnoredWallbitDescription('Transfer — Eligio Morales')).toBe(true)
    expect(isIgnoredWallbitDescription('Carrefour')).toBe(false)
  })
})

describe('detectWallbitDebitText', () => {
  it('detects Wallbit transaction screenshots', () => {
    expect(detectWallbitDebitText(SAMPLE)).toBe(true)
    expect(detectWallbitDebitText('random grocery list without amounts')).toBe(false)
  })
})
