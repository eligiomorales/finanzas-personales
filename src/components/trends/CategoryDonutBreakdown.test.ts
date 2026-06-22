import { describe, expect, it } from 'vitest'
import { buildArcSlices, DONUT_CIRC, donutSlicePath } from './CategoryDonutBreakdown'

describe('buildArcSlices', () => {
  it('leaves gaps between segments when there are multiple categories', () => {
    const slices = buildArcSlices(
      [
        { categoryId: 'a', categoryName: 'A', total: 50 },
        { categoryId: 'b', categoryName: 'B', total: 50 },
      ],
      100,
    )
    const used = slices.reduce((sum, s) => sum + s.length, 0)
    expect(used).toBeLessThan(DONUT_CIRC)
    expect(slices[1].offset).toBeGreaterThan(slices[0].length)
  })

  it('uses full circumference for a single category', () => {
    const slices = buildArcSlices(
      [{ categoryId: 'a', categoryName: 'A', total: 100 }],
      100,
    )
    expect(slices[0].length).toBeCloseTo(DONUT_CIRC, 5)
  })
})

describe('donutSlicePath', () => {
  it('uses straight radial cuts when tip round is zero', () => {
    const d = donutSlicePath(100, 100, 60, 80, 0, Math.PI / 2, 0)
    expect(d).toContain(' L ')
    expect(d).not.toContain('Q ')
  })

  it('adds corner curves when tip round is positive', () => {
    const d = donutSlicePath(100, 100, 60, 80, 0, Math.PI / 2, 6)
    expect(d).toContain('Q ')
  })
})
