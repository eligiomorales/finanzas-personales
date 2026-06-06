import { useMemo, useState, useCallback, useEffect } from 'react'
import { useMovements, useCategories, useSettings, useBudgets, useBudgetMutations } from '@/hooks/useData'
import { CurrencyAmountInput } from '@/components/CurrencyAmountInput'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { Card, EmptyState, StatCard } from '@/components/ui/Card'
import { Button, Select, Label } from '@/components/ui/Form'
import {
  buildBudgetProgress,
  budgetStatusLabel,
  getBudgetAmountInView,
  getBudgetMonthKey,
  shiftBudgetMonth,
} from '@/lib/budget'
import { formatInViewCurrency, getCurrencyConfig } from '@/lib/currency'
import { formatMonthLabel, cn, formatCurrency } from '@/lib/utils'
import type { CategoryBudget, CategoryBudgetProgress } from '@/types'

export function BudgetPage() {
  const movements = useMovements() ?? []
  const categories = useCategories() ?? []
  const settings = useSettings()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const [viewMonth, setViewMonth] = useState(() => getBudgetMonthKey(new Date()))
  const budgets = useBudgets() ?? []
  const { upsertBudget, deleteBudget } = useBudgetMutations()
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null)
  const [pickerCategoryId, setPickerCategoryId] = useState('')

  useEffect(() => {
    setEditingCategoryId(null)
    setDraftCategoryId(null)
  }, [currencyConfig.displayCurrency, currencyConfig.exchangeRateUsd])

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  const budgetByCategory = useMemo(
    () => new Map(budgets.map((b) => [b.categoryId, b])),
    [budgets],
  )

  const budgetedCategories = useMemo(() => {
    const ids = new Set(budgets.map((b) => b.categoryId))
    if (draftCategoryId) ids.add(draftCategoryId)
    return expenseCategories.filter((c) => ids.has(c.id))
  }, [budgets, draftCategoryId, expenseCategories])

  const availableToAdd = useMemo(
    () => expenseCategories.filter((c) => !budgetByCategory.has(c.id) && c.id !== draftCategoryId),
    [expenseCategories, budgetByCategory, draftCategoryId],
  )

  const summary = useMemo(
    () =>
      buildBudgetProgress({
        budgets,
        movements,
        categories,
        currencyConfig,
        yearMonth: viewMonth,
      }),
    [budgets, movements, categories, currencyConfig, viewMonth],
  )

  const progressByCategory = useMemo(
    () => new Map(summary.categories.map((c) => [c.categoryId, c])),
    [summary.categories],
  )

  const monthLabel = useMemo(() => formatMonthLabel(`${viewMonth}-01`), [viewMonth])

  const handleSaveBudget = useCallback(
    async (categoryId: string, amount: number) => {
      setSavingCategoryId(categoryId)
      try {
        const existing = budgetByCategory.get(categoryId)
        if (amount <= 0) {
          if (existing) await deleteBudget(existing.id)
          setEditingCategoryId(null)
          setDraftCategoryId(null)
          return
        }
        await upsertBudget({
          categoryId,
          amount,
          currency: currencyConfig.displayCurrency,
          scope: 'couple',
        })
        setEditingCategoryId(null)
        setDraftCategoryId(null)
      } finally {
        setSavingCategoryId(null)
      }
    },
    [budgetByCategory, deleteBudget, upsertBudget, currencyConfig.displayCurrency],
  )

  const handleRemoveCategory = useCallback(
    async (categoryId: string) => {
      const existing = budgetByCategory.get(categoryId)
      if (!existing) {
        setDraftCategoryId(null)
        setEditingCategoryId(null)
        return
      }
      setSavingCategoryId(categoryId)
      try {
        await deleteBudget(existing.id)
        setEditingCategoryId(null)
        setDraftCategoryId(null)
      } finally {
        setSavingCategoryId(null)
      }
    },
    [budgetByCategory, deleteBudget],
  )

  function handleAddCategory() {
    if (!pickerCategoryId) return
    setDraftCategoryId(pickerCategoryId)
    setEditingCategoryId(pickerCategoryId)
    setPickerCategoryId('')
  }

  return (
    <div className="space-y-4">
      <div className="-mx-4 space-y-2 border-b border-slate-200 px-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Presupuesto</h2>
            <p className="text-xs text-slate-500">Límites fijos · gastos compartidos de {monthLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => shiftBudgetMonth(m, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <span className="min-w-[7rem] text-center text-sm font-semibold text-slate-800">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => shiftBudgetMonth(m, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Presupuesto"
          value={formatInViewCurrency(summary.totalBudgeted, currencyConfig)}
        />
        <StatCard
          label="Gastado"
          value={formatInViewCurrency(summary.totalSpent, currencyConfig)}
          variant="expense"
        />
        <StatCard
          label="Restante"
          value={formatInViewCurrency(summary.totalRemaining, currencyConfig)}
          variant={summary.totalRemaining >= 0 ? 'income' : 'expense'}
        />
      </div>

      {availableToAdd.length > 0 && (
        <Card compact>
          <Label htmlFor="add-budget-category">Agregar categoría al presupuesto</Label>
          <div className="mt-2 flex gap-2">
            <Select
              id="add-budget-category"
              className="min-w-0 flex-1"
              value={pickerCategoryId}
              onChange={(e) => setPickerCategoryId(e.target.value)}
            >
              <option value="">Elegir categoría…</option>
              {availableToAdd.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" disabled={!pickerCategoryId} onClick={handleAddCategory}>
              Agregar
            </Button>
          </div>
        </Card>
      )}

      {expenseCategories.length === 0 ? (
        <EmptyState
          title="Sin categorías de gasto"
          description="Creá categorías de gasto en Ajustes para definir presupuestos."
        />
      ) : budgetedCategories.length === 0 ? (
        <EmptyState
          title="Sin categorías presupuestadas"
          description="Agregá las categorías en las que querés poner un límite fijo para la pareja."
        />
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-3 gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
            <span>Presupuesto</span>
            <span className="text-center">Gastado</span>
            <span className="text-right">Restante</span>
          </div>
          {budgetedCategories.map((category) => {
            const existing = budgetByCategory.get(category.id)
            const progress = progressByCategory.get(category.id)
            const displayLimit = existing ? getBudgetAmountInView(existing, currencyConfig) : 0
            const isDraft = draftCategoryId === category.id && !existing
            return (
              <BudgetCategoryCard
                key={category.id}
                categoryId={category.id}
                categoryName={category.name}
                color={category.color}
                storedBudget={existing}
                displayLimit={displayLimit}
                progress={progress}
                currencyConfig={currencyConfig}
                saving={savingCategoryId === category.id}
                editing={editingCategoryId === category.id}
                isDraft={isDraft}
                onStartEdit={() => setEditingCategoryId(category.id)}
                onCancelEdit={() => {
                  setEditingCategoryId(null)
                  if (isDraft) setDraftCategoryId(null)
                }}
                onSave={handleSaveBudget}
                onRemove={() => void handleRemoveCategory(category.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function BudgetCategoryCard({
  categoryId,
  categoryName,
  color,
  storedBudget,
  displayLimit,
  progress,
  currencyConfig,
  saving,
  editing,
  isDraft,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: {
  categoryId: string
  categoryName: string
  color?: string
  storedBudget?: CategoryBudget
  displayLimit: number
  progress?: CategoryBudgetProgress
  currencyConfig: ReturnType<typeof getCurrencyConfig>
  saving: boolean
  editing: boolean
  isDraft: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (categoryId: string, amount: number) => Promise<void>
  onRemove: () => void
}) {
  const [draftAmount, setDraftAmount] = useState(displayLimit)
  const hasLimit = displayLimit > 0
  const spent = progress?.spent ?? 0
  const remaining = hasLimit ? displayLimit - spent : 0

  useEffect(() => {
    if (editing) setDraftAmount(displayLimit)
  }, [editing, displayLimit])

  const storedCurrencyHint =
    storedBudget &&
    storedBudget.currency !== currencyConfig.displayCurrency &&
    hasLimit
      ? `Guardado originalmente como ${formatCurrency(storedBudget.amount, storedBudget.currency)}`
      : null

  return (
    <Card compact={!editing}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {color && (
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{categoryName}</p>
            {hasLimit && progress && (
              <p className="text-xs text-slate-500">{budgetStatusLabel(progress.status)}</p>
            )}
          </div>
        </div>
        {hasLimit && progress && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
            {Math.round(progress.percentUsed * 100)}%
          </span>
        )}
      </div>

      {!editing && (
        <>
          <div className="mb-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                Presupuesto
              </p>
              <p className="font-semibold tabular-nums text-slate-900">
                {hasLimit ? formatInViewCurrency(displayLimit, currencyConfig) : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                Gastado
              </p>
              <p className="font-semibold tabular-nums text-red-700">
                {spent > 0 ? formatInViewCurrency(spent, currencyConfig) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                Restante
              </p>
              <p
                className={cn(
                  'font-semibold tabular-nums',
                  !hasLimit ? 'text-slate-400' : remaining >= 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {hasLimit ? formatInViewCurrency(remaining, currencyConfig) : '—'}
              </p>
            </div>
          </div>

          {hasLimit && progress && (
            <div className="mb-3">
              <BudgetProgressBar
                percentUsed={progress.percentUsed}
                status={progress.status}
                color={color}
              />
            </div>
          )}

          {isDraft && (
            <p className="mb-3 text-xs text-brand-700">Definí el límite fijo para esta categoría.</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onStartEdit}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              {hasLimit ? 'Editar límite' : 'Definir límite'}
            </button>
            {!isDraft && (
              <button
                type="button"
                onClick={onRemove}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Quitar
              </button>
            )}
          </div>
        </>
      )}

      {editing && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="block text-xs font-medium text-slate-500" htmlFor={`budget-${categoryId}`}>
            Límite fijo {saving ? '· guardando…' : ''}
          </label>
          <CurrencyAmountInput
            id={`budget-${categoryId}`}
            currency={currencyConfig.displayCurrency}
            value={draftAmount}
            autoFocus
            onChange={setDraftAmount}
          />
          {storedCurrencyHint && (
            <p className="text-xs text-slate-400">{storedCurrencyHint}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave(categoryId, draftAmount)}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Guardar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onCancelEdit}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
