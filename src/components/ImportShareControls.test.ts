import { describe, expect, it } from 'vitest'
import { detectSplitPreset, formSplitPreset } from '@/components/ImportShareControls'

const FORM_PRESETS = ['50-50', '60-40', 'custom'] as const

describe('detectSplitPreset', () => {
  it('recognizes standard ratios', () => {
    expect(detectSplitPreset(50, 50)).toBe('50-50')
    expect(detectSplitPreset(60, 40)).toBe('60-40')
    expect(detectSplitPreset(100, 0)).toBe('100-0')
    expect(detectSplitPreset(0, 100)).toBe('0-100')
    expect(detectSplitPreset(70, 30)).toBe('custom')
  })
})

describe('formSplitPreset', () => {
  it('maps 0/100 to custom when form only offers 50-50, 60-40, custom', () => {
    expect(formSplitPreset(0, 100, FORM_PRESETS)).toBe('custom')
    expect(formSplitPreset(100, 0, FORM_PRESETS)).toBe('custom')
  })

  it('keeps presets available in the form', () => {
    expect(formSplitPreset(50, 50, FORM_PRESETS)).toBe('50-50')
    expect(formSplitPreset(60, 40, FORM_PRESETS)).toBe('60-40')
  })
})
