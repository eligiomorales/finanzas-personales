import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export interface MovementDateGroup<T extends { date: string }> {
  dateKey: string
  label: string
  movements: T[]
}

export function formatMovementGroupDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: es })
}

/** ponytail: O(n) single pass; assumes items already sorted for display */
export function groupMovementsByDate<T extends { date: string }>(items: T[]): MovementDateGroup<T>[] {
  const groups: MovementDateGroup<T>[] = []
  const indexByDate = new Map<string, number>()

  for (const item of items) {
    const dateKey = item.date
    const existing = indexByDate.get(dateKey)
    if (existing !== undefined) {
      groups[existing].movements.push(item)
    } else {
      indexByDate.set(dateKey, groups.length)
      groups.push({
        dateKey,
        label: formatMovementGroupDate(dateKey),
        movements: [item],
      })
    }
  }

  return groups
}
