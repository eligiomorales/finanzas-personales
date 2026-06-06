import { describe, expect, it } from 'vitest'
import { parseImageText } from '@/lib/ocr/parse-image'

const SAMPLE = `
Transactions
March 21, 2026
Carrefour
03/21/2026
-US$ 29.64
`

describe('parseImageText', () => {
  it('returns skipMapping rows for Wallbit captures', () => {
    const result = parseImageText(SAMPLE)
    expect(result.skipMapping).toBe(true)
    expect(result.imageProfile).toBe('wallbit-debit')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      date: '2026-03-21',
      amount: 29.64,
      currency: 'USD',
    })
  })

  it('rejects unrecognized image text', () => {
    expect(() => parseImageText('not a bank screenshot')).toThrow(/no reconocido/i)
  })
})
