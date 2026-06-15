/* Hallmark · genre: modern-minimal · macrostructure: Workbench
 * design-system: DESIGN.md · designed-as-app · enrichment: none
 * pre-emit critique: P5 H4 E5 S5 R5 V4 */
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useMovements, useCategories, useSettings, useBudgets, useBudgetMutations } from '@/hooks/useData'
import { CurrencyAmountInput } from '@/components/CurrencyAmountInput'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { Card, EmptyState } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/ChoiceChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button, Label, FormGroup, FieldHint } from '@/components/ui/Form'
import {
  buildBudgetProgress,
  getBudgetAmountInView,
  getBudgetMonthKey,
  shiftBudgetMonth,
} from '@/lib/budget'
import { formatInViewCurrency, getCurrencyConfig } from '@/lib/currency'
import { formatMonthLabel, cn, formatCurrency } from '@/lib/utils'
import type { BudgetProgressStatus, Category, CategoryBudget, CategoryBudgetProgress } from '@/types'

function overallBudgetStatus(
  totalBudgeted: number,
  totalSpent: number,
  totalRemaining: number,
): BudgetProgressStatus {
  if (totalBudgeted <= 0) return 'unbudgeted'
  if (totalRemaining < 0) return 'over'
  if (totalSpent / totalBudgeted >= 0.85) return 'near'
  return 'ok'
}

function percentStatusColorClass(status: BudgetProgressStatus): string {
  switch (status) {
    case 'near':
      return 'text-amber-600'
    case 'over':
      return 'text-red-600'
    case 'ok':
      return 'text-emerald-600'
    default:
      return 'text-stone-600'
  }
}

function categoryInitials(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

function CategoryAvatar({ name, color }: { name: string; color?: string }) {
  const initials = categoryInitials(name)
  const hasColor = Boolean(color)

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        hasColor ? 'text-white' : 'bg-surface-100 text-brand-700',
      )}
      style={hasColor ? { backgroundColor: color } : undefined}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function MonthNavigator({
  monthLabel,
  onPrevious,
  onNext,
}: {
  monthLabel: string
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-stone-200/80 bg-white p-0.5 shadow-sm shadow-stone-200/30">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        aria-label="Mes anterior"
        className="h-8 w-8 shrink-0 px-0"
      >
        ‹
      </Button>
      <span className="min-w-[6.5rem] px-1 text-center text-sm font-semibold tabular-nums text-stone-800">
        {monthLabel}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onNext}
        aria-label="Mes siguiente"
        className="h-8 w-8 shrink-0 px-0"
      >
        ›
      </Button>
    </div>
  )
}

export function BudgetPage({ embedded = false }: { embedded?: boolean }) {
  const movements = useMovements() ?? []
  const categories = useCategories() ?? []
  const settings = useSettings()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const [viewMonth, setViewMonth] = useState(() => getBudgetMonthKey(new Date()))
  const budgets = useBudgets() ?? []
  const { upsertBudget, deleteBudget } = useBudgetMutations()
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [addPickerOpen, setAddPickerOpen] = useState(false)

  useEffect(() => {
    setEditingCategoryId(null)
    setAddPickerOpen(false)
  }, [currencyConfig.displayCurrency, currencyConfig.exchangeRateUsd])

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  const budgetByCategory = useMemo(
    () => new Map(budgets.map((b) => [b.categoryId, b])),
    [budgets],
  )

  const budgetedCategories = useMemo(
    () => expenseCategories.filter((c) => budgetByCategory.has(c.id)),
    [expenseCategories, budgetByCategory],
  )

  const availableToAdd = useMemo(
    () => expenseCategories.filter((c) => !budgetByCategory.has(c.id)),
    [expenseCategories, budgetByCategory],
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

  const overallStatus = overallBudgetStatus(
    summary.totalBudgeted,
    summary.totalSpent,
    summary.totalRemaining,
  )
  const overallPercent =
    summary.totalBudgeted > 0 ? summary.totalSpent / summary.totalBudgeted : 0

  const editingCategory = useMemo(
    () => expenseCategories.find((c) => c.id === editingCategoryId) ?? null,
    [expenseCategories, editingCategoryId],
  )

  const handleSaveBudget = useCallback(
    async (categoryId: string, amount: number) => {
      setSavingCategoryId(categoryId)
      try {
        const existing = budgetByCategory.get(categoryId)
        if (amount <= 0) {
          if (existing) await deleteBudget(existing.id)
          setEditingCategoryId(null)
          return
        }
        await upsertBudget({
          categoryId,
          amount,
          currency: currencyConfig.displayCurrency,
          scope: 'couple',
        })
        setEditingCategoryId(null)
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
        setEditingCategoryId(null)
        return
      }
      setSavingCategoryId(categoryId)
      try {
        await deleteBudget(existing.id)
        setEditingCategoryId(null)
      } finally {
        setSavingCategoryId(null)
      }
    },
    [budgetByCategory, deleteBudget],
  )

  function handleCancelEdit() {
    setEditingCategoryId(null)
  }

  function handleSelectCategoryToAdd(categoryId: string) {
    setAddPickerOpen(false)
    setEditingCategoryId(categoryId)
  }

  const showAddFab = availableToAdd.length > 0 && !addPickerOpen && editingCategoryId === null

  const monthNavigator = (
    <MonthNavigator
      monthLabel={monthLabel}
      onPrevious={() => setViewMonth((m) => shiftBudgetMonth(m, -1))}
      onNext={() => setViewMonth((m) => shiftBudgetMonth(m, 1))}
    />
  )

  const editingStoredBudget = editingCategoryId ? budgetByCategory.get(editingCategoryId) : undefined
  const editingDisplayLimit = editingStoredBudget
    ? getBudgetAmountInView(editingStoredBudget, currencyConfig)
    : 0
  const editingIsDraft = Boolean(
    editingCategoryId && !budgetByCategory.has(editingCategoryId),
  )

  return (
    <div className={cn('min-w-0 space-y-6', !embedded && 'mx-auto max-w-2xl')}>
      {embedded ? (
        <PageHeader
          title="Presupuesto"
          subtitle={`Límites fijos · gastos compartidos de ${monthLabel}`}
          trailing={monthNavigator}
        />
      ) : (
        <PageHeader
          title="Presupuesto"
          subtitle={`Límites fijos · gastos compartidos de ${monthLabel}`}
          trailing={monthNavigator}
        />
      )}

      <div className="space-y-2">
        <SectionHeader label="Resumen del mes">
          {summary.totalBudgeted > 0 && (
            <span
              className={cn(
                'text-base font-bold tabular-nums',
                percentStatusColorClass(overallStatus),
              )}
            >
              {Math.round(overallPercent * 100)}%
            </span>
          )}
        </SectionHeader>
        <Card compact className="space-y-2">
          {summary.totalBudgeted > 0 ? (
            <>
              <p className="text-xs text-stone-500">
                <span className="font-medium tabular-nums text-stone-700">
                  {formatInViewCurrency(summary.totalSpent, currencyConfig)}
                </span>
                {' gastado de '}
                <span className="font-medium tabular-nums text-stone-700">
                  {formatInViewCurrency(summary.totalBudgeted, currencyConfig)}
                </span>
                {' · '}
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    summary.totalRemaining >= 0 ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {formatInViewCurrency(Math.abs(summary.totalRemaining), currencyConfig)}{' '}
                  {summary.totalRemaining >= 0 ? 'disponible' : 'excedido'}
                </span>
              </p>
              <BudgetProgressBar
                percentUsed={overallPercent}
                status={overallStatus}
              />
            </>
          ) : (
            <p className="text-xs text-stone-500">
              {summary.totalSpent > 0 ? (
                <>
                  <span className="font-medium tabular-nums text-stone-700">
                    {formatInViewCurrency(summary.totalSpent, currencyConfig)}
                  </span>
                  {' gastado · sin límite definido'}
                </>
              ) : (
                'Sin presupuesto definido'
              )}
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-2">
        <SectionHeader
          label="Categorías presupuestadas"
          className={budgetedCategories.length === 0 ? 'mb-0' : undefined}
        />

        {expenseCategories.length === 0 ? (
          <EmptyState
            title="Sin categorías de gasto"
            description="Creá categorías de gasto en Ajustes para definir presupuestos."
          />
        ) : budgetedCategories.length === 0 ? (
          <EmptyState
            title="Sin categorías presupuestadas"
            description={
              availableToAdd.length > 0
                ? 'Tocá + Agregar categoría para definir un límite fijo para la pareja.'
                : 'Todas las categorías de gasto ya tienen presupuesto asignado.'
            }
          />
        ) : (
          <div className="space-y-3">
            {budgetedCategories.map((category) => {
              const existing = budgetByCategory.get(category.id)
              const progress = progressByCategory.get(category.id)
              const displayLimit = existing ? getBudgetAmountInView(existing, currencyConfig) : 0
              return (
                <BudgetCategoryCard
                  key={category.id}
                  categoryName={category.name}
                  color={category.color}
                  displayLimit={displayLimit}
                  progress={progress}
                  currencyConfig={currencyConfig}
                  saving={savingCategoryId === category.id}
                  onStartEdit={() => setEditingCategoryId(category.id)}
                  onRemove={() => void handleRemoveCategory(category.id)}
                />
              )
            })}
          </div>
        )}
      </div>

      {showAddFab && (
        <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 md:max-w-2xl">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => setAddPickerOpen(true)}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-5 py-3 shadow-lg shadow-brand-600/20"
            >
              <span aria-hidden="true" className="text-base leading-none">
                +
              </span>
              Agregar categoría
            </Button>
          </div>
        </div>
      )}

      <BudgetAddCategoryDialog
        open={addPickerOpen}
        categories={availableToAdd}
        onClose={() => setAddPickerOpen(false)}
        onSelect={handleSelectCategoryToAdd}
      />

      {editingCategory && (
        <BudgetLimitDialog
          open={editingCategoryId !== null}
          categoryName={editingCategory.name}
          categoryColor={editingCategory.color}
          displayLimit={editingDisplayLimit}
          storedBudget={editingStoredBudget}
          currencyConfig={currencyConfig}
          saving={savingCategoryId === editingCategoryId}
          isDraft={editingIsDraft}
          onClose={handleCancelEdit}
          onSave={(amount) => void handleSaveBudget(editingCategory.id, amount)}
        />
      )}
    </div>
  )
}

function BudgetCategoryCard({
  categoryName,
  color,
  displayLimit,
  progress,
  currencyConfig,
  saving,
  onStartEdit,
  onRemove,
}: {
  categoryName: string
  color?: string
  displayLimit: number
  progress?: CategoryBudgetProgress
  currencyConfig: ReturnType<typeof getCurrencyConfig>
  saving: boolean
  onStartEdit: () => void
  onRemove: () => void
}) {
  const hasLimit = displayLimit > 0
  const spent = progress?.spent ?? 0
  const remaining = hasLimit ? displayLimit - spent : 0

  return (
    <Card compact>
      <div className="flex items-start gap-3">
        <CategoryAvatar name={categoryName} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-800">{categoryName}</p>
            </div>
            {hasLimit && progress && (
              <span
                className={cn(
                  'shrink-0 text-base font-bold tabular-nums',
                  percentStatusColorClass(progress.status),
                )}
              >
                {Math.round(progress.percentUsed * 100)}%
              </span>
            )}
          </div>

          {hasLimit && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-stone-500">
                <span className="font-medium tabular-nums text-stone-700">
                  {formatInViewCurrency(spent, currencyConfig)}
                </span>
                {' gastado de '}
                <span className="font-medium tabular-nums text-stone-700">
                  {formatInViewCurrency(displayLimit, currencyConfig)}
                </span>
                {' · '}
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    remaining >= 0 ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {formatInViewCurrency(Math.abs(remaining), currencyConfig)}{' '}
                  {remaining >= 0 ? 'disponible' : 'excedido'}
                </span>
              </p>

              {progress && (
                <BudgetProgressBar
                  percentUsed={progress.percentUsed}
                  status={progress.status}
                  color={color}
                />
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onStartEdit}
              className="min-w-0 flex-1"
            >
              Editar límite
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={saving}
              className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Quitar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function BudgetAddCategoryDialog({
  open,
  categories,
  onClose,
  onSelect,
}: {
  open: boolean
  categories: Category[]
  onClose: () => void
  onSelect: (categoryId: string) => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Agregar categoría"
      description="Elegí una categoría de gasto para definir su límite mensual."
    >
      <ChoiceChipGroup
        label="Categorías disponibles"
        labelId="add-budget-picker-label"
        className="flex flex-wrap gap-2"
      >
        {categories.map((category) => (
          <ChoiceChip
            key={category.id}
            size="sm"
            shape="pill"
            className="inline-flex items-center gap-1.5"
            onClick={() => onSelect(category.id)}
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
      </ChoiceChipGroup>
    </Dialog>
  )
}

function BudgetLimitDialog({
  open,
  categoryName,
  categoryColor,
  displayLimit,
  storedBudget,
  currencyConfig,
  saving,
  isDraft,
  onClose,
  onSave,
}: {
  open: boolean
  categoryName: string
  categoryColor?: string
  displayLimit: number
  storedBudget?: CategoryBudget
  currencyConfig: ReturnType<typeof getCurrencyConfig>
  saving: boolean
  isDraft: boolean
  onClose: () => void
  onSave: (amount: number) => void
}) {
  const [draftAmount, setDraftAmount] = useState(displayLimit)
  const hasLimit = displayLimit > 0

  useEffect(() => {
    if (open) setDraftAmount(displayLimit)
  }, [open, displayLimit])

  const storedCurrencyHint =
    storedBudget &&
    storedBudget.currency !== currencyConfig.displayCurrency &&
    hasLimit
      ? `Guardado originalmente como ${formatCurrency(storedBudget.amount, storedBudget.currency)}`
      : null

  const title = isDraft || !hasLimit ? 'Definir límite' : 'Editar límite'

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      title={title}
      description={`Límite fijo mensual para ${categoryName}.`}
      closeOnBackdrop={!saving}
    >
      <div className="flex items-center gap-3">
        <CategoryAvatar name={categoryName} color={categoryColor} />
        <p className="min-w-0 truncate font-semibold text-stone-800">{categoryName}</p>
      </div>

      <FormGroup className="mt-4 mb-0">
        <Label htmlFor="budget-limit-amount">
          Monto del límite {saving ? '· guardando…' : ''}
        </Label>
        <CurrencyAmountInput
          id="budget-limit-amount"
          currency={currencyConfig.displayCurrency}
          value={draftAmount}
          autoFocus
          onChange={setDraftAmount}
        />
        {storedCurrencyHint && <FieldHint>{storedCurrencyHint}</FieldHint>}
      </FormGroup>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          disabled={saving}
          onClick={() => onSave(draftAmount)}
          className="min-w-0 flex-1"
        >
          Guardar
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={saving}
          onClick={onClose}
          className="shrink-0"
        >
          Cancelar
        </Button>
      </div>
    </Dialog>
  )
}
