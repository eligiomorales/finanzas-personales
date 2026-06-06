import { describe, expect, it } from 'vitest'
import { scaleImageForOcr } from '@/lib/ocr/extract-text'

describe('scaleImageForOcr', () => {
  it('upscales small phone screenshots', () => {
    expect(scaleImageForOcr(390, 844)).toEqual({ width: 1100, height: 2381 })
  })

  it('downscales very tall scroll captures', () => {
    expect(scaleImageForOcr(1170, 12000)).toEqual({ width: 488, height: 5000 })
  })

  it('keeps medium images unchanged', () => {
    expect(scaleImageForOcr(1200, 2400)).toEqual({ width: 1200, height: 2400 })
  })
})
