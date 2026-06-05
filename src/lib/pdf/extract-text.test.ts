import { describe, expect, it } from 'vitest'
import { extractLinesFromTextContent } from '@/lib/pdf/extract-text'
import { detectGaliciaMastercardPdf, parseGaliciaMastercardText } from '@/lib/pdf/galicia-mastercard'

/** Simulates pdf.js output before line reconstruction (one fragment per line). */
const FRAGMENTED_PAGE = {
  items: [
    { str: 'DETALLE', transform: [1, 0, 0, 1, 10, 700] },
    { str: 'DEL', transform: [1, 0, 0, 1, 60, 700] },
    { str: 'CONSUMO', transform: [1, 0, 0, 1, 90, 700] },
    { str: 'FECHA', transform: [1, 0, 0, 1, 10, 680] },
    { str: 'REFERENCIA', transform: [1, 0, 0, 1, 55, 680] },
    { str: 'COMPROBANTE', transform: [1, 0, 0, 1, 140, 680] },
    { str: 'PESOS', transform: [1, 0, 0, 1, 230, 680] },
    { str: 'DÓLARES', transform: [1, 0, 0, 1, 280, 680] },
    { str: 'Tarjeta', transform: [1, 0, 0, 1, 10, 720] },
    { str: 'Crédito', transform: [1, 0, 0, 1, 60, 720] },
    { str: 'MASTERCARD', transform: [1, 0, 0, 1, 110, 720] },
    { str: '01-Oct-25', transform: [1, 0, 0, 1, 10, 660] },
    { str: 'FARMACITY', transform: [1, 0, 0, 1, 70, 660] },
    { str: '06569', transform: [1, 0, 0, 1, 160, 660] },
    { str: '29.539,50', transform: [1, 0, 0, 1, 220, 660] },
  ],
}

describe('extractLinesFromTextContent', () => {
  it('merges fragments on the same visual line', () => {
    const lines = extractLinesFromTextContent(FRAGMENTED_PAGE as never)
    expect(lines).toContain('DETALLE DEL CONSUMO')
    expect(lines).toContain('FECHA REFERENCIA COMPROBANTE PESOS DÓLARES')
    expect(lines).toContain('01-Oct-25 FARMACITY 06569 29.539,50')
  })

  it('enables Galicia detection and parsing from fragmented pdf.js text', () => {
    const text = extractLinesFromTextContent(FRAGMENTED_PAGE as never).join('\n')
    expect(detectGaliciaMastercardPdf(text)).toBe(true)

    const sample = [
      'Tarjeta Crédito MASTERCARD GOLD',
      'DETALLE DEL CONSUMO',
      'FECHA REFERENCIA COMPROBANTE PESOS DÓLARES',
      '01-Oct-25 FARMACITY 06569 29.539,50',
    ].join('\n')

    const rows = parseGaliciaMastercardText(sample)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      description: 'FARMACITY\nComprobante: 06569',
      currency: 'ARS',
    })
  })
})
