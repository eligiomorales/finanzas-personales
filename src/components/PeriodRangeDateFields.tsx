import { Input, Label, FormGroup } from '@/components/ui/Form'
import type { PeriodRange } from '@/components/PeriodFilter'

interface PeriodRangeDateFieldsProps {
  period: PeriodRange
  onChange: (period: PeriodRange) => void
  idPrefix?: string
}

export function PeriodRangeDateFields({
  period,
  onChange,
  idPrefix = 'period',
}: PeriodRangeDateFieldsProps) {
  return (
    <li className="px-3 py-1.5">
      <div className="space-y-2">
        <FormGroup className="!mb-0">
          <Label htmlFor={`${idPrefix}-from`} className="text-xs">
            Desde
          </Label>
          <Input
            id={`${idPrefix}-from`}
            type="date"
            className="py-1.5 text-xs"
            value={period.from}
            onChange={(e) => onChange({ ...period, from: e.target.value })}
          />
        </FormGroup>
        <FormGroup className="!mb-0">
          <Label htmlFor={`${idPrefix}-to`} className="text-xs">
            Hasta
          </Label>
          <Input
            id={`${idPrefix}-to`}
            type="date"
            className="py-1.5 text-xs"
            value={period.to}
            onChange={(e) => onChange({ ...period, to: e.target.value })}
          />
        </FormGroup>
      </div>
    </li>
  )
}
