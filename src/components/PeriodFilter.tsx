import { useState } from 'react'
import { PeriodPresets } from '@/components/PeriodPresets'
import { FilterFacet } from '@/components/FacetDropdown'
import { PeriodRangeDateFields } from '@/components/PeriodRangeDateFields'
import { activePeriodPresetId, formatPeriodRangeLabel } from '@/lib/period-presets'

export interface PeriodRange {
  from: string
  to: string
}

interface PeriodFilterProps {
  period: PeriodRange
  onChange: (period: PeriodRange) => void
  idPrefix?: string
  /** `full`: presets + fechas en fila. `presets`: solo chips. `dates`: solo selector de fechas. */
  variant?: 'full' | 'presets' | 'dates'
  /** Si true, el botón Fechas no muestra el rango custom como etiqueta (útil cuando el rango ya está en subtítulo). */
  datesLabelOnly?: boolean
}

function PeriodDatesFacet({
  period,
  onChange,
  idPrefix,
  datesLabelOnly,
}: {
  period: PeriodRange
  onChange: (period: PeriodRange) => void
  idPrefix: string
  datesLabelOnly?: boolean
}) {
  const [datesOpen, setDatesOpen] = useState(false)
  const customPeriod = activePeriodPresetId(period) === null

  return (
    <FilterFacet
      label="Fechas"
      activeLabel={
        datesLabelOnly || !customPeriod
          ? undefined
          : formatPeriodRangeLabel(period.from, period.to)
      }
      active={customPeriod}
      open={datesOpen}
      menuMinWidth={248}
      onOpen={() => setDatesOpen(true)}
      onClose={() => setDatesOpen(false)}
    >
      <PeriodRangeDateFields period={period} onChange={onChange} idPrefix={idPrefix} />
    </FilterFacet>
  )
}

export function PeriodFilter({
  period,
  onChange,
  idPrefix = 'period',
  variant = 'full',
  datesLabelOnly,
}: PeriodFilterProps) {
  if (variant === 'presets') {
    return (
      <div role="group" aria-label="Períodos rápidos">
        <PeriodPresets period={period} compact className="flex-nowrap" onChange={onChange} />
      </div>
    )
  }

  if (variant === 'dates') {
    return (
      <PeriodDatesFacet
        period={period}
        onChange={onChange}
        idPrefix={idPrefix}
        datesLabelOnly={datesLabelOnly}
      />
    )
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Período">
      <div className="min-w-0 flex-1 overflow-x-auto pb-0.5">
        <PeriodPresets period={period} compact className="flex-nowrap" onChange={onChange} />
      </div>
      <PeriodDatesFacet
        period={period}
        onChange={onChange}
        idPrefix={idPrefix}
        datesLabelOnly={datesLabelOnly}
      />
    </div>
  )
}
