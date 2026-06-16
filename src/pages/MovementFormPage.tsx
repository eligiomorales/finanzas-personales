/* Hallmark · component: movement-form-card · genre: modern-minimal · macrostructure: Workbench
 * design-system: DESIGN.md · designed-as-app · enrichment: none
 * pre-emit critique: P5 H5 E5 S5 R5 V4 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { useCategories, useMovement, useMovementFormHints, useSettings, useMovementMutations } from '@/hooks/useData'
import { getDisplayAmountForView, splitPreset as getSplitPreset, personalSharesFromPayer } from '@/lib/balance'
import {
  formLabelWithName,
  sharePercentLabel,
} from '@/lib/couple/person-labels'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import {
  buildNewMovementDefaults,
  getFrequentCategoryIds,
  payerFieldLabel,
  splitDistributionLabel,
} from '@/lib/movement-form-defaults'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { formatMovementAmountLinesForView, getCurrencyConfig } from '@/lib/currency'
import { formatCurrency, formatShortDate, todayISO } from '@/lib/utils'
import {
  Button,
  Input,
  Label,
  FormGroup,
  FieldError,
  LiveRegion,
  describedBy,
} from '@/components/ui/Form'
import { CurrencyAmountInput } from '@/components/CurrencyAmountInput'
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/ChoiceChip'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { movementLayoutId, MovementSummaryBlock } from '@/components/ui/MovementRow'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonCard } from '@/components/skeletons/SkeletonCard'
import { SPLIT_PRESETS } from '@/components/ImportShareControls'
import { cn } from '@/lib/utils'
import type { CurrencyCode, MovementFormData, MovementType, Payer } from '@/types'

const movementTypeLabels: Record<MovementType, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  settlement: 'Liquidación',
}

const MOVEMENT_TYPE_OPTIONS = (['expense', 'income', 'settlement'] as const).map((type) => ({
  value: type,
  label: movementTypeLabels[type],
}))

export function MovementFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { membership } = useAuth()
  const persons = useCouplePersons()
  const { mode: expenseViewMode } = useExpenseViewMode()
  const categories = useCategories() ?? []
  const { movements: hintMovements } = useMovementFormHints()
  const { movement: editMovement, isLoading: loadingMovement } = useMovement(id)
  const settings = useSettings()
  const { createMovement, updateMovement } = useMovementMutations()
  const [form, setForm] = useState<MovementFormData>(() =>
    buildNewMovementDefaults({ movements: [], displayCurrency: settings?.displayCurrency }),
  )
  const [splitPreset, setSplitPreset] = useState('50-50')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formSummary, setFormSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const initializedNewForm = useRef(false)
  const hydratedEditId = useRef<string | null>(null)
  const isEditing = Boolean(id)
  const myRole = persons.myRole ?? 'personA'
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])

  const editSummary = useMemo(() => {
    if (!isEditing || !id) return null

    const source = editMovement ?? {
      type: form.type,
      amount: form.amount,
      currency: form.currency,
      date: form.date,
      description: form.description,
      source: 'manual' as const,
    }

    if (!source.description && !editMovement) return null

    const displayAmount = editMovement
      ? getDisplayAmountForView(editMovement, myRole, currencyConfig, expenseViewMode)
      : form.amount
    const amountLines = editMovement
      ? formatMovementAmountLinesForView(editMovement, currencyConfig, displayAmount)
      : {
          primary: formatCurrency(form.amount, form.currency, { visible: true }),
          secondary: undefined,
        }
    const amountSign =
      source.type === 'income' ? '+' : source.type === 'expense' ? '-' : ''

    return {
      description: source.description,
      date: formatShortDate(source.date),
      movementType: source.type,
      amountPrimary: amountLines.primary,
      amountSecondary: amountLines.secondary,
      amountSign,
      imported: editMovement?.source === 'imported',
      layoutId: movementLayoutId(id),
    }
  }, [
    isEditing,
    id,
    editMovement,
    form.type,
    form.amount,
    form.currency,
    form.date,
    form.description,
    myRole,
    currencyConfig,
    expenseViewMode,
  ])

  const personAName = persons.personAName
  const personBName = persons.personBName
  const formLabel = (role: 'personA' | 'personB') => formLabelWithName(role, persons)
  const selectedTypeLabel = movementTypeLabels[form.type]

  useEffect(() => {
    if (!id) {
      hydratedEditId.current = null
      return
    }
    if (!editMovement || hydratedEditId.current === id) return

    hydratedEditId.current = id
    const m = editMovement
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
  }, [id, editMovement])

  useEffect(() => {
    if (id || initializedNewForm.current || !settings) return
    initializedNewForm.current = true
    setForm(
      buildNewMovementDefaults({
        movements: hintMovements,
        displayCurrency: settings.displayCurrency,
        payerRole: membership?.role,
      }),
    )
  }, [id, settings, membership, hintMovements])

  const filteredCategories = categories.filter((c) =>
    form.type === 'settlement' ? true : c.type === (form.type === 'income' ? 'income' : 'expense'),
  )

  const frequentCategoryIds = useMemo(
    () => getFrequentCategoryIds(hintMovements, form.type, 3),
    [hintMovements, form.type],
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

      if (type === 'income') {
        return {
          ...f,
          type,
          categoryId: null,
          paidBy,
          isShared: false,
          ...personalSharesFromPayer(paidBy),
        }
      }

      return {
        ...f,
        type,
        categoryId: null,
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
  const dateLabel = form.date === todayISO() ? 'Hoy' : form.date

  const payerOptions = useMemo(
    () => [
      { value: 'personA' as const, label: personAName },
      { value: 'personB' as const, label: personBName },
    ],
    [personAName, personBName],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEditing ? 'Editar' : selectedTypeLabel}
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
      />

      <SegmentedControl
        aria-label="Tipo de movimiento"
        options={MOVEMENT_TYPE_OPTIONS}
        value={form.type}
        onChange={(type) => handleTypeChange(type as MovementType)}
      />

      {loadingMovement ? (
        <SkeletonCard />
      ) : (
        <>
      {editSummary && (
        <Card compact className="!p-3">
          <MovementSummaryBlock {...editSummary} />
        </Card>
      )}

      <div>
        <CurrencyAmountInput
          id="amount"
          currency={form.currency}
          value={form.amount}
          size="hero"
          variant="bare"
          invalid={Boolean(errors.amount)}
          autoFocus={!isEditing}
          aria-describedby={describedBy(errors.amount && 'amount-error')}
          onChange={(amount) => setForm({ ...form, amount })}
          trailing={
            <SegmentedControl
              options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
              value={form.currency}
              onChange={handleCurrencyChange}
              aria-label="Moneda"
              size="sm"
              fullWidth={false}
              className="shrink-0"
            />
          }
        />
        {errors.amount && <FieldError id="amount-error">{errors.amount}</FieldError>}
      </div>

      <Card compact className="min-w-0 overflow-x-clip">
        <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby={formSummary ? 'movement-form-summary' : undefined}>
          <LiveRegion politeness="assertive">{formSummary}</LiveRegion>
          {formSummary && <FieldError id="movement-form-summary">{formSummary}</FieldError>}

          <FormGroup className="!mb-0">
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
              <div>
                {form.type === 'income' ? (
                  <ChoiceChipGroup
                    label="Categoría"
                    labelId="category-label"
                    role="radiogroup"
                    className="grid grid-cols-2 gap-2"
                  >
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
                  </ChoiceChipGroup>
                ) : (
                  <>
                    <span id="category-label" className="mb-1.5 block text-sm font-medium text-stone-700">
                      Categoría
                    </span>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="category-label">
                      {categoryOptions.map((category) => (
                        <ChoiceChip
                          key={category.id}
                          role="radio"
                          shape="pill"
                          size="sm"
                          selected={form.categoryId === category.id}
                          className="inline-flex items-center gap-1.5"
                          onClick={() => {
                            setForm({ ...form, categoryId: category.id })
                            setShowAllCategories(false)
                          }}
                        >
                          {category.color && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: category.color }}
                              aria-hidden="true"
                            />
                          )}
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
              </div>
            )}

            {form.type === 'income' && (
              <FormGroup className="!mb-0">
                <Label className="mb-1.5">{payerFieldLabel('income')}</Label>
                <SegmentedControl
                  aria-label={payerFieldLabel('income')}
                  options={payerOptions}
                  value={form.paidBy === 'personB' ? 'personB' : 'personA'}
                  onChange={(value) => handlePaidByChange(value)}
                  size="sm"
                />
              </FormGroup>
            )}

            {form.type !== 'income' && (
              <div className="space-y-4">
                <FormGroup className="!mb-0">
                  <Label className="mb-1.5">{payerFieldLabel(form.type)}</Label>
                  <SegmentedControl
                    aria-label={payerFieldLabel(form.type)}
                    options={payerOptions}
                    value={form.paidBy === 'personB' ? 'personB' : 'personA'}
                    onChange={(value) => handlePaidByChange(value)}
                    size="sm"
                  />
                </FormGroup>

                {form.type !== 'settlement' && (
                  <>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Label htmlFor="is-shared" className="!mb-0">
                        Compartido
                      </Label>
                      <button
                        id="is-shared"
                        type="button"
                        role="switch"
                        aria-checked={form.isShared}
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

                    {form.isShared && (
                      <>
                        <ChoiceChipGroup
                          label={splitDistributionLabel(form.type)}
                          labelId="split-preset-label"
                          role="radiogroup"
                          className="flex flex-wrap gap-1.5"
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
                        </ChoiceChipGroup>

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
                  <p id="reparto-preview" className="text-xs text-stone-500">
                    {previewText}
                  </p>
                )}
              </div>
            )}

            <FormGroup className="!mb-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <Label htmlFor="date" className="!mb-0">
                  Fecha
                </Label>
                <span className="text-xs text-stone-500">{dateLabel}</span>
              </div>
              <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-stone-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  invalid={Boolean(errors.date)}
                  aria-describedby={describedBy(errors.date && 'date-error')}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full min-w-0 max-w-full border-0 px-2 shadow-none focus-visible:border-transparent focus-visible:shadow-none"
                />
              </div>
              {errors.date && <FieldError id="date-error">{errors.date}</FieldError>}
            </FormGroup>

            <div className="flex gap-2 border-t border-stone-200/80 pt-4">
              <Button type="submit" disabled={saving} className="min-w-0 flex-1" aria-live="polite">
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
              </Button>
              <Button type="button" variant="secondary" disabled={saving} onClick={() => navigate(-1)} className="shrink-0">
                Cancelar
              </Button>
            </div>
        </form>
      </Card>
        </>
      )}
    </div>
  )
}
