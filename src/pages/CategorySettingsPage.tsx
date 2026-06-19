import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useDataMutations } from '@/hooks/useData'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { SettingsSection } from '@/components/ui/SettingsSection'
import { Button, Input, Select, Label, StatusMessage, LiveRegion } from '@/components/ui/Form'
import type { Category, CategoryType } from '@/types'

export function CategorySettingsPage() {
  const navigate = useNavigate()
  const categories = useCategories() ?? []
  const { addCategory, updateCategory, deleteCategory } = useDataMutations()
  const { confirm, dialog } = useConfirmDialog()
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense')
  const [categoryMessage, setCategoryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<CategoryType>('expense')
  const [editColor, setEditColor] = useState('#64748b')

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
    </div>
  )
}
