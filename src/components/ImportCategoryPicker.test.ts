import { describe, expect, it } from 'vitest'
import { computeCollapsedCategoryCount } from '@/components/ImportCategoryPicker'

describe('computeCollapsedCategoryCount', () => {
  it('shows all categories when they fit without toggle', () => {
    expect(
      computeCollapsedCategoryCount(300, [80, 90, 70], 60, 3),
    ).toEqual({ visibleCount: 3, showToggle: false })
  })

  it('reserves space for Ver todas and limits visible chips', () => {
    expect(
      computeCollapsedCategoryCount(220, [80, 90, 70, 85], 60, 10),
    ).toEqual({ visibleCount: 1, showToggle: true })
  })

  it('fits as many frequent chips as possible before toggle', () => {
    expect(
      computeCollapsedCategoryCount(280, [70, 70, 70, 70], 60, 12),
    ).toEqual({ visibleCount: 2, showToggle: true })
  })
})
