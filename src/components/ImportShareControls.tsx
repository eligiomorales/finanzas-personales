import { useState } from 'react'
import { splitPreset as getSplitPreset, personalSharesFromPayer } from '@/lib/balance'
import {
  formLabelWithName,
  sharePercentLabel,
  type CouplePersonsView,
} from '@/lib/couple/person-labels'
import { payerFieldLabel, splitDistributionLabel } from '@/lib/movement-form-defaults'
import { cn } from '@/lib/utils'
import { FieldHint, Input, Label, FormGroup } from '@/components/ui/Form'
import type { Payer } from '@/types'

export const SPLIT_PRESETS: { value: string; label: string }[] = [
  { value: '50-50', label: '50 / 50' },
  { value: '60-40', label: '60 / 40' },
  { value: '100-0', label: '100 / 0' },
  { value: '0-100', label: '0 / 100' },
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
}

export function detectSplitPreset(sharePersonA: number, sharePersonB: number): string {
  if (sharePersonA === 50 && sharePersonB === 50) return '50-50'
  if (sharePersonA === 60 && sharePersonB === 40) return '60-40'
  if (sharePersonA === 100 && sharePersonB === 0) return '100-0'
  if (sharePersonA === 0 && sharePersonB === 100) return '0-100'
  return 'custom'
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
}: ImportShareControlsProps) {
  const [internalOpen, setInternalOpen] = useState(!collapsible)
  const open = openProp ?? internalOpen

  function setOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen)
    if (openProp === undefined) setInternalOpen(nextOpen)
  }

  const formLabel = (role: 'personA' | 'personB') => formLabelWithName(role, persons)
  const payerButtonClass = compact
    ? 'rounded-lg border px-2 py-1.5 text-xs font-medium'
    : 'rounded-lg border px-3 py-2 text-sm font-medium'

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

  function handleSharedChange(nextShared: boolean) {
    if (nextShared) {
      const split = getSplitPreset('50-50')
      onChange({
        paidBy,
        isShared: true,
        ...split,
        splitPreset: '50-50',
      })
      return
    }
    const shares = personalSharesFromPayer(paidBy)
    onChange({
      paidBy,
      isShared: false,
      ...shares,
      splitPreset: detectSplitPreset(shares.sharePersonA, shares.sharePersonB),
    })
  }

  function handleSplitPresetChange(value: string) {
    if (value === 'custom') {
      onChange({ paidBy, isShared, sharePersonA, sharePersonB, splitPreset: value })
      return
    }
    const split = getSplitPreset(value)
    onChange({ paidBy, isShared, ...split, splitPreset: value })
  }

  const controls = (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <FormGroup className="!mb-0">
        <span
          id={`${idPrefix}-paid-by-label`}
          className={cn(
            'mb-1 block font-medium text-slate-700',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {payerFieldLabel('expense')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="grid min-w-0 flex-1 grid-cols-3 gap-1.5"
            role="radiogroup"
            aria-labelledby={`${idPrefix}-paid-by-label`}
          >
            {(
              [
                { value: 'personA' as const, label: formLabel('personA') },
                { value: 'personB' as const, label: formLabel('personB') },
                { value: 'both' as const, label: 'Ambos' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paidBy === value}
                onClick={() => handlePaidByChange(value)}
                className={cn(
                  payerButtonClass,
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                  paidBy === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <Label htmlFor={`${idPrefix}-shared`} className="!mb-0 text-xs font-medium text-slate-600">
              Compartido
            </Label>
            <button
              id={`${idPrefix}-shared`}
              type="button"
              role="switch"
              aria-checked={isShared}
              aria-describedby={compact ? undefined : `${idPrefix}-shared-hint`}
              onClick={() => handleSharedChange(!isShared)}
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                isShared ? 'bg-brand-600' : 'bg-slate-300',
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
        </div>
      </FormGroup>

      {!compact && (
        <FieldHint id={`${idPrefix}-shared-hint`}>
          Si es compartido, el reparto define cuánto asume cada persona aunque haya pagado uno solo.
        </FieldHint>
      )}

      {isShared && (
        <>
          <FormGroup className="!mb-0">
            <span
              id={`${idPrefix}-split-label`}
              className={cn(
                'mb-1 block font-medium text-slate-700',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {splitDistributionLabel('expense')}
            </span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${idPrefix}-split-label`}>
              {SPLIT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  role="radio"
                  aria-checked={splitPreset === preset.value}
                  onClick={() => handleSplitPresetChange(preset.value)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                    splitPreset === preset.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </FormGroup>

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
                  className={compact ? 'py-1.5 text-sm' : undefined}
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
                  className={compact ? 'py-1.5 text-sm' : undefined}
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
        </>
      )}

      {previewText && (
        <p className="rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600">{previewText}</p>
      )}
    </div>
  )

  if (!collapsible) return controls

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${idPrefix}-reparto-panel`}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
      >
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-slate-800">Reparto</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">{summaryText}</span>
        </div>
        <span className="shrink-0 text-slate-400" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div id={`${idPrefix}-reparto-panel`} className="mt-1.5 rounded-lg border border-slate-200 p-2.5">
          {controls}
        </div>
      )}
    </div>
  )
}
