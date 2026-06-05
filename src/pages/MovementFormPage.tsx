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
import { formatCurrency, todayISO } from '@/lib/utils'
import {
  Button,
  Input,
  Select,
  Label,
  FormGroup,
  FieldError,
  FieldHint,
  LiveRegion,
  describedBy,
} from '@/components/ui/Form'
import { CurrencyAmountInput } from '@/components/CurrencyAmountInput'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import type { CurrencyCode, MovementFormData, MovementType, Payer } from '@/types'

const SPLIT_PRESETS = [
  { value: '50-50', label: '50 / 50' },
  { value: '60-40', label: '60 / 40' },
  { value: '100-0', label: '100 / 0' },
  { value: '0-100', label: '0 / 100' },
  { value: 'custom', label: 'Personalizado' },
]

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

  const chipCategories = useMemo(
    () =>
      frequentCategoryIds
        .map((categoryId) => filteredCategories.find((c) => c.id === categoryId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [frequentCategoryIds, filteredCategories],
  )

  const topCategoryName = useMemo(() => {
    const topId = getDefaultCategoryId(movements, form.type)
    return filteredCategories.find((c) => c.id === topId)?.name
  }, [movements, form.type, filteredCategories])

  const showCategorySelect =
    showAllCategories ||
    chipCategories.length === 0 ||
    (form.categoryId != null && !frequentCategoryIds.includes(form.categoryId))

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
    const amountLabel = formatCurrency(form.amount, form.currency)
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
      return `${payer} pagó ${amountLabel} · cada uno asume ${formatCurrency(assumeA, form.currency)}`
    }

    return `${payer} pagó ${amountLabel} · ${personAName} ${formatCurrency(assumeA, form.currency)} · ${personBName} ${formatCurrency(assumeB, form.currency)}`
  }

  const previewText = repartoPreviewText()
  const summaryText = repartoSummary(form, formLabel, splitPreset, SPLIT_PRESETS)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
          aria-label="Volver"
        >
          ← Volver
        </button>
        <h2 className="text-xl font-bold">{isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} noValidate aria-describedby={formSummary ? 'movement-form-summary' : undefined}>
          <LiveRegion politeness="assertive">{formSummary}</LiveRegion>
          {formSummary && <FieldError id="movement-form-summary">{formSummary}</FieldError>}

          <FormGroup>
            <span id="movement-type-label" className="mb-1 block text-sm font-medium text-slate-700">
              Tipo
            </span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="movement-type-label">
              {(['expense', 'income', 'settlement'] as MovementType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={form.type === t}
                  onClick={() => handleTypeChange(t)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                    form.type === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Liquidación'}
                </button>
              ))}
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="amount">Monto del movimiento</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <CurrencyAmountInput
                  id="amount"
                  currency={form.currency}
                  value={form.amount}
                  invalid={Boolean(errors.amount)}
                  autoFocus={!isEditing}
                  aria-describedby={describedBy(errors.amount && 'amount-error', 'amount-hint')}
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
            <FieldHint id="amount-hint">
              {form.type === 'income'
                ? 'Teclado numérico · moneda en la que cobraste'
                : 'Teclado numérico · moneda del pago real'}
            </FieldHint>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={form.description}
              invalid={Boolean(errors.description)}
              aria-describedby={describedBy(errors.description && 'description-error')}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={form.type === 'income' ? 'Ej: Sueldo de junio...' : 'Ej: Supermercado, salario...'}
            />
            {errors.description && <FieldError id="description-error">{errors.description}</FieldError>}
          </FormGroup>

          {form.type !== 'settlement' && (
            <FormGroup>
              <span id="category-label" className="mb-1 block text-sm font-medium text-slate-700">
                Categoría
              </span>
              {form.type === 'income' ? (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="category-label">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      role="radio"
                      aria-checked={form.categoryId === category.id}
                      onClick={() => setForm({ ...form, categoryId: category.id })}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                        form.categoryId === category.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {chipCategories.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2" role="group" aria-labelledby="category-label">
                      {chipCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, categoryId: category.id })
                            setShowAllCategories(false)
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                            form.categoryId === category.id
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                          )}
                        >
                          {category.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowAllCategories(true)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                          showAllCategories
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        Ver todas
                      </button>
                    </div>
                  )}
                  {showCategorySelect && (
                    <Select
                      id="category"
                      value={form.categoryId ?? ''}
                      invalid={Boolean(errors.categoryId)}
                      aria-describedby={describedBy(errors.categoryId && 'category-error', 'category-hint')}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
                    >
                      <option value="">Seleccionar...</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  {topCategoryName && form.date === todayISO() && (
                    <FieldHint id="category-hint">
                      Más usada: {topCategoryName} · Fecha: hoy
                    </FieldHint>
                  )}
                </>
              )}
              {errors.categoryId && <FieldError id="category-error">{errors.categoryId}</FieldError>}
            </FormGroup>
          )}

          {form.type === 'income' && (
            <FormGroup>
              <span id="recipient-label" className="mb-1 block text-sm font-medium text-slate-700">
                {payerFieldLabel('income')}
              </span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="recipient-label">
                {(
                  [
                    { value: 'personA' as const, label: formLabel('personA') },
                    { value: 'personB' as const, label: formLabel('personB') },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.paidBy === value}
                    onClick={() => handlePaidByChange(value)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                      form.paidBy === value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <FieldHint>No afecta el balance de la pareja; solo registra quién cobró.</FieldHint>
            </FormGroup>
          )}

          {form.type !== 'income' && (
            <FormGroup className="!mb-0">
            <button
              type="button"
              onClick={() => setRepartoOpen((open) => !open)}
              aria-expanded={repartoOpen}
              aria-controls="reparto-section"
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
            >
              <div>
                <span className="block text-sm font-semibold text-slate-800">Reparto</span>
                <span className="mt-0.5 block text-xs text-slate-500">{summaryText}</span>
              </div>
              <span className="text-slate-400" aria-hidden="true">
                {repartoOpen ? '▴' : '▾'}
              </span>
            </button>

            {repartoOpen && (
              <div id="reparto-section" className="mt-3 space-y-4 rounded-lg border border-slate-200 p-3">
                <FormGroup className="!mb-0">
                  <span id="paid-by-label" className="mb-1 block text-sm font-medium text-slate-700">
                    {payerFieldLabel(form.type)}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="grid min-w-0 flex-1 grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-labelledby="paid-by-label"
                    >
                      {(
                        [
                          { value: 'personA' as const, label: formLabel('personA') },
                          { value: 'personB' as const, label: formLabel('personB') },
                        ] as const
                      ).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={form.paidBy === value}
                          onClick={() => handlePaidByChange(value)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                            form.paidBy === value
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {form.type !== 'settlement' && (
                      <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                        <Label htmlFor="is-shared" className="!mb-0 text-xs font-medium text-slate-600">
                          Compartido
                        </Label>
                        <button
                          id="is-shared"
                          type="button"
                          role="switch"
                          aria-checked={form.isShared}
                          aria-describedby="is-shared-hint"
                          onClick={() => handleSharedChange(!form.isShared)}
                          className={cn(
                            'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                            form.isShared ? 'bg-brand-600' : 'bg-slate-300',
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
                    <FieldHint id="is-shared-hint">
                      Si es compartido, el reparto define cuánto asume cada persona aunque haya pagado uno solo.
                    </FieldHint>

                    {form.isShared && (
                      <>
                        <FormGroup className="!mb-0">
                          <Label htmlFor="split-preset">{splitDistributionLabel(form.type)}</Label>
                          <Select
                            id="split-preset"
                            value={splitPreset}
                            onChange={(e) => handleSplitPreset(e.target.value)}
                            aria-describedby={describedBy(errors.share && 'share-error', previewText && 'reparto-preview')}
                          >
                            {SPLIT_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </Select>
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
                                aria-describedby={describedBy(errors.share && 'share-error', previewText && 'reparto-preview')}
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
                                aria-describedby={describedBy(errors.share && 'share-error', previewText && 'reparto-preview')}
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
                  <p id="reparto-preview" className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {previewText}
                  </p>
                )}
              </div>
            )}
            </FormGroup>
          )}

          <FormGroup className="mt-4">
            <Label htmlFor="date">Fecha</Label>
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

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1" aria-live="polite">
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
