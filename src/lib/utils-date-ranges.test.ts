import { parseISO } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { dateSpanFromIsoDates, rollingDaysRange } from '@/lib/utils'

describe('date range helpers', () => {
  it('rollingDaysRange spans inclusive calendar days', () => {
    expect(rollingDaysRange(90, parseISO('2026-06-15'))).toEqual({
      from: '2026-03-18',
      to: '2026-06-15',
    })
  })

  it('dateSpanFromIsoDates returns min/max bounds', () => {
    expect(dateSpanFromIsoDates(['2026-06-10', '2026-06-01', '2026-06-20'])).toEqual({
      from: '2026-06-01',
      to: '2026-06-20',
    })
    expect(dateSpanFromIsoDates([])).toBeUndefined()
  })
})
