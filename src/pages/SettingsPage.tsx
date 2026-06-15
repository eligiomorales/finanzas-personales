/* Hallmark · genre: modern-minimal · macrostructure: Workbench
 * design-system: DESIGN.md · designed-as-app · enrichment: none
 * pre-emit critique: P5 H4 E5 S5 R5 V4 */
import { useState, useEffect, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCategories, useSettings, useDataMutations, useDatabaseStats } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useAuth } from '@/contexts/AuthContext'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { expenseViewModeLabel, type ExpenseViewMode } from '@/lib/expense-view-mode'
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
import { cn, formatDate } from '@/lib/utils'
import { formatInviteCodeStatus, getInviteCodeStatus } from '@/lib/couple/invite-code'
import type { DatabaseBackup } from '@/lib/backup'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/ui/PageHeader'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { SettingsSection } from '@/components/ui/SettingsSection'
import { SettingsList, SettingsListItem } from '@/components/ui/SettingsList'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel'
import { Alert } from '@/components/ui/Alert'
import { Badge, Card } from '@/components/ui/Card'
import { Button, Input, Label, FormGroup, StatusMessage, LiveRegion } from '@/components/ui/Form'

/** Ancho compartido para controles compactos alineados a la derecha en filas de ajustes. */
const SETTINGS_CONTROL_WIDTH = 'w-[107px]'

function SettingsRow({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-4 py-3.5', className)}>
      <div className="min-w-0 shrink">
        <p className="truncate text-sm text-stone-800">{label}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-stone-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" strokeLinecap="round" />
    </svg>
  )
}

function BackupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 3v12M12 15l4-4M12 15L8 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" strokeLinecap="round" />
    </svg>
  )
}

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
  } = useDataMutations()
  const { confirm, dialog } = useConfirmDialog()
  const persons = useCouplePersons()
  const { mode: expenseViewMode, setMode: setExpenseViewMode } = useExpenseViewMode()
  const [myDisplayName, setMyDisplayName] = useState('')
  const [personAName, setPersonAName] = useState('')
  const [personBName, setPersonBName] = useState('')
  const [defaultExchangeRateUsd, setDefaultExchangeRateUsd] = useState('1200')
  const [currencySaved, setCurrencySaved] = useState(false)
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

  const syncSubtitle =
    mode === 'remote'
      ? 'Movimientos sincronizados en Supabase'
      : 'Datos almacenados localmente en este navegador'

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
    <div className="mx-auto min-w-0 max-w-2xl space-y-6">
      {dialog}
      <LiveRegion>{backupMessage ?? ''}</LiveRegion>

      <PageHeader title="Configuración" />

      <AnimatePresence>
        {backupReminder.neverExported && (
          <Alert
            key="backup-never-exported"
            tone="warning"
            title="Todavía no exportaste un backup"
            action={{ label: 'Exportar backup ahora', onClick: handleExport }}
          >
            Tus datos viven solo en este navegador. Exportá un backup JSON para no perder movimientos si
            cambiás de dispositivo o borrás el historial.
          </Alert>
        )}

        {!backupReminder.neverExported && backupReminder.overdue && (
          <Alert
            key="backup-overdue"
            tone="warning"
            title="Hace tiempo que no exportás un backup"
            action={{ label: 'Exportar backup ahora', onClick: handleExport }}
          >
            Pasaron {backupReminder.daysSince} días desde el último backup
            {lastBackupAt ? ` (${formatDate(lastBackupAt.slice(0, 10))})` : ''}. Te recomendamos exportar
            uno nuevo para tener una copia reciente.
          </Alert>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <SectionHeader label="Preferencias" />
        <Card className="divide-y divide-stone-200/80 p-0">
          <SettingsRow label="Moneda">
            <CurrencyToggle className={SETTINGS_CONTROL_WIDTH} />
          </SettingsRow>

          <form onSubmit={handleSaveCurrency}>
            <div className="flex items-center gap-2 px-4 py-3.5">
              <p className="shrink-0 text-sm text-stone-800">USD → ARS</p>
              <Input
                id="settings-exchange-rate"
                type="number"
                min="0"
                step="0.01"
                value={defaultExchangeRateUsd}
                onChange={(e) => setDefaultExchangeRateUsd(e.target.value)}
                aria-label="1 USD equivale a X ARS"
                className="h-10 min-w-0 flex-1"
              />
              <Button
                type="submit"
                size="md"
                className={cn(SETTINGS_CONTROL_WIDTH, 'h-10 shrink-0 justify-center px-2')}
                aria-live="polite"
              >
                {currencySaved ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </form>

          <SettingsRow label="Vista de gastos">
            <SegmentedControl
              aria-label="Modo de vista de gastos"
              options={(['couple', 'personal'] as ExpenseViewMode[]).map((option) => ({
                value: option,
                label: expenseViewModeLabel(option),
              }))}
              value={expenseViewMode}
              onChange={setExpenseViewMode}
              fullWidth={false}
            />
          </SettingsRow>
        </Card>
      </div>

      <div className="space-y-2">
        <SectionHeader label="Categorías" />
        <SettingsList>
          <SettingsListItem
            to="/configuracion/categorias"
            label="Agregar, editar o renombrar"
            meta={`${categories.length}`}
          />
        </SettingsList>
      </div>

      <div className="space-y-2">
        <SectionHeader label="Cuenta" />
        <SettingsSection title="Sesión y sincronización">
          {configured && user ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-surface-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <AccountIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-stone-900">{user.email}</p>
                    <Badge variant={mode === 'remote' ? 'info' : 'default'}>
                      {mode === 'remote' ? 'Sincronizado' : 'Local'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {mode === 'remote'
                      ? 'Los movimientos se comparten entre navegadores.'
                      : 'Modo local activo en este dispositivo.'}
                  </p>
                </div>
              </div>

              {membership && (
                <div className="space-y-3 rounded-lg border border-stone-200/80 bg-surface-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Código de invitación
                    </p>
                    {inviteStatus === 'expired' && <Badge variant="warning">Vencido</Badge>}
                    {inviteStatus === 'active' && <Badge variant="success">Activo</Badge>}
                  </div>
                  <code className="block rounded-lg bg-white px-3 py-2 text-center font-mono text-lg tracking-widest text-stone-800 shadow-sm">
                    {membership.inviteCode}
                  </code>
                  <p className="text-xs text-stone-600">
                    {formatInviteCodeStatus(membership.inviteCodeExpiresAt, membership.memberCount)}
                  </p>
                  {canManageInviteCode && (
                    <div className="flex flex-wrap gap-2">
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

              <Button type="button" variant="secondary" size="sm" onClick={() => signOut()}>
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              Modo local sin Supabase. Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para sincronizar.
            </p>
          )}
        </SettingsSection>
      </div>

      <div className="space-y-2">
        <SectionHeader label="Perfil" />
        <SettingsSection title="Nombres en la pareja">
          {mode === 'remote' ? (
            <>
              <p className="mb-4 text-sm text-stone-600">
                Tu identidad queda vinculada a tu cuenta. Solo podés editar tu propio nombre; el de tu
                pareja se toma de su perfil.
              </p>
              <form onSubmit={handleSaveNames} className="space-y-4">
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
                    className="bg-surface-50"
                  />
                </FormGroup>
                <Button type="submit" size="sm" aria-live="polite" disabled={!myDisplayName.trim()}>
                  {saved ? 'Guardado' : 'Guardar tu nombre'}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSaveNames} className="space-y-4">
              <p className="text-sm text-stone-600">
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
              <Button type="submit" size="sm" aria-live="polite">
                {saved ? 'Guardado' : 'Guardar nombres'}
              </Button>
            </form>
          )}
        </SettingsSection>
      </div>

      <div className="space-y-2">
        <SectionHeader label="Datos" />
        {mode === 'remote' && migrationPreview && migrationPreview.local.movements > 0 && (
          <CollapsiblePanel
            title="Migrar datos locales a cuenta"
            summary={`${migrationPreview.local.movements} movimientos en IndexedDB`}
            defaultOpen={!migrationPreview.alreadyMigrated}
          >
            <div className="mt-3 space-y-4 rounded-lg border border-stone-200/80 bg-white p-3">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="font-medium text-stone-700">Local (IndexedDB)</p>
                  <p className="mt-1 text-stone-600">{migrationPreview.local.movements} movimientos</p>
                  <p className="text-xs text-stone-500">
                    {migrationPreview.local.incomes} ingresos · {migrationPreview.local.expenses} gastos ·{' '}
                    {migrationPreview.local.settlements} liquidaciones
                  </p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="font-medium text-stone-700">Nube (pareja)</p>
                  <p className="mt-1 text-stone-600">{migrationPreview.remote.movements} movimientos</p>
                  <p className="text-xs text-stone-500">
                    {migrationPreview.remote.incomes} ingresos · {migrationPreview.remote.expenses} gastos ·{' '}
                    {migrationPreview.remote.settlements} liquidaciones
                  </p>
                </div>
              </div>
              {migrationPreview.alreadyMigrated && (
                <p className="text-xs text-amber-700">
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
                <StatusMessage tone="info">{migrationMessage}</StatusMessage>
              )}
            </div>
          </CollapsiblePanel>
        )}

        <CollapsiblePanel
          title={mode === 'remote' ? 'Backup de la pareja' : 'Datos locales de este navegador'}
          summary={
            lastBackupAt
              ? `Último backup: ${formatDate(lastBackupAt.slice(0, 10))}`
              : stats
                ? `${stats.total} movimientos sin backup`
                : 'Exportar o importar JSON'
          }
          defaultOpen={backupReminder.neverExported || backupReminder.overdue}
        >
          <div className="mt-3 space-y-4 rounded-lg border border-stone-200/80 bg-white p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <BackupIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1 text-sm text-stone-700">
                <p>
                  <span className="text-stone-500">Origen:</span> {origin || '—'}
                </p>
                {stats && (
                  <p>
                    <span className="text-stone-500">Movimientos:</span> {stats.total} ({stats.expenses}{' '}
                    gastos, {stats.incomes} ingresos, {stats.settlements} liquidaciones)
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-500">
              {mode === 'remote'
                ? 'Exportá un JSON con movimientos, categorías, ajustes e importaciones desde la nube.'
                : 'Cada navegador guarda su propia copia en IndexedDB. Para ver los mismos movimientos en otro dispositivo, exportá acá e importá allí.'}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
                Exportar backup
              </Button>
            </div>

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

            {backupMessage && (
              <StatusMessage tone="info">{backupMessage}</StatusMessage>
            )}

            <p className="text-xs text-stone-500">
              {mode === 'remote'
                ? 'Importar backup reemplaza solo los datos locales de este navegador; no sube automáticamente a la nube.'
                : 'Para ver los mismos movimientos en otro navegador, exportá acá e importá allí.'}
              {!lastBackupAt && ' Te recomendamos exportar un backup periódicamente.'}
            </p>
          </div>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel
        title="Zona de peligro"
        summary="Restablecer datos de ejemplo"
        defaultOpen={false}
      >
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
          <p className="mb-3 text-sm text-red-800">
            Restablece la base de datos local y carga datos de ejemplo. Esta acción no se puede deshacer.
          </p>
          <Button variant="danger" size="sm" onClick={handleReset}>
            Restablecer datos
          </Button>
        </div>
      </CollapsiblePanel>

      <p className="pb-2 text-center text-xs text-stone-400">
        duo v0.2 — {syncSubtitle}
      </p>
    </div>
  )
}
