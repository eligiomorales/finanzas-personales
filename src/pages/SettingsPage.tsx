import { useState, useEffect } from 'react'
import { useCategories, useSettings, useDataMutations, useDatabaseStats } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useAuth } from '@/contexts/AuthContext'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { expenseViewModeLabel, type ExpenseViewMode } from '@/lib/expense-view-mode'
import { cn } from '@/lib/utils'
import { useDataContext } from '@/contexts/DataContext'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { resetDatabase } from '@/db/seed'
import {
  downloadBackup,
  exportDatabase,
  exportDatabaseFromRepositories,
  getLastBackupAt,
  getBackupReminderStatus,
  importDatabase,
} from '@/lib/backup'
import { migrateLocalToRemote, previewLocalMigration, type MigrationPreview } from '@/lib/migration/local-to-remote'
import { formatDate } from '@/lib/utils'
import { formatInviteCodeStatus, getInviteCodeStatus } from '@/lib/couple/invite-code'
import type { DatabaseBackup } from '@/lib/backup'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button, Input, Select, Label, FormGroup, StatusMessage, LiveRegion } from '@/components/ui/Form'
import type { Category, CategoryType } from '@/types'

export function SettingsPage() {
  const { configured, membership, signOut, user, regenerateInviteCode, revokeInviteCode } = useAuth()
  const { mode, repos, coupleId } = useDataContext()
  const settings = useSettings()
  const categories = useCategories() ?? []
  const stats = useDatabaseStats()
  const {
    updateSettings,
    updateDisplayName,
    updateExchangeRate,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useDataMutations()
  const { confirm, dialog } = useConfirmDialog()
  const persons = useCouplePersons()
  const { mode: expenseViewMode, setMode: setExpenseViewMode } = useExpenseViewMode()
  const [myDisplayName, setMyDisplayName] = useState('')
  const [personAName, setPersonAName] = useState('')
  const [personBName, setPersonBName] = useState('')
  const [defaultExchangeRateUsd, setDefaultExchangeRateUsd] = useState('1200')
  const [currencySaved, setCurrencySaved] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense')
  const [categoryMessage, setCategoryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<CategoryType>('expense')
  const [editColor, setEditColor] = useState('#64748b')
  const [saved, setSaved] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => getLastBackupAt())
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreview | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null)
  const [inviteActionMessage, setInviteActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [inviteActionLoading, setInviteActionLoading] = useState(false)
  const backupReminder = getBackupReminderStatus(lastBackupAt)

  const inviteStatus =
    membership &&
    getInviteCodeStatus(membership.inviteCodeExpiresAt, membership.memberCount)

  const canManageInviteCode =
    inviteStatus === 'active' || inviteStatus === 'no_expiry' || inviteStatus === 'expired'

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    if (settings) {
      setDefaultExchangeRateUsd(String(settings.defaultExchangeRateUsd ?? 1200))
    }
  }, [settings])

  useEffect(() => {
    if (mode === 'remote') {
      setMyDisplayName(persons.myName)
      return
    }
    if (settings) {
      setPersonAName(settings.personAName)
      setPersonBName(settings.personBName)
    }
  }, [mode, persons.myName, settings])

  useEffect(() => {
    if (mode !== 'remote' || !coupleId) return
    previewLocalMigration(repos, coupleId).then(setMigrationPreview).catch(() => setMigrationPreview(null))
  }, [mode, coupleId, repos, stats?.total])

  async function handleRegenerateInviteCode() {
    const confirmed = await confirm({
      title: 'Regenerar código de invitación',
      description:
        'Se generará un código nuevo con vencimiento en 7 días. El código anterior dejará de funcionar de inmediato.',
      confirmLabel: 'Regenerar',
    })
    if (!confirmed) return

    setInviteActionLoading(true)
    setInviteActionMessage(null)
    try {
      await regenerateInviteCode()
      setInviteActionMessage({
        type: 'success',
        text: 'Código regenerado. Compartilo con tu pareja antes de que venza.',
      })
    } catch (error) {
      setInviteActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo regenerar el código',
      })
    } finally {
      setInviteActionLoading(false)
    }
  }

  async function handleRevokeInviteCode() {
    const confirmed = await confirm({
      title: 'Revocar código de invitación',
      description:
        'Nadie podrá unirse con el código actual. Podés regenerar uno nuevo más adelante si hace falta.',
      confirmLabel: 'Revocar',
      variant: 'danger',
    })
    if (!confirmed) return

    setInviteActionLoading(true)
    setInviteActionMessage(null)
    try {
      await revokeInviteCode()
      setInviteActionMessage({ type: 'success', text: 'Código revocado.' })
    } catch (error) {
      setInviteActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo revocar el código',
      })
    } finally {
      setInviteActionLoading(false)
    }
  }

  async function handleMigrateToCloud() {
    if (!coupleId) return
    const confirmed = await confirm({
      title: 'Migrar datos locales',
      description:
        'Se subirán los movimientos de IndexedDB de este navegador a la cuenta compartida. Los duplicados se omiten si ya migraste antes.',
      confirmLabel: 'Migrar',
      cancelLabel: 'Cancelar',
    })
    if (!confirmed) return

    setMigrating(true)
    setMigrationMessage(null)
    try {
      await migrateLocalToRemote(coupleId)
      const preview = await previewLocalMigration(repos, coupleId)
      setMigrationPreview(preview)
      setMigrationMessage('Migración completada. Los datos ya están en la nube.')
    } catch (err) {
      setMigrationMessage(err instanceof Error ? err.message : 'Error al migrar')
    } finally {
      setMigrating(false)
    }
  }

  async function handleSaveNames(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'remote') {
      if (!myDisplayName.trim() || !user?.id || !membership || !coupleId) return
      await updateDisplayName(user.id, coupleId, membership.role, myDisplayName.trim())
      await persons.refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    if (!personAName.trim() || !personBName.trim()) return
    await updateSettings(personAName.trim(), personBName.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSaveCurrency(e: React.FormEvent) {
    e.preventDefault()
    const rate = parseFloat(defaultExchangeRateUsd)
    if (!rate || rate <= 0) return
    await updateExchangeRate(rate)
    setCurrencySaved(true)
    setTimeout(() => setCurrencySaved(false), 2000)
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

  async function handleReset() {
    const confirmed = await confirm({
      title: 'Restablecer todos los datos',
      description:
        'Se borrarán movimientos, importaciones y se cargarán datos de ejemplo. Esta acción no se puede deshacer.',
      confirmLabel: 'Restablecer',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return
    await resetDatabase()
    window.location.reload()
  }

  async function handleExport() {
    const backup =
      mode === 'remote' ? await exportDatabaseFromRepositories(repos) : await exportDatabase()
    downloadBackup(backup)
    setLastBackupAt(backup.exportedAt)
    setBackupMessage('Backup exportado correctamente.')
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = await confirm({
      title: 'Importar backup',
      description:
        'Importar reemplazará todos los datos locales de este navegador. ¿Querés continuar?',
      confirmLabel: 'Importar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) {
      e.target.value = ''
      return
    }

    setImporting(true)
    setBackupMessage(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as DatabaseBackup
      await importDatabase(data)
      setBackupMessage('Datos importados. Recargando...')
      window.location.reload()
    } catch (err) {
      setBackupMessage(err instanceof Error ? err.message : 'No se pudo importar el backup')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {dialog}
      <LiveRegion>{backupMessage ?? categoryMessage?.text ?? ''}</LiveRegion>

      <h2 className="text-xl font-bold">Configuración</h2>

      {backupReminder.neverExported && (
        <Alert tone="warning" title="Todavía no exportaste un backup">
          Tus datos viven solo en este navegador. Exportá un backup JSON para no perder movimientos si
          cambiás de dispositivo o borrás el historial.
          <div className="mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
              Exportar backup ahora
            </Button>
          </div>
        </Alert>
      )}

      {!backupReminder.neverExported && backupReminder.overdue && (
        <Alert tone="warning" title="Hace tiempo que no exportás un backup">
          Pasaron {backupReminder.daysSince} días desde el último backup
          {lastBackupAt ? ` (${formatDate(lastBackupAt.slice(0, 10))})` : ''}. Te recomendamos exportar
          uno nuevo para tener una copia reciente.
          <div className="mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
              Exportar backup ahora
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <h3 className="mb-2 font-semibold">Cuenta y sincronización</h3>
        {configured && user ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="text-slate-500">Sesión:</span> {user.email}
            </p>
            {membership && (
              <div className="space-y-2">
                <p>
                  <span className="text-slate-500">Código de invitación:</span>{' '}
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-base tracking-wider">
                    {membership.inviteCode}
                  </code>
                </p>
                <p className="text-slate-600">
                  {formatInviteCodeStatus(membership.inviteCodeExpiresAt, membership.memberCount)}
                </p>
                {canManageInviteCode && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={inviteActionLoading}
                      onClick={() => void handleRegenerateInviteCode()}
                    >
                      Regenerar código
                    </Button>
                    {inviteStatus !== 'expired' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={inviteActionLoading}
                        onClick={() => void handleRevokeInviteCode()}
                      >
                        Revocar código
                      </Button>
                    )}
                  </div>
                )}
                {inviteActionMessage && (
                  <StatusMessage tone={inviteActionMessage.type}>{inviteActionMessage.text}</StatusMessage>
                )}
              </div>
            )}
            <p className="text-slate-600">
              {mode === 'remote'
                ? 'Los movimientos se guardan en Supabase y se comparten entre navegadores.'
                : 'Modo local activo.'}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={() => signOut()}>
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Modo local sin Supabase. Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para sincronizar.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Visualización</h3>
        <p className="mb-3 text-sm text-slate-600">
          Personal: tus gastos + tu parte de los compartidos. Compartido: totales de la pareja.
        </p>
        <div
          role="radiogroup"
          aria-label="Modo de vista de gastos"
          className="flex gap-1 rounded-lg bg-slate-100 p-1"
        >
          {(['couple', 'personal'] as ExpenseViewMode[]).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={expenseViewMode === option}
              onClick={() => setExpenseViewMode(option)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100',
                expenseViewMode === option
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              )}
            >
              {expenseViewModeLabel(option)}
            </button>
          ))}
        </div>
      </Card>

      {mode === 'remote' && migrationPreview && (
        <Card>
          <h3 className="mb-2 font-semibold">Migrar datos locales a cuenta</h3>
          <p className="mb-3 text-sm text-slate-600">
            Subí los movimientos que tengas en IndexedDB de este navegador a la pareja compartida.
          </p>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-slate-700">Local (IndexedDB)</p>
              <p className="mt-1 text-slate-600">{migrationPreview.local.movements} movimientos</p>
              <p className="text-xs text-slate-500">
                {migrationPreview.local.incomes} ingresos · {migrationPreview.local.expenses} gastos ·{' '}
                {migrationPreview.local.settlements} liquidaciones
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-slate-700">Nube (pareja)</p>
              <p className="mt-1 text-slate-600">{migrationPreview.remote.movements} movimientos</p>
              <p className="text-xs text-slate-500">
                {migrationPreview.remote.incomes} ingresos · {migrationPreview.remote.expenses} gastos ·{' '}
                {migrationPreview.remote.settlements} liquidaciones
              </p>
            </div>
          </div>
          {migrationPreview.alreadyMigrated && (
            <p className="mb-3 text-xs text-amber-700">
              Ya migraste desde este navegador. Re-ejecutar solo agrega movimientos nuevos.
            </p>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleMigrateToCloud}
            disabled={migrating || migrationPreview.local.movements === 0}
          >
            {migrating ? 'Migrando…' : 'Migrar datos locales'}
          </Button>
          {migrationMessage && (
            <StatusMessage tone="info" className="mt-3">
              {migrationMessage}
            </StatusMessage>
          )}
        </Card>
      )}

      <Card>
        <h3 className="mb-4 font-semibold">Nombres en la pareja</h3>
        {mode === 'remote' ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Tu identidad queda vinculada a tu cuenta. Solo podés editar tu propio nombre; el de tu
              pareja se toma de su perfil.
            </p>
            <form onSubmit={handleSaveNames}>
              <FormGroup>
                <Label htmlFor="settings-my-name">Tu nombre</Label>
                <Input
                  id="settings-my-name"
                  value={myDisplayName}
                  onChange={(e) => setMyDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="settings-partner-name">Tu pareja</Label>
                <Input
                  id="settings-partner-name"
                  value={persons.partnerName}
                  readOnly
                  className="bg-slate-50"
                />
              </FormGroup>
              <Button type="submit" aria-live="polite" disabled={!myDisplayName.trim()}>
                {saved ? 'Guardado' : 'Guardar tu nombre'}
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSaveNames}>
            <p className="mb-4 text-sm text-slate-600">
              En modo local sin cuenta, podés definir los nombres manualmente.
            </p>
            <FormGroup>
              <Label htmlFor="settings-person-a">Persona A</Label>
              <Input
                id="settings-person-a"
                value={personAName}
                onChange={(e) => setPersonAName(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="settings-person-b">Persona B</Label>
              <Input
                id="settings-person-b"
                value={personBName}
                onChange={(e) => setPersonBName(e.target.value)}
              />
            </FormGroup>
            <Button type="submit" aria-live="polite">
              {saved ? 'Guardado' : 'Guardar nombres'}
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Tipo de cambio</h3>
        <p className="mb-4 text-sm text-slate-600">
          Una sola cotización para toda la app. Al cambiarla, se recalculan balances y totales.
        </p>
        <form
          onSubmit={handleSaveCurrency}
          className="grid grid-cols-[auto_minmax(9rem,1fr)] items-end gap-x-4 gap-y-2"
        >
          <Label className="mb-0">Moneda de visualización</Label>
          <Label htmlFor="settings-exchange-rate" className="mb-0">
            1 USD = X ARS
          </Label>
          <CurrencyToggle />
          <Input
            id="settings-exchange-rate"
            type="number"
            min="0"
            step="0.01"
            value={defaultExchangeRateUsd}
            onChange={(e) => setDefaultExchangeRateUsd(e.target.value)}
          />
          <div aria-hidden="true" />
          <Button type="submit" className="justify-self-start" aria-live="polite">
            {currencySaved ? 'Guardado' : 'Guardar cotización'}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Categorías</h3>
        <p className="mb-4 text-sm text-slate-600">
          Agregá, editá o renombrá categorías. La gestión está acá en Ajustes; en Categorías ves el análisis de gastos.
        </p>

        <form onSubmit={handleAddCategory} className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
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
            <div key={cat.id} className="rounded-lg bg-slate-50 px-3 py-2">
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
                    <span className="shrink-0 text-xs text-slate-500">
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
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">
          {mode === 'remote' ? 'Backup de la pareja' : 'Datos locales de este navegador'}
        </h3>
        <p className="mb-3 text-sm text-slate-600">
          {mode === 'remote'
            ? 'Exportá un JSON con movimientos, categorías, ajustes e importaciones desde la nube. Sirve como respaldo o para migrar datos.'
            : 'Cada navegador guarda su propia copia en IndexedDB, aunque uses la misma URL. El explorador embebido de Cursor y Chrome/Safari/Firefox no comparten datos entre sí.'}
        </p>
        <div className="mb-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">Origen:</span> {origin || '—'}
          </p>
          {stats && (
            <p>
              <span className="text-slate-500">Movimientos:</span> {stats.total} ({stats.expenses}{' '}
              gastos, {stats.incomes} ingresos, {stats.settlements} liquidaciones)
            </p>
          )}
          {lastBackupAt && (
            <p>
              <span className="text-slate-500">Último backup:</span>{' '}
              {formatDate(lastBackupAt.slice(0, 10))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
            Exportar backup
          </Button>
          <FormGroup className="!mb-0">
            <Label htmlFor="settings-import-backup">Importar backup</Label>
            <Input
              id="settings-import-backup"
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              disabled={importing}
            />
          </FormGroup>
        </div>
        {backupMessage && (
          <StatusMessage tone="info" className="mt-3">
            {backupMessage}
          </StatusMessage>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {mode === 'remote'
            ? 'Importar backup reemplaza solo los datos locales de este navegador; no sube automáticamente a la nube.'
            : 'Para ver los mismos movimientos en otro navegador, exportá acá e importá allí.'}
          {!lastBackupAt && ' Te recomendamos exportar un backup periódicamente.'}
        </p>
      </Card>

      <Card className="border-red-200">
        <h3 className="mb-2 font-semibold text-red-700">Zona de peligro</h3>
        <p className="mb-3 text-sm text-slate-600">
          Restablece la base de datos local y carga datos de ejemplo.
        </p>
        <Button variant="danger" size="sm" onClick={handleReset}>
          Restablecer datos
        </Button>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Finanzas Pareja v0.2 —{' '}
        {mode === 'remote' ? 'Datos sincronizados en Supabase' : 'Datos almacenados localmente en tu navegador'}
      </p>
    </div>
  )
}
