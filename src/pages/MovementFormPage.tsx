import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useCategories, useMovements, useSettings, useMovementMutations } from '@/hooks/useData'
import { splitPreset as getSplitPreset, personalSharesFromPayer } from '@/lib/balance'
import {
  formLabelWithName,
  sharePercentLabel,
} from '@/lib/couple/person-labels'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import {
  buildNewMovementDefaults,
  getDefaultCategoryId,
  getFrequentCategoryIds,
  payerFieldLabel,
  repartoSummary,
  splitDistributionLabel,
} from '@/lib/movement-form-defaults'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { formatCurrency, todayISO } from '@/lib/utils'
import {
  Button,
  Input,
  Select,
  Label,
  FormGroup,
  FieldError,
  LiveRegion,
  describedBy,
} from '@/components/ui/Form'
import { CurrencyAmountInput } from '@/components/CurrencyAmountInput'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SPLIT_PRESETS } from '@/components/ImportShareControls'
import { cn } from '@/lib/utils'
import type { CurrencyCode, MovementFormData, MovementType, Payer } from '@/types'

const movementTypeLabels: Record<MovementType, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  settlement: 'Liquidación',
}

export function MovementFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { membership } = useAuth()
  const persons = useCouplePersons()
  const categories = useCategories() ?? []
  const movements = useMovements() ?? []
  const settings = useSettings()
  const { createMovement, updateMovement, getMovement } = useMovementMutations()
  const [form, setForm] = useState<MovementFormData>(() =>
    buildNewMovementDefaults({ movements, displayCurrency: settings?.displayCurrency }),
  )
  const [splitPreset, setSplitPreset] = useState('50-50')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formSummary, setFormSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [repartoOpen, setRepartoOpen] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const initializedNewForm = useRef(false)
  const isEditing = Boolean(id)

  const personAName = persons.personAName
  const personBName = persons.personBName
  const formLabel = (role: 'personA' | 'personB') => formLabelWithName(role, persons)
  const selectedTypeLabel = movementTypeLabels[form.type]

  useEffect(() => {
    if (!id) return
    setRepartoOpen(true)
    getMovement(id).then((m) => {
      if (!m) return
      const paidBy = m.paidBy === 'both' ? 'personA' : m.paidBy
      const incomeShares = personalSharesFromPayer(paidBy)
      setForm({
        type: m.type,
        amount: m.amount,
        currency: m.currency ?? 'ARS',
        date: m.date,
        description: m.description,
        categoryId: m.categoryId,
        paidBy,
        sharePersonA: m.type === 'income' ? incomeShares.sharePersonA : m.sharePersonA,
        sharePersonB: m.type === 'income' ? incomeShares.sharePersonB : m.sharePersonB,
        isShared: m.type === 'income' ? false : m.isShared,
      })
    })
  }, [id, getMovement])

  useEffect(() => {
    if (id || initializedNewForm.current || !settings) return
    initializedNewForm.current = true
    setForm(
      buildNewMovementDefaults({
        movements,
        displayCurrency: settings.displayCurrency,
        payerRole: membership?.role,
      }),
    )
  }, [id, settings, membership, movements])

  useEffect(() => {
    if (id) return
    setForm((f) => {
      if (f.categoryId) return f
      const categoryId = getDefaultCategoryId(movements, f.type)
      return categoryId ? { ...f, categoryId } : f
    })
  }, [id, movements])

  const filteredCategories = categories.filter((c) =>
    form.type === 'settlement' ? true : c.type === (form.type === 'income' ? 'income' : 'expense'),
  )

  const frequentCategoryIds = useMemo(
    () => getFrequentCategoryIds(movements, form.type, 3),
    [movements, form.type],
  )

  const primaryCategories = useMemo(
    () =>
      buildImportCategoryButtons(
        filteredCategories,
        frequentCategoryIds,
        form.categoryId,
        null,
        3,
      ),
    [filteredCategories, frequentCategoryIds, form.categoryId],
  )

  const categoryOptions = useMemo(() => {
    if (!showAllCategories) return primaryCategories
    const seen = new Set(primaryCategories.map((c) => c.id))
    const extra = filteredCategories.filter((c) => !seen.has(c.id))
    return [...primaryCategories, ...extra]
  }, [filteredCategories, primaryCategories, showAllCategories])

  const topCategoryName = useMemo(() => {
    const topId = getDefaultCategoryId(movements, form.type)
    return filteredCategories.find((c) => c.id === topId)?.name
  }, [movements, form.type, filteredCategories])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.description.trim()) errs.description = 'Requerido'
    if (form.amount <= 0) errs.amount = 'Debe ser mayor a 0'
    if (!form.date) errs.date = 'Requerido'
    if (form.type !== 'settlement' && !form.categoryId) errs.categoryId = 'Selecciona una categoría'
    if (form.isShared && Math.abs(form.sharePersonA + form.sharePersonB - 100) > 0.01) {
      errs.share = 'Los porcentajes deben sumar 100'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setFormSummary('Revisá los campos marcados antes de guardar.')
    }
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setFormSummary('')
    try {
      if (isEditing && id) {
        await updateMovement(id, form)
      } else {
        await createMovement(form)
      }
      navigate('/movimientos')
    } finally {
      setSaving(false)
    }
  }

  function handleSplitPreset(value: string) {
    setSplitPreset(value)
    if (value !== 'custom') {
      const split = getSplitPreset(value)
      setForm((f) => ({ ...f, ...split }))
    }
  }

  function handlePaidByChange(paidBy: Payer) {
    setForm((f) => {
      const next = { ...f, paidBy }
      if (f.type === 'income' || (!f.isShared && f.type !== 'settlement')) {
        return { ...next, isShared: false, ...personalSharesFromPayer(paidBy) }
      }
      return next
    })
  }

  function handleSharedChange(isShared: boolean) {
    setForm((f) => {
      if (isShared) {
        const split = getSplitPreset('50-50')
        return { ...f, isShared: true, ...split }
      }
      return { ...f, isShared: false, ...personalSharesFromPayer(f.paidBy) }
    })
    setSplitPreset(isShared ? '50-50' : '100-0')
  }

  function handleTypeChange(type: MovementType) {
    setShowAllCategories(false)
    setForm((f) => {
      const paidBy = f.paidBy === 'both' ? 'personA' : f.paidBy
      const categoryId =
        getDefaultCategoryId(movements, type) ??
        categories.find((c) => c.type === (type === 'income' ? 'income' : 'expense'))?.id ??
        null

      if (type === 'income') {
        return {
          ...f,
          type,
          categoryId,
          paidBy,
          isShared: false,
          ...personalSharesFromPayer(paidBy),
        }
      }

      return {
        ...f,
        type,
        categoryId,
        paidBy,
        isShared: type === 'settlement' ? true : f.isShared,
      }
    })
    if (type === 'income') {
      setSplitPreset('100-0')
    }
  }

  function handleCurrencyChange(currency: CurrencyCode) {
    setForm((f) => ({ ...f, currency }))
  }

  function repartoPreviewText(): string | null {
    if (form.amount <= 0) return null
    const amountLabel = formatCurrency(form.amount, form.currency, { visible: true })
    const payer = form.paidBy === 'both' ? 'Ambos' : formLabel(form.paidBy)

    if (form.type === 'income') {
      return `${payer} recibió ${amountLabel}`
    }

    if (form.type === 'settlement') {
      return `${payer} registra ${amountLabel}`
    }

    if (!form.isShared) {
      return `${payer} pagó ${amountLabel} · asume ${amountLabel}`
    }

    const assumeA = (form.amount * form.sharePersonA) / 100
    const assumeB = (form.amount * form.sharePersonB) / 100

    if (Math.abs(form.sharePersonA - form.sharePersonB) < 0.01) {
      return `${payer} pagó ${amountLabel} · cada uno asume ${formatCurrency(assumeA, form.currency, { visible: true })}`
    }

    return `${payer} pagó ${amountLabel} · ${personAName} ${formatCurrency(assumeA, form.currency, { visible: true })} · ${personBName} ${formatCurrency(assumeB, form.currency, { visible: true })}`
  }

  const previewText = repartoPreviewText()
  const summaryText = repartoSummary(form, formLabel, splitPreset, SPLIT_PRESETS)
  const dateLabel = form.date === todayISO() ? 'Hoy' : form.date

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditing ? 'Editar' : selectedTypeLabel}
        className="pb-3"
        leading={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-0.5 rounded-lg text-stone-500 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
            aria-label="Volver"
          >
            ←
          </button>
        }
        trailing={
          <div>
            <span id="movement-type-label" className="sr-only">
              Tipo de movimiento
            </span>
            <div className="flex gap-1.5" role="radiogroup" aria-labelledby="movement-type-label">
              {(['expense', 'income', 'settlement'] as MovementType[]).map((t) => (
                <ChoiceChip
                  key={t}
                  role="radio"
                  selected={form.type === t}
                  size="sm"
                  shape="pill"
                  onClick={() => handleTypeChange(t)}
                >
                  {movementTypeLabels[t]}
                </ChoiceChip>
              ))}
            </div>
          </div>
        }
      />

      <Card compact>
        <form onSubmit={handleSubmit} noValidate aria-describedby={formSummary ? 'movement-form-summary' : undefined}>
          <LiveRegion politeness="assertive">{formSummary}</LiveRegion>
          {formSummary && <FieldError id="movement-form-summary">{formSummary}</FieldError>}

          <FormGroup className="mb-3">
            <Label htmlFor="amount">Monto</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <CurrencyAmountInput
                  id="amount"
                  currency={form.currency}
                  value={form.amount}
                  invalid={Boolean(errors.amount)}
                  autoFocus={!isEditing}
                  aria-describedby={describedBy(errors.amount && 'amount-error')}
                  onChange={(amount) => setForm({ ...form, amount })}
                />
              </div>
              <Select
                id="currency"
                value={form.currency}
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                aria-label="Moneda"
                className="py-3"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {errors.amount && <FieldError id="amount-error">{errors.amount}</FieldError>}
          </FormGroup>

          <FormGroup className="mb-3">
            <Label htmlFor="description">Concepto</Label>
            <Input
              id="description"
              value={form.description}
              invalid={Boolean(errors.description)}
              aria-describedby={describedBy(errors.description && 'description-error')}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={form.type === 'income' ? 'Ej: Sueldo de junio...' : 'Ej: Supermercado, cena...'}
            />
            {errors.description && <FieldError id="description-error">{errors.description}</FieldError>}
          </FormGroup>

          {form.type !== 'settlement' && (
            <FormGroup className="mb-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span id="category-label" className="block text-sm font-medium text-stone-700">
                  Categoría
                </span>
                {topCategoryName && form.date === todayISO() && (
                  <span className="text-xs text-stone-500">Más usada: {topCategoryName}</span>
                )}
              </div>
              {form.type === 'income' ? (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="category-label">
                  {filteredCategories.map((category) => (
                    <ChoiceChip
                      key={category.id}
                      role="radio"
                      selected={form.categoryId === category.id}
                      className="w-full"
                      onClick={() => setForm({ ...form, categoryId: category.id })}
                    >
                      {category.name}
                    </ChoiceChip>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="category-label">
                    {categoryOptions.map((category) => (
                      <ChoiceChip
                        key={category.id}
                        role="radio"
                        shape="pill"
                        size="sm"
                        selected={form.categoryId === category.id}
                        onClick={() => {
                          setForm({ ...form, categoryId: category.id })
                          setShowAllCategories(false)
                        }}
                      >
                        {category.name}
                      </ChoiceChip>
                    ))}
                    {filteredCategories.length > primaryCategories.length && (
                      <ChoiceChip
                        shape="pill"
                        size="sm"
                        aria-expanded={showAllCategories}
                        onClick={() => setShowAllCategories((open) => !open)}
                      >
                        {showAllCategories ? 'Ver menos' : 'Ver todas'}
                      </ChoiceChip>
                    )}
                  </div>
                </>
              )}
              {errors.categoryId && <FieldError id="category-error">{errors.categoryId}</FieldError>}
            </FormGroup>
          )}

          {form.type === 'income' && (
            <FormGroup className="mb-3">
              <span id="recipient-label" className="mb-1 block text-sm font-medium text-stone-700">
                {payerFieldLabel('income')}
              </span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="recipient-label">
                {(
                  [
                    { value: 'personA' as const, label: formLabel('personA') },
                    { value: 'personB' as const, label: formLabel('personB') },
                  ] as const
                ).map(({ value, label }) => (
                  <ChoiceChip
                    key={value}
                    role="radio"
                    selected={form.paidBy === value}
                    className="w-full"
                    onClick={() => handlePaidByChange(value)}
                  >
                    {label}
                  </ChoiceChip>
                ))}
              </div>
            </FormGroup>
          )}

          {form.type !== 'income' && (
            <FormGroup className="!mb-3">
              <CollapsiblePanel
                title="Reparto"
                summary={summaryText}
                open={repartoOpen}
                onOpenChange={setRepartoOpen}
                panelId="reparto-section"
                compact
                contentClassName="space-y-3 bg-white"
              >
                <FormGroup className="!mb-0">
                  <span id="paid-by-label" className="mb-2 block text-sm font-medium text-stone-700">
                    {payerFieldLabel(form.type)}
                  </span>
                  <div className="space-y-2">
                    <div
                      className="grid min-w-0 grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-labelledby="paid-by-label"
                    >
                      {(
                        [
                          { value: 'personA' as const, label: formLabel('personA') },
                          { value: 'personB' as const, label: formLabel('personB') },
                        ] as const
                      ).map(({ value, label }) => (
                        <ChoiceChip
                          key={value}
                          role="radio"
                          selected={form.paidBy === value}
                          className="w-full"
                          onClick={() => handlePaidByChange(value)}
                        >
                          {label}
                        </ChoiceChip>
                      ))}
                    </div>

                    {form.type !== 'settlement' && (
                      <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-surface-50 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor="is-shared" className="!mb-0 text-sm font-medium text-stone-700">
                            Compartido
                          </Label>
                          <p id="is-shared-hint" className="mt-0.5 text-xs text-stone-500">
                            Define cuánto asume cada persona.
                          </p>
                        </div>
                        <button
                          id="is-shared"
                          type="button"
                          role="switch"
                          aria-checked={form.isShared}
                          aria-describedby="is-shared-hint"
                          onClick={() => handleSharedChange(!form.isShared)}
                          className={cn(
                            'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                            form.isShared ? 'bg-brand-600' : 'bg-stone-300',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                              form.isShared ? 'left-[22px]' : 'left-0.5',
                            )}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </FormGroup>

                {form.type !== 'settlement' && (
                  <>
                    {form.isShared && (
                      <>
                        <FormGroup className="!mb-0">
                          <span
                            id="split-preset-label"
                            className="mb-1 block text-sm font-medium text-stone-700"
                          >
                            {splitDistributionLabel(form.type)}
                          </span>
                          <div
                            className="flex flex-wrap gap-1.5"
                            role="radiogroup"
                            aria-labelledby="split-preset-label"
                          >
                            {SPLIT_PRESETS.map((preset) => (
                              <ChoiceChip
                                key={preset.value}
                                role="radio"
                                size="sm"
                                shape="pill"
                                selected={splitPreset === preset.value}
                                onClick={() => handleSplitPreset(preset.value)}
                              >
                                {preset.label}
                              </ChoiceChip>
                            ))}
                          </div>
                        </FormGroup>

                        {splitPreset === 'custom' && (
                          <div className="grid grid-cols-2 gap-3">
                            <FormGroup className="!mb-0">
                              <Label htmlFor="share-person-a">{sharePercentLabel('personA', persons)}</Label>
                              <Input
                                id="share-person-a"
                                type="number"
                                min="0"
                                max="100"
                                value={form.sharePersonA}
                                aria-describedby={describedBy(
                                  errors.share && 'share-error',
                                  previewText && 'reparto-preview',
                                )}
                                onChange={(e) => {
                                  const a = parseFloat(e.target.value) || 0
                                  setForm({ ...form, sharePersonA: a, sharePersonB: 100 - a })
                                }}
                              />
                            </FormGroup>
                            <FormGroup className="!mb-0">
                              <Label htmlFor="share-person-b">{sharePercentLabel('personB', persons)}</Label>
                              <Input
                                id="share-person-b"
                                type="number"
                                min="0"
                                max="100"
                                value={form.sharePersonB}
                                aria-describedby={describedBy(
                                  errors.share && 'share-error',
                                  previewText && 'reparto-preview',
                                )}
                                onChange={(e) => {
                                  const b = parseFloat(e.target.value) || 0
                                  setForm({ ...form, sharePersonB: b, sharePersonA: 100 - b })
                                }}
                              />
                            </FormGroup>
                          </div>
                        )}
                        {errors.share && <FieldError id="share-error">{errors.share}</FieldError>}
                      </>
                    )}
                  </>
                )}

                {previewText && (
                  <p id="reparto-preview" className="rounded-lg bg-surface-50 px-3 py-2 text-xs text-stone-600">
                    {previewText}
                  </p>
                )}
              </CollapsiblePanel>
            </FormGroup>
          )}

          <FormGroup className="mb-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Label htmlFor="date" className="!mb-0">
                Fecha
              </Label>
              <span className="text-xs text-stone-500">{dateLabel}</span>
            </div>
            <div className="w-full min-w-0 overflow-hidden">
              <Input
                id="date"
                type="date"
                value={form.date}
                invalid={Boolean(errors.date)}
                aria-describedby={describedBy(errors.date && 'date-error')}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            {errors.date && <FieldError id="date-error">{errors.date}</FieldError>}
          </FormGroup>

          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1" aria-live="polite">
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
