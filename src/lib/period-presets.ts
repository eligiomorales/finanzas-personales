import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PeriodRange } from '@/components/PeriodFilter'
import { currentMonthRange, formatMonthLabel, previousMonthRange } from '@/lib/utils'

export function formatPeriodRangeLabel(from?: string, to?: string): string {
  if (!from && !to) return 'Fechas'
  if (from && to) {
    const fromLabel = format(parseISO(from), 'd MMM', { locale: es })
    const toLabel = format(parseISO(to), 'd MMM yyyy', { locale: es })
    return `${fromLabel} – ${toLabel}`
  }
  if (from) return `Desde ${format(parseISO(from), 'd MMM yyyy', { locale: es })}`
  return `Hasta ${format(parseISO(to!), 'd MMM yyyy', { locale: es })}`
}

export type PeriodPresetId = 'current_month' | 'previous_month'

export interface PeriodPreset {
  id: PeriodPresetId
  label: string
  range: () => PeriodRange
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  { id: 'current_month', label: 'Este mes', range: currentMonthRange },
  { id: 'previous_month', label: 'Mes anterior', range: previousMonthRange },
]

export function formatPeriodHeaderTitle(period: PeriodRange): string {
  const presetId = activePeriodPresetId(period)
  if (presetId === 'current_month' || presetId === 'previous_month') {
    return formatMonthLabel(period.from)
  }
  return formatPeriodRangeLabel(period.from, period.to)
}

export function activePeriodPresetId(period: PeriodRange): PeriodPresetId | null {
  for (const preset of PERIOD_PRESETS) {
    const range = preset.range()
    if (range.from === period.from && range.to === period.to) return preset.id
  }
  return null
}
