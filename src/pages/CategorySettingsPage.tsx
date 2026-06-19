import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useCategoryRules, useDataMutations, useMovements, useRuleMutations } from '@/hooks/useData'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { inferRulesFromHistory, type InferredRule } from '@/lib/infer-rules'
import { PageHeader } from '@/components/ui/PageHeader'
import { SettingsSection } from '@/components/ui/SettingsSection'
import { Button, Input, Select, Label, StatusMessage, LiveRegion } from '@/components/ui/Form'
import type { Category, CategoryType } from '@/types'

export function CategorySettingsPage() {
  const navigate = useNavigate()
  const categories = useCategories() ?? []
  const categoryRules = useCategoryRules() ?? []
  const movements = useMovements() ?? []
  const { addCategory, updateCategory, deleteCategory } = useDataMutations()
  const { addRule, deleteRule } = useRuleMutations()
  const { confirm, dialog } = useConfirmDialog()
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense')
  const [categoryMessage, setCategoryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<CategoryType>('expense')
  const [editColor, setEditColor] = useState('#64748b')
  const [newRuleKeyword, setNewRuleKeyword] = useState('')
  const [newRuleCategoryId, setNewRuleCategoryId] = useState('')
  const [ruleMessage, setRuleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addingRule, setAddingRule] = useState(false)
  const [inferPreviewOpen, setInferPreviewOpen] = useState(false)
  const [inferredRules, setInferredRules] = useState<InferredRule[]>([])
  const [selectedInferredKeys, setSelectedInferredKeys] = useState<Set<string>>(new Set())
  const [savingInferred, setSavingInferred] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  function inferredRuleKey(rule: InferredRule) {
    return `${rule.keyword}:${rule.categoryId}`
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCatName.trim()
    if (!name) {
      setCategoryMessage({ type: 'error', text: 'Ingresá un nombre para la categoría.' })
      return
    }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setCategoryMessage({ type: 'error', text: 'Ya existe una categoría con ese nombre.' })
      return
    }

    setAddingCategory(true)
    setCategoryMessage(null)
    try {
      await addCategory(name, newCatType, newCatType === 'income' ? '#22c55e' : '#64748b')
      setNewCatName('')
      setCategoryMessage({ type: 'success', text: `Categoría "${name}" agregada.` })
      setTimeout(() => setCategoryMessage(null), 2500)
    } catch (err) {
      setCategoryMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo agregar la categoría.',
      })
    } finally {
      setAddingCategory(false)
    }
  }

  function startEditCategory(category: Category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditType(category.type)
    setEditColor(category.color ?? '#64748b')
  }

  function cancelEditCategory() {
    setEditingId(null)
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editName.trim()) return
    await updateCategory(editingId, {
      name: editName.trim(),
      type: editType,
      color: editColor,
    })
    setEditingId(null)
  }

  async function handleDeleteCategory(id: string) {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      description:
        'Los movimientos que usen esta categoría quedarán sin categoría. ¿Querés continuar?',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    await deleteCategory(id)
    if (editingId === id) setEditingId(null)
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    const keyword = newRuleKeyword.trim()
    if (!keyword) {
      setRuleMessage({ type: 'error', text: 'Ingresá una palabra clave.' })
      return
    }
    if (!newRuleCategoryId) {
      setRuleMessage({ type: 'error', text: 'Elegí una categoría.' })
      return
    }

    setAddingRule(true)
    setRuleMessage(null)
    try {
      await addRule(keyword, newRuleCategoryId)
      setNewRuleKeyword('')
      setRuleMessage({ type: 'success', text: 'Regla guardada.' })
      setTimeout(() => setRuleMessage(null), 2500)
    } catch (err) {
      setRuleMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo guardar la regla.',
      })
    } finally {
      setAddingRule(false)
    }
  }

  async function handleDeleteRule(id: string) {
    const confirmed = await confirm({
      title: 'Eliminar regla',
      description: 'Esta regla dejará de aplicarse en futuras importaciones.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    await deleteRule(id)
  }

  function categoryName(categoryId: string) {
    return categories.find((c) => c.id === categoryId)?.name ?? 'Categoría eliminada'
  }

  function handleSuggestFromHistory() {
    const suggestions = inferRulesFromHistory(movements, categoryRules, categories)
    setInferredRules(suggestions)
    setSelectedInferredKeys(new Set(suggestions.map(inferredRuleKey)))
    setInferPreviewOpen(true)
    setRuleMessage(null)
  }

  function toggleInferredSelection(key: string) {
    setSelectedInferredKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSaveSelectedInferred() {
    const selected = inferredRules.filter((rule) => selectedInferredKeys.has(inferredRuleKey(rule)))
    if (selected.length === 0) {
      setRuleMessage({ type: 'error', text: 'Seleccioná al menos una regla.' })
      return
    }

    setSavingInferred(true)
    setRuleMessage(null)
    try {
      for (const rule of selected) {
        await addRule(rule.keyword, rule.categoryId)
      }
      setRuleMessage({
        type: 'success',
        text: `${selected.length} regla(s) guardada(s).`,
      })
      setInferPreviewOpen(false)
      setInferredRules([])
      setSelectedInferredKeys(new Set())
      setTimeout(() => setRuleMessage(null), 2500)
    } catch (err) {
      setRuleMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudieron guardar las reglas.',
      })
    } finally {
      setSavingInferred(false)
    }
  }

  const selectedInferredCount = useMemo(
    () => inferredRules.filter((rule) => selectedInferredKeys.has(inferredRuleKey(rule))).length,
    [inferredRules, selectedInferredKeys],
  )

  return (
    <div className="space-y-6">
      {dialog}
      <LiveRegion>{categoryMessage?.text ?? ''}</LiveRegion>

      <PageHeader
        title="Categorías"
        leading={
          <button
            type="button"
            onClick={() => navigate('/configuracion')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base text-stone-600 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
            aria-label="Volver a configuración"
          >
            ←
          </button>
        }
      />

      <SettingsSection
        title="Gestionar categorías"
        description="La pantalla Categorías de la navegación principal queda reservada para el análisis de gastos."
      >
        <form onSubmit={handleAddCategory} className="mb-4 rounded-lg border border-stone-200 bg-white p-3">
          <Label htmlFor="settings-new-category-name">Agregar categoría</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="settings-new-category-name"
              placeholder="Nombre, ej. Mascotas"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="min-w-0 flex-1"
              disabled={addingCategory}
              aria-describedby="settings-category-message"
            />
            <Select
              id="settings-new-category-type"
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
              className="sm:w-32"
              disabled={addingCategory}
              aria-label="Tipo de categoría"
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </Select>
            <Button type="submit" size="sm" disabled={addingCategory} className="sm:shrink-0">
              {addingCategory ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
          {categoryMessage && (
            <StatusMessage id="settings-category-message" tone={categoryMessage.type}>
              {categoryMessage.text}
            </StatusMessage>
          )}
        </form>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-lg bg-surface-50 px-3 py-2">
              {editingId === cat.id ? (
                <form onSubmit={handleSaveCategory} className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id={`edit-category-name-${cat.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-w-0 flex-1"
                      aria-label="Nombre de categoría"
                      autoFocus
                    />
                    <Select
                      id={`edit-category-type-${cat.id}`}
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as CategoryType)}
                      className="w-28"
                      aria-label="Tipo de categoría"
                    >
                      <option value="expense">Gasto</option>
                      <option value="income">Ingreso</option>
                    </Select>
                    <Input
                      id={`edit-category-color-${cat.id}`}
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer p-1"
                      aria-label="Color de categoría"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Guardar
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={cancelEditCategory}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {cat.color && (
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    )}
                    <span className="truncate text-sm font-medium">{cat.name}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEditCategory(cat)}>
                      Editar
                    </Button>
                    {!cat.id.startsWith('cat-') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reglas de categorización"
        description="Si la descripción de un movimiento importado contiene la palabra clave, se asigna la categoría automáticamente."
      >
        <form onSubmit={handleAddRule} className="mb-4 rounded-lg border border-stone-200 bg-white p-3">
          <Label htmlFor="settings-new-rule-keyword">Agregar regla</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="settings-new-rule-keyword"
              placeholder="Palabra clave, ej. farmacity"
              value={newRuleKeyword}
              onChange={(e) => setNewRuleKeyword(e.target.value)}
              className="min-w-0 flex-1"
              disabled={addingRule}
              aria-describedby="settings-rule-message"
            />
            <Select
              id="settings-new-rule-category"
              value={newRuleCategoryId}
              onChange={(e) => setNewRuleCategoryId(e.target.value)}
              className="sm:w-40"
              disabled={addingRule}
              aria-label="Categoría de la regla"
            >
              <option value="">Categoría</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" disabled={addingRule} className="sm:shrink-0">
              {addingRule ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
          {ruleMessage && (
            <StatusMessage id="settings-rule-message" tone={ruleMessage.type}>
              {ruleMessage.text}
            </StatusMessage>
          )}
        </form>

        <div className="mb-4">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleSuggestFromHistory}
            disabled={movements.length === 0 || savingInferred}
          >
            Sugerir desde historial
          </Button>
        </div>

        {inferPreviewOpen && (
          <div className="mb-4 rounded-lg border border-stone-200 bg-white p-3">
            {inferredRules.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-stone-500">No se encontraron patrones nuevos.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setInferPreviewOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-stone-700">
                  Reglas sugeridas ({inferredRules.length})
                </p>
                <div className="space-y-2">
                  {inferredRules.map((rule) => {
                    const key = inferredRuleKey(rule)
                    const checked = selectedInferredKeys.has(key)
                    const dominancePct = Math.round(rule.dominance * 100)
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-2 rounded-lg bg-surface-50 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInferredSelection(key)}
                          className="mt-1"
                          disabled={savingInferred}
                        />
                        <span className="min-w-0 text-sm text-stone-800">
                          &quot;{rule.keyword}&quot; → {rule.categoryName}{' '}
                          <span className="text-stone-500">
                            ({rule.count} usos, {dominancePct}%)
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSelectedInferred}
                    disabled={savingInferred || selectedInferredCount === 0}
                  >
                    {savingInferred
                      ? 'Guardando...'
                      : `Guardar seleccionadas (${selectedInferredCount})`}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setInferPreviewOpen(false)}
                    disabled={savingInferred}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {categoryRules.length === 0 ? (
          <p className="text-sm text-stone-500">Todavía no hay reglas. Podés crearlas acá o al corregir una importación.</p>
        ) : (
          <div className="space-y-2">
            {categoryRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-800">
                    &quot;{rule.keyword}&quot; → {categoryName(rule.categoryId)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-red-600"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  )
}
