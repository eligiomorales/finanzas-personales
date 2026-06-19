import { describe, expect, it } from 'vitest'
import { formatMovementGroupDate, groupMovementsByDate } from '@/lib/movements-grouping'

describe('formatMovementGroupDate', () => {
  it('formats ISO date in Spanish short form', () => {
    expect(formatMovementGroupDate('2026-06-19')).toMatch(/19/)
  })
})

describe('groupMovementsByDate', () => {
  it('groups consecutive items by date preserving order', () => {
    const items = [
      { id: '1', date: '2026-06-19' },
      { id: '2', date: '2026-06-19' },
      { id: '3', date: '2026-06-12' },
    ]

    const groups = groupMovementsByDate(items)

    expect(groups).toHaveLength(2)
    expect(groups[0].dateKey).toBe('2026-06-19')
    expect(groups[0].movements.map((m) => m.id)).toEqual(['1', '2'])
    expect(groups[1].dateKey).toBe('2026-06-12')
    expect(groups[1].movements.map((m) => m.id)).toEqual(['3'])
  })
})
