/* Hallmark · component: movement-form-card · genre: modern-minimal · macrostructure: Workbench
 * design-system: DESIGN.md · designed-as-app · enrichment: none
 * pre-emit critique: P5 H5 E5 S5 R5 V4 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import {
  useCategories,
  useCategoryRules,
  useMovement,
  useMovementFormHints,
  useRuleMutations,
  useSettings,
  useMovementMutations,
} from '@/hooks/useData'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { splitPreset as getSplitPreset, personalSharesFromPayer } from '@/lib/balance'
import {
  sharePercentLabel,
} from '@/lib/couple/person-labels'
import {
  buildNewMovementDefaults,
  getFrequentCategoryIds,
  payerFieldLabel,
  splitDistributionLabel,
} from '@/lib/movement-form-defaults'
import { ruleKeywordMatchesDescription } from '@/lib/category-rules'
import { buildImportCategoryButtons } from '@/lib/import-display'
import { suggestCategory } from '@/lib/import'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
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
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonCard } from '@/components/skeletons/SkeletonCard'
import { SPLIT_PRESETS, formSplitPreset } from '@/components/ImportShareControls'
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

const FORM_SPLIT_PRESETS = SPLIT_PRESETS.filter((preset) =>
  ['50-50', '60-40', 'custom'].includes(preset.value),
)

const DESCRIPTION_DEBOUNCE_MS = 300

export function MovementFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { membership } = useAuth()
  const persons = useCouplePersons()
  const categories = useCategories() ?? []
  const categoryRules = useCategoryRules() ?? []
  const { movements: hintMovements } = useMovementFormHints()
  const { movement: editMovement, isLoading: loadingMovement } = useMovement(id)
  const settings = useSettings()
  const { createMovement, updateMovement, deleteMovement } = useMovementMutations()
  const { addRule } = useRuleMutations()
  const { confirm, dialog } = useConfirmDialog()
  const [form, setForm] = useState<MovementFormData>(() =>
    buildNewMovementDefaults({ movements: [], displayCurrency: settings?.displayCurrency }),
  )
  const [debouncedDescription, setDebouncedDescription] = useState('')
  const [splitPreset, setSplitPreset] = useState('50-50')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formSummary, setFormSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [saveRuleOpen, setSaveRuleOpen] = useState(false)
  const [saveRuleKeyword, setSaveRuleKeyword] = useState('')
  const [saveRuleSaving, setSaveRuleSaving] = useState(false)
  const [saveRuleDone, setSaveRuleDone] = useState(false)
  const [saveRuleError, setSaveRuleError] = useState<string | null>(null)
  const initializedNewForm = useRef(false)
  const hydratedEditId = useRef<string | null>(null)
  const categoryTouchedByUser = useRef(false)
  const isEditing = Boolean(id)
  const personAName = persons.personAName
  const personBName = persons.personBName
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
    const sharePersonA = m.type === 'income' ? incomeShares.sharePersonA : m.sharePersonA
    const sharePersonB = m.type === 'income' ? incomeShares.sharePersonB : m.sharePersonB
    setForm({
      type: m.type,
      amount: m.amount,
      currency: m.currency ?? 'ARS',
      date: m.date,
      description: m.description,
      categoryId: m.categoryId,
      paidBy,
      sharePersonA,
      sharePersonB,
      isShared: m.type === 'income' ? false : m.isShared,
    })
    setSplitPreset(
      formSplitPreset(
        sharePersonA,
        sharePersonB,
        FORM_SPLIT_PRESETS.map((p) => p.value),
      ),
    )
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDescription(form.description), DESCRIPTION_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form.description])

  const suggestedCategoryId = useMemo(() => {
    if (form.type !== 'expense' || !debouncedDescription.trim()) return null
    return suggestCategory(debouncedDescription, categories, categoryRules)
  }, [form.type, debouncedDescription, categories, categoryRules])

  useEffect(() => {
    if (isEditing || form.type !== 'expense' || categoryTouchedByUser.current || !suggestedCategoryId) {
      return
    }
    setForm((f) => (f.categoryId === suggestedCategoryId ? f : { ...f, categoryId: suggestedCategoryId }))
  }, [isEditing, form.type, suggestedCategoryId])

  const filteredCategories = categories.filter((c) =>
    form.type === 'settlement' ? true : c.type === (form.type === 'income' ? 'income' : 'expense'),
  )

  const frequentCategoryIds = useMemo(
    () => getFrequentCategoryIds(hintMovements, form.type, 2),
    [hintMovements, form.type],
  )

  const primaryCategories = useMemo(
    () =>
      buildImportCategoryButtons(
        filteredCategories,
        frequentCategoryIds,
        form.categoryId,
        form.type === 'expense' ? suggestedCategoryId : null,
        2,
      ),
    [filteredCategories, frequentCategoryIds, form.categoryId, form.type, suggestedCategoryId],
  )

  const categoryWasCorrected = useMemo(() => {
    if (isEditing || form.type !== 'expense') return false
    return Boolean(suggestedCategoryId && form.categoryId && form.categoryId !== suggestedCategoryId)
  }, [isEditing, form.type, suggestedCategoryId, form.categoryId])

  const existingRule = useMemo(() => {
    if (!form.categoryId || form.type !== 'expense') return null
    return categoryRules.find(
      (rule) =>
        rule.categoryId === form.categoryId &&
        ruleKeywordMatchesDescription(rule.keyword, form.description),
    )
  }, [categoryRules, form.categoryId, form.description, form.type])

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

  async function handleDelete() {
    if (!id) return
    const confirmed = await confirm({
      title: 'Eliminar movimiento',
      description: 'Esta acción no se puede deshacer. ¿Querés eliminar este movimiento?',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteMovement(id)
      navigate('/movimientos')
    } finally {
      setDeleting(false)
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

  function resetSaveRuleState() {
    setSaveRuleDone(false)
    setSaveRuleOpen(false)
    setSaveRuleError(null)
  }

  function handleDescriptionChange(description: string) {
    resetSaveRuleState()
    setForm((f) => ({ ...f, description }))
  }

  function handleExpenseCategoryChange(categoryId: string) {
    categoryTouchedByUser.current = true
    resetSaveRuleState()
    setForm((f) => ({ ...f, categoryId }))
    setShowAllCategories(false)
  }

  function openSaveRule() {
    setSaveRuleKeyword(form.description)
    setSaveRuleOpen(true)
    setSaveRuleError(null)
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId) return
    const keyword = saveRuleKeyword.trim()
    if (!keyword) {
      setSaveRuleError('Ingresá una palabra clave.')
      return
    }

    setSaveRuleSaving(true)
    setSaveRuleError(null)
    try {
      await addRule(keyword, form.categoryId)
      setSaveRuleDone(true)
      setSaveRuleOpen(false)
    } catch (err) {
      setSaveRuleError(err instanceof Error ? err.message : 'No se pudo guardar la regla.')
    } finally {
      setSaveRuleSaving(false)
    }
  }

  function handleTypeChange(type: MovementType) {
    setShowAllCategories(false)
    categoryTouchedByUser.current = false
    resetSaveRuleState()
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

  const payerOptions = useMemo(
    () => [
      { value: 'personA' as const, label: personAName },
      { value: 'personB' as const, label: personBName },
    ],
    [personAName, personBName],
  )

  return (
    <div className="space-y-4">
      {dialog}

      <PageHeader
        title={isEditing ? 'Editar' : selectedTypeLabel}
        leading={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base text-stone-600 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
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
      <div>
        <CurrencyAmountInput
          id="amount"
          currency={form.currency}
          value={form.amount}
          size="hero"
          variant="bare"
          invalid={Boolean(errors.amount)}
          autoFocus={!isEditing}
          className="pl-5 sm:pl-8"
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
        <form onSubmit={handleSubmit} noValidate aria-describedby={formSummary ? 'movement-form-summary' : undefined}>
          <LiveRegion politeness="assertive">{formSummary}</LiveRegion>
          {formSummary && <FieldError id="movement-form-summary">{formSummary}</FieldError>}

          <div className="flex flex-col gap-7">
            <FormGroup className="!mb-0">
              <Label htmlFor="description">Concepto</Label>
              <Input
                id="description"
                value={form.description}
                invalid={Boolean(errors.description)}
                aria-describedby={describedBy(errors.description && 'description-error')}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder={form.type === 'income' ? 'Ej: Sueldo de junio...' : 'Ej: Supermercado, cena...'}
              />
              {errors.description && <FieldError id="description-error">{errors.description}</FieldError>}
            </FormGroup>

            {form.type !== 'settlement' && (
              <FormGroup className="!mb-0">
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
                    <span id="category-label" className="mb-1 block text-sm font-medium text-stone-700">
                      Categoría
                    </span>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="category-label">
                      {categoryOptions.map((category) => {
                        const isSelected = form.categoryId === category.id
                        const isSuggested = suggestedCategoryId === category.id && !isSelected
                        return (
                          <ChoiceChip
                            key={category.id}
                            role="radio"
                            shape="pill"
                            size="sm"
                            selected={isSelected}
                            className="inline-flex items-center gap-1.5"
                            onClick={() => handleExpenseCategoryChange(category.id)}
                          >
                            {category.color && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: category.color }}
                                aria-hidden="true"
                              />
                            )}
                            {category.name}
                            {isSuggested ? ' · sugerida' : ''}
                          </ChoiceChip>
                        )
                      })}
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

                    {categoryWasCorrected && form.description.trim() && (
                      <div className="mt-2 rounded-lg border border-dashed border-stone-200 bg-white px-2.5 py-2">
                        {existingRule || saveRuleDone ? (
                          <p className="text-xs text-stone-500">
                            Regla guardada para futuros movimientos.
                          </p>
                        ) : !saveRuleOpen ? (
                          <button
                            type="button"
                            onClick={openSaveRule}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Guardar como regla
                          </button>
                        ) : (
                          <form onSubmit={handleSaveRule} className="space-y-2">
                            <Label htmlFor="save-rule-keyword" className="text-xs text-stone-600">
                              Palabra clave
                            </Label>
                            <Input
                              id="save-rule-keyword"
                              value={saveRuleKeyword}
                              onChange={(e) => setSaveRuleKeyword(e.target.value)}
                              disabled={saveRuleSaving}
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" disabled={saveRuleSaving}>
                                {saveRuleSaving ? 'Guardando...' : 'Guardar regla'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setSaveRuleOpen(false)}
                                disabled={saveRuleSaving}
                              >
                                Cancelar
                              </Button>
                            </div>
                            {saveRuleError && (
                              <p className="text-xs text-red-600">{saveRuleError}</p>
                            )}
                          </form>
                        )}
                      </div>
                    )}
                  </>
                )}
                {errors.categoryId && <FieldError id="category-error">{errors.categoryId}</FieldError>}
              </FormGroup>
            )}

            {form.type === 'income' && (
              <FormGroup className="!mb-0">
                <Label>{payerFieldLabel('income')}</Label>
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
              <FormGroup className="!mb-0">
                <Label>{payerFieldLabel(form.type)}</Label>
                <SegmentedControl
                  aria-label={payerFieldLabel(form.type)}
                  options={payerOptions}
                  value={form.paidBy === 'personB' ? 'personB' : 'personA'}
                  onChange={(value) => handlePaidByChange(value)}
                  size="sm"
                />
              </FormGroup>
            )}

            {form.type !== 'income' && form.type !== 'settlement' && (
              <div className="flex items-center gap-2">
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
            )}

            {form.type !== 'income' && form.type !== 'settlement' && form.isShared && (
              <div>
                <ChoiceChipGroup
                  label={splitDistributionLabel(form.type)}
                  labelId="split-preset-label"
                  role="radiogroup"
                  className="flex flex-wrap gap-1.5"
                >
                  {FORM_SPLIT_PRESETS.map((preset) => (
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
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FormGroup className="!mb-0">
                      <Label htmlFor="share-person-a">{sharePercentLabel('personA', persons)}</Label>
                      <Input
                        id="share-person-a"
                        type="number"
                        min="0"
                        max="100"
                        value={form.sharePersonA}
                        aria-describedby={describedBy(errors.share && 'share-error')}
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
                        aria-describedby={describedBy(errors.share && 'share-error')}
                        onChange={(e) => {
                          const b = parseFloat(e.target.value) || 0
                          setForm({ ...form, sharePersonB: b, sharePersonA: 100 - b })
                        }}
                      />
                    </FormGroup>
                  </div>
                )}
                {errors.share && <FieldError id="share-error">{errors.share}</FieldError>}
              </div>
            )}

            <FormGroup className="!mb-0">
              <Label htmlFor="date">Fecha</Label>
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
          </div>

          <div className="mt-7 space-y-3 border-t border-stone-200/80 pt-4">
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving || deleting}
                  className="min-w-0 flex-1"
                  aria-live="polite"
                >
                  {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving || deleting}
                  onClick={() => navigate(-1)}
                  className="shrink-0"
                >
                  Cancelar
                </Button>
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-red-700 hover:bg-red-50"
                  disabled={saving || deleting}
                  aria-busy={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar movimiento'}
                </Button>
              )}
            </div>
        </form>
      </Card>
        </>
      )}
    </div>
  )
}
