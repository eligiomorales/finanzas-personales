import { splitPreset as getSplitPreset, personalSharesFromPayer } from '@/lib/balance'
import {
  sharePercentLabel,
  importPayerChipLabel,
  type CouplePersonsView,
} from '@/lib/couple/person-labels'
import { payerFieldLabel, splitDistributionLabel } from '@/lib/movement-form-defaults'
import { cn } from '@/lib/utils'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel'
import { FieldHint, Input, Label, FormGroup } from '@/components/ui/Form'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { CurrencyCode, Payer } from '@/types'

export const SPLIT_PRESETS: { value: string; label: string }[] = [
  { value: '50-50', label: '50 / 50' },
  { value: '60-40', label: '60 / 40' },
  { value: '100-0', label: '100 / 0' },
  { value: '0-100', label: '0 / 100' },
  { value: 'custom', label: 'Personalizado' },
]

export const IMPORT_SPLIT_PRESETS: { value: string; label: string }[] = [
  { value: '50-50', label: '50 / 50' },
  { value: 'custom', label: 'Personalizado' },
]

export interface ImportShareValues {
  paidBy: Payer
  isShared: boolean
  sharePersonA: number
  sharePersonB: number
  splitPreset: string
}

interface ImportShareControlsProps extends ImportShareValues {
  persons: CouplePersonsView
  onChange: (values: ImportShareValues) => void
  idPrefix?: string
  collapsible?: boolean
  compact?: boolean
  summaryText?: string
  previewText?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  splitPresets?: { value: string; label: string }[]
  includeBothPayer?: boolean
  currency?: CurrencyCode
  onCurrencyChange?: (currency: CurrencyCode) => void
}

export function detectSplitPreset(sharePersonA: number, sharePersonB: number): string {
  if (sharePersonA === 50 && sharePersonB === 50) return '50-50'
  if (sharePersonA === 60 && sharePersonB === 40) return '60-40'
  if (sharePersonA === 100 && sharePersonB === 0) return '100-0'
  if (sharePersonA === 0 && sharePersonB === 100) return '0-100'
  return 'custom'
}

/** Maps stored shares to a preset chip; falls back to custom when not in allowed list. */
export function formSplitPreset(
  sharePersonA: number,
  sharePersonB: number,
  allowedValues: readonly string[],
): string {
  const detected = detectSplitPreset(sharePersonA, sharePersonB)
  return allowedValues.includes(detected) ? detected : 'custom'
}

export function applyImportSharedToggle(
  values: ImportShareValues,
  nextShared: boolean,
): ImportShareValues {
  if (nextShared) {
    const split = getSplitPreset('50-50')
    return { paidBy: values.paidBy, isShared: true, ...split, splitPreset: '50-50' }
  }
  const shares = personalSharesFromPayer(values.paidBy)
  return {
    paidBy: values.paidBy,
    isShared: false,
    ...shares,
    splitPreset: detectSplitPreset(shares.sharePersonA, shares.sharePersonB),
  }
}

export function ImportSharedToggle({
  idPrefix,
  values,
  onChange,
  className,
}: {
  idPrefix: string
  values: ImportShareValues
  onChange: (values: ImportShareValues) => void
  className?: string
}) {
  const { isShared } = values
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-surface-50 px-2 py-1',
        className,
      )}
    >
      <Label htmlFor={`${idPrefix}-shared`} className="!mb-0 text-xs font-medium text-stone-600">
        Compartido
      </Label>
      <button
        id={`${idPrefix}-shared`}
        type="button"
        role="switch"
        aria-checked={isShared}
        onClick={() => onChange(applyImportSharedToggle(values, !isShared))}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
          isShared ? 'bg-brand-600' : 'bg-stone-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            isShared ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function ImportShareControls({
  paidBy,
  isShared,
  sharePersonA,
  sharePersonB,
  splitPreset,
  persons,
  onChange,
  idPrefix = 'import-share',
  collapsible = false,
  compact = false,
  summaryText = '',
  previewText = null,
  open: openProp,
  onOpenChange,
  splitPresets = SPLIT_PRESETS,
  includeBothPayer = true,
  currency,
  onCurrencyChange,
}: ImportShareControlsProps) {
  const formLabel = (role: 'personA' | 'personB') => importPayerChipLabel(role, persons)
  const chipSize = compact ? 'sm' : 'md'
  const payerOptions = (
    [
      { value: 'personA' as const, label: formLabel('personA') },
      { value: 'personB' as const, label: formLabel('personB') },
      ...(includeBothPayer ? [{ value: 'both' as const, label: 'Ambos' }] : []),
    ] as const
  )

  function handlePaidByChange(nextPaidBy: Payer) {
    const next: ImportShareValues = { paidBy: nextPaidBy, isShared, sharePersonA, sharePersonB, splitPreset }
    if (!isShared) {
      const shares = personalSharesFromPayer(nextPaidBy)
      onChange({
        ...next,
        ...shares,
        splitPreset: detectSplitPreset(shares.sharePersonA, shares.sharePersonB),
      })
      return
    }
    onChange(next)
  }

  function handleSplitPresetChange(value: string) {
    if (value === 'custom') {
      onChange({ paidBy, isShared, sharePersonA, sharePersonB, splitPreset: value })
      return
    }
    const split = getSplitPreset(value)
    onChange({ paidBy, isShared, ...split, splitPreset: value })
  }

  const showCurrency = Boolean(currency && onCurrencyChange)

  const currencyControl = showCurrency ? (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-stone-700">Moneda</span>
      <SegmentedControl
        aria-label="Moneda del movimiento"
        indicatorLayoutId={`${idPrefix}-currency-indicator`}
        size="sm"
        fullWidth={false}
        options={[
          { value: 'ARS' as const, label: 'ARS' },
          { value: 'USD' as const, label: 'USD' },
        ]}
        value={currency!}
        onChange={onCurrencyChange!}
      />
    </div>
  ) : null

  const controls = (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-3')}>
      <FormGroup className="!mb-0">
        <span
          id={`${idPrefix}-paid-by-label`}
          className={cn(
            'mb-1.5 block font-medium text-stone-700',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {payerFieldLabel('expense')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'grid min-w-0 flex-1 gap-1.5',
              payerOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
            )}
            role="radiogroup"
            aria-labelledby={`${idPrefix}-paid-by-label`}
          >
            {payerOptions.map(({ value, label }) => (
              <ChoiceChip
                key={value}
                role="radio"
                size={chipSize}
                selected={paidBy === value}
                className="w-full"
                onClick={() => handlePaidByChange(value)}
              >
                {label}
              </ChoiceChip>
            ))}
          </div>

          <ImportSharedToggle
            idPrefix={idPrefix}
            values={{ paidBy, isShared, sharePersonA, sharePersonB, splitPreset }}
            onChange={onChange}
          />
        </div>
      </FormGroup>

      {!compact && (
        <FieldHint id={`${idPrefix}-shared-hint`}>
          Si es compartido, el reparto define cuánto asume cada persona aunque haya pagado uno solo.
        </FieldHint>
      )}

      {(showCurrency || isShared) && (
        <div className="border-t border-stone-100 pt-4">
          {isShared ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                {showCurrency && currencyControl}

                <FormGroup className="!mb-0 min-w-0 flex-1">
                  <span
                    id={`${idPrefix}-split-label`}
                    className={cn(
                      'mb-1.5 block font-medium text-stone-700',
                      compact ? 'text-xs' : 'text-sm',
                    )}
                  >
                    {splitDistributionLabel('expense')}
                  </span>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${idPrefix}-split-label`}>
                    {splitPresets.map((preset) => (
                      <ChoiceChip
                        key={preset.value}
                        role="radio"
                        size="sm"
                        shape="pill"
                        selected={splitPreset === preset.value}
                        onClick={() => handleSplitPresetChange(preset.value)}
                      >
                        {preset.label}
                      </ChoiceChip>
                    ))}
                  </div>
                </FormGroup>
              </div>

              {splitPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <FormGroup className="!mb-0">
                    <Label htmlFor={`${idPrefix}-share-a`} className={compact ? 'text-xs' : undefined}>
                      {sharePercentLabel('personA', persons)}
                    </Label>
                    <Input
                      id={`${idPrefix}-share-a`}
                      type="number"
                      min="0"
                      max="100"
                      value={sharePersonA}
                      className={compact ? 'py-1.5' : undefined}
                      onChange={(e) => {
                        const a = parseFloat(e.target.value) || 0
                        onChange({
                          paidBy,
                          isShared,
                          sharePersonA: a,
                          sharePersonB: 100 - a,
                          splitPreset: 'custom',
                        })
                      }}
                    />
                  </FormGroup>
                  <FormGroup className="!mb-0">
                    <Label htmlFor={`${idPrefix}-share-b`} className={compact ? 'text-xs' : undefined}>
                      {sharePercentLabel('personB', persons)}
                    </Label>
                    <Input
                      id={`${idPrefix}-share-b`}
                      type="number"
                      min="0"
                      max="100"
                      value={sharePersonB}
                      className={compact ? 'py-1.5' : undefined}
                      onChange={(e) => {
                        const b = parseFloat(e.target.value) || 0
                        onChange({
                          paidBy,
                          isShared,
                          sharePersonB: b,
                          sharePersonA: 100 - b,
                          splitPreset: 'custom',
                        })
                      }}
                    />
                  </FormGroup>
                </div>
              )}
            </div>
          ) : (
            showCurrency && currencyControl
          )}
        </div>
      )}

      {previewText && (
        <p className="rounded-md bg-surface-50 px-2 py-1.5 text-xs text-stone-600">{previewText}</p>
      )}
    </div>
  )

  if (!collapsible) return controls

  return (
    <CollapsiblePanel
      title="Reparto"
      summary={summaryText}
      open={openProp}
      onOpenChange={onOpenChange}
      panelId={`${idPrefix}-reparto-panel`}
      compact
    >
      {controls}
    </CollapsiblePanel>
  )
}
