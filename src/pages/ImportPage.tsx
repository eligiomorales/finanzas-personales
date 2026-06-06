import { useState, useEffect, useRef, useMemo } from 'react'
import { useCategories, useImportMutations, useMovements, useSettings } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { ImportCategoryPicker } from '@/components/ImportCategoryPicker'
import { ImportReviewItemCard } from '@/components/ImportReviewItemCard'
import { buildDefaultImportShare } from '@/lib/couple/person-labels'
import { isDuplicateMovement } from '@/lib/balance'
import { filterImportReviewItems, type ImportReviewFilter, type ImportReviewItem } from '@/lib/import-display'
import { getFrequentCategoryIds } from '@/lib/movement-form-defaults'
import { formatCurrency, generateId } from '@/lib/utils'
import {
  parseFile,
  applyColumnMapping,
  guessColumnMapping,
  hasAmountMapping,
  hasPerRowCurrencyMapping,
  suggestCategory,
  type ColumnMapping,
  type ParsedRow,
} from '@/lib/import'
import { imageProfileLabel, type ImageProfile } from '@/lib/ocr/profile-labels'
import { pdfProfileLabel, type PdfProfile } from '@/lib/pdf/parse-pdf'
import { Card, Badge } from '@/components/ui/Card'
import { Stepper } from '@/components/ui/Stepper'
import {
  ImportShareControls,
  type ImportShareValues,
} from '@/components/ImportShareControls'
import { Button, Input, Select, Label, FormGroup, StatusMessage, LiveRegion } from '@/components/ui/Form'
import type { AccountType, CurrencyCode } from '@/types'

type Step = 'upload' | 'mapping' | 'review' | 'done'

const IMPORT_STEPS = [
  { id: 'upload', label: 'Archivo' },
  { id: 'mapping', label: 'Mapeo' },
  { id: 'review', label: 'Revisión' },
  { id: 'done', label: 'Listo' },
] as const

export function ImportPage() {
  const categories = useCategories() ?? []
  const movements = useMovements() ?? []
  const settings = useSettings()
  const persons = useCouplePersons()
  const { confirmImport } = useImportMutations()

  const [step, setStep] = useState<Step>('upload')
  const [accountType, setAccountType] = useState<AccountType>('credit')
  const [importCurrency, setImportCurrency] = useState<CurrencyCode>('ARS')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [pendingItems, setPendingItems] = useState<ImportReviewItem[]>([])
  const [bulkShare, setBulkShare] = useState<ImportShareValues>(() => buildDefaultImportShare(null))
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const shareDefaultApplied = useRef(false)
  const [importId, setImportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [pdfProfile, setPdfProfile] = useState<PdfProfile | null>(null)
  const [imageProfile, setImageProfile] = useState<ImageProfile | null>(null)
  const [perRowCurrency, setPerRowCurrency] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [reviewFilter, setReviewFilter] = useState<ImportReviewFilter>('pending')
  const [batchDefaultsOpen, setBatchDefaultsOpen] = useState(false)

  useEffect(() => {
    if (persons.loading || shareDefaultApplied.current) return
    shareDefaultApplied.current = true
    setBulkShare(buildDefaultImportShare(persons.myRole))
  }, [persons.loading, persons.myRole])

  const defaultRate = settings?.defaultExchangeRateUsd ?? 1200

  function buildPendingItems(rows: ParsedRow[], newImportId: string): ImportReviewItem[] {
    const shareDefaults = buildDefaultImportShare(persons.myRole)
    return rows.map((row) => {
      const currency = row.currency
      const duplicate = movements.find((m) =>
        isDuplicateMovement(m, {
          date: row.date,
          amount: row.amount,
          description: row.description,
          currency,
        }),
      )
      const suggestedCat = suggestCategory(row.description, categories)
      return {
        id: generateId(),
        importId: newImportId,
        date: row.date,
        originalDescription: row.description,
        amount: row.amount,
        currency,
        merchant: row.merchant,
        suggestedCategoryId: suggestedCat,
        possibleDuplicate: Boolean(duplicate),
        duplicateMovementId: duplicate?.id,
        status: 'pending' as const,
        selectedCategoryId: suggestedCat,
        ...shareDefaults,
      }
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setLoading(true)
    setLoadingDetail(null)
    try {
      const result = await parseFile(file, {
        onOcrProgress: (progress) => {
          if (progress.status === 'loading tesseract core' || progress.status === 'initializing tesseract') {
            setLoadingDetail('Cargando motor OCR (solo la primera vez puede tardar)...')
            return
          }
          if (progress.status === 'loading language traineddata') {
            setLoadingDetail('Descargando datos de idioma para OCR...')
            return
          }
          if (progress.status === 'recognizing text') {
            setLoadingDetail(`Extrayendo texto de la captura (${Math.round(progress.progress * 100)}%)...`)
          }
        },
      })
      setFileName(file.name)
      setHeaders(result.headers)
      setRawRows(result.rawRows)
      setPdfProfile(result.pdfProfile ?? null)
      setImageProfile(result.imageProfile ?? null)
      setPerRowCurrency(Boolean(result.perRowCurrency))
      if (result.imageProfile === 'wallbit-debit') {
        setAccountType('debit')
        setImportCurrency('USD')
      }

      if (result.skipMapping && result.rows.length > 0) {
        const newImportId = generateId()
        setImportId(newImportId)
        setMapping({
          date: 'Fecha',
          description: 'Referencia',
          amount: 'Pesos',
          merchant: 'Comprobante',
        })
        setPendingItems(buildPendingItems(result.rows, newImportId))
        setStep('review')
        return
      }

      const guessed = guessColumnMapping(result.headers)
      setMapping(guessed)
      setPerRowCurrency(Boolean(result.perRowCurrency || hasPerRowCurrencyMapping(guessed)))
      setStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer el archivo')
    } finally {
      setLoading(false)
      setLoadingDetail(null)
    }
  }

  function handleApplyMapping() {
    if (!mapping.date || !mapping.description || !hasAmountMapping(mapping)) {
      setError('Debes mapear fecha, descripción y monto (o débito/crédito)')
      return
    }
    setError(null)
    const rows = applyColumnMapping(rawRows, mapping as ColumnMapping, accountType, importCurrency)
    if (rows.length === 0) {
      setError('No se encontraron movimientos válidos. Revisa el mapeo de columnas.')
      return
    }

    const newImportId = generateId()
    setImportId(newImportId)
    setPendingItems(buildPendingItems(rows, newImportId))
    setStep('review')
  }

  async function confirmSelected() {
    if (!importId) return
    const selected = pendingItems.filter((p) => p.status === 'pending')
    const invalidShare = selected.find(
      (item) => item.isShared && Math.abs(item.sharePersonA + item.sharePersonB - 100) > 0.01,
    )
    if (invalidShare) {
      setError('Hay movimientos compartidos cuyos porcentajes no suman 100.')
      return
    }

    setError(null)

    setLoading(true)
    try {
      const count = await confirmImport({
        id: importId,
        accountType,
        fileName,
        items: pendingItems,
      })

      setConfirmedCount(count)
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  function ignoreItem(id: string) {
    setPendingItems((items) =>
      items.map((p) => (p.id === id ? { ...p, status: 'ignored' as const } : p)),
    )
  }

  function restoreItem(id: string) {
    setPendingItems((items) =>
      items.map((p) => (p.id === id ? { ...p, status: 'pending' as const } : p)),
    )
  }

  function updateItemCategory(id: string, categoryId: string) {
    setPendingItems((items) =>
      items.map((p) => (p.id === id ? { ...p, selectedCategoryId: categoryId } : p)),
    )
  }

  function updateItemShare(id: string, share: ImportShareValues) {
    setPendingItems((items) =>
      items.map((p) => (p.id === id ? { ...p, ...share } : p)),
    )
  }

  function applyBulkShareToPending() {
    setPendingItems((items) =>
      items.map((p) => (p.status === 'pending' ? { ...p, ...bulkShare } : p)),
    )
  }

  function applyBulkCategoryToPending() {
    if (!bulkCategoryId) return
    setPendingItems((items) =>
      items.map((p) =>
        p.status === 'pending' ? { ...p, selectedCategoryId: bulkCategoryId } : p,
      ),
    )
  }

  function updateItemCurrency(id: string, currency: CurrencyCode) {
    setPendingItems((items) =>
      items.map((p) => (p.id === id ? { ...p, currency } : p)),
    )
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRawRows([])
    setMapping({})
    setPendingItems([])
    setBulkShare(buildDefaultImportShare(persons.myRole))
    setBulkCategoryId('')
    setImportId(null)
    setPdfProfile(null)
    setImageProfile(null)
    setPerRowCurrency(false)
    setLoadingDetail(null)
    setImportCurrency('ARS')
    setError(null)
    setConfirmedCount(0)
    setReviewFilter('pending')
    setBatchDefaultsOpen(false)
  }

  const pendingCount = pendingItems.filter((p) => p.status === 'pending').length
  const ignoredCount = pendingItems.filter((p) => p.status === 'ignored').length
  const duplicateCount = pendingItems.filter((p) => p.possibleDuplicate && p.status === 'pending').length
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const frequentCategoryIds = useMemo(
    () => getFrequentCategoryIds(movements, 'expense', 6),
    [movements],
  )
  const visibleItems = useMemo(
    () => filterImportReviewItems(pendingItems, reviewFilter),
    [pendingItems, reviewFilter],
  )
  const pendingTotalArs = useMemo(
    () =>
      pendingItems
        .filter((item) => item.status === 'pending')
        .reduce(
          (sum, item) => sum + (item.currency === 'USD' ? item.amount * defaultRate : item.amount),
          0,
        ),
    [pendingItems, defaultRate],
  )

  const showDefaultCurrency = !perRowCurrency

  const completedStepIds: string[] = []
  if (step !== 'upload') completedStepIds.push('upload')
  if (step === 'review' || step === 'done') completedStepIds.push('mapping')
  if (step === 'done') completedStepIds.push('review')

  function ignoreAllDuplicates() {
    setPendingItems((items) =>
      items.map((p) =>
        p.possibleDuplicate && p.status === 'pending' ? { ...p, status: 'ignored' as const } : p,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Importar resumen</h2>
        <p className="text-sm text-slate-500">CSV, Excel, PDF de tarjeta o captura de Wallbit</p>
      </div>

      <Stepper steps={[...IMPORT_STEPS]} currentStepId={step} completedStepIds={completedStepIds} />

      {step === 'upload' && (
        <Card>
          {showDefaultCurrency && (
            <FormGroup>
              <Label htmlFor="import-default-currency">Moneda por defecto</Label>
              <Select
                id="import-default-currency"
                value={importCurrency}
                onChange={(e) => setImportCurrency(e.target.value as CurrencyCode)}
                aria-describedby="import-default-currency-hint"
              >
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </Select>
              <p id="import-default-currency-hint" className="mt-1 text-xs text-slate-500">
                Se usa cuando el archivo tiene una sola columna de monto. En PDF de tarjeta se detecta ARS/USD por movimiento.
              </p>
              {importCurrency === 'USD' && (
                <p className="mt-1 text-xs text-slate-500">
                  Conversión con cotización global: 1 USD = {defaultRate.toLocaleString('es-AR')} ARS
                </p>
              )}
            </FormGroup>
          )}
          <FormGroup>
            <Label htmlFor="import-account-type">Tipo de cuenta</Label>
            <Select
              id="import-account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              aria-describedby="import-account-type-hint"
            >
              <option value="credit">Tarjeta de crédito</option>
              <option value="debit">Cuenta débito</option>
            </Select>
            <p id="import-account-type-hint" className="mt-1 text-xs text-slate-500">
              Afecta cómo se interpretan débitos y créditos en extractos bancarios.
            </p>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="import-file">Archivo (CSV, Excel, PDF o captura)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              disabled={loading}
              aria-describedby="import-file-hint"
            />
            <p id="import-file-hint" className="mt-1 text-xs text-slate-500">
              Los movimientos se revisan antes de guardarse. Las capturas se procesan con OCR en tu navegador; no se envían a servicios externos.
            </p>
          </FormGroup>
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
          {loading && (
            <>
              <StatusMessage tone="info">{loadingDetail ?? 'Procesando archivo...'}</StatusMessage>
              <LiveRegion>{loadingDetail ?? 'Procesando archivo'}</LiveRegion>
            </>
          )}
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium">Formatos soportados</p>
            <ul className="mt-1 list-inside list-disc">
              <li>CSV con encabezados (fecha, descripción, monto)</li>
              <li>Excel (.xlsx, .xls), incl. extractos Galicia caja de ahorro</li>
              <li>PDF (.pdf): resúmenes Galicia Mastercard, Galicia Visa y Santander Visa</li>
              <li>Captura Wallbit (.png, .jpg): lista Transactions (OCR local, puede tardar 10–60 s)</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Las capturas largas (scroll) se aceptan en un solo archivo. Tamaño máximo: 20 MB.
            </p>
          </div>
        </Card>
      )}

      {step === 'mapping' && (
        <Card>
          <h3 className="mb-4 font-semibold">Mapear columnas — {fileName}</h3>
          <p className="mb-4 text-sm text-slate-500">{rawRows.length} filas detectadas</p>
          <div className="space-y-3">
            {(['date', 'description', 'amount', 'amountUsd', 'debit', 'credit', 'merchant'] as const).map((field) => {
              const fieldId = `import-mapping-${field}`
              const fieldLabel =
                field === 'date'
                  ? 'Fecha'
                  : field === 'description'
                    ? 'Descripción'
                    : field === 'amount'
                      ? 'Monto en pesos (ARS)'
                      : field === 'amountUsd'
                        ? 'Monto en dólares (USD)'
                        : field === 'debit'
                          ? 'Débito (extractos bancarios)'
                          : field === 'credit'
                            ? 'Crédito (extractos bancarios)'
                            : 'Comercio (opcional)'

              return (
              <FormGroup key={field} className="!mb-0">
                <Label htmlFor={fieldId}>{fieldLabel}</Label>
                <Select
                  id={fieldId}
                  value={mapping[field] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || undefined })}
                >
                  <option value="">— Seleccionar —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              )
            })}
          </div>
          {error && <StatusMessage tone="error" className="mt-3">{error}</StatusMessage>}
          <div className="mt-4 flex gap-3">
            <Button onClick={handleApplyMapping}>Previsualizar movimientos</Button>
            <Button variant="secondary" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <>
          <Card>
            <h3 className="font-semibold text-slate-800">Resumen del lote</h3>
            <p className="mt-1 text-sm text-slate-600">
              Archivo: <strong>{fileName}</strong> · {pendingItems.length} movimiento(s) detectados
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="info">{pendingCount} pendientes</Badge>
              {ignoredCount > 0 && <Badge>{ignoredCount} ignorados</Badge>}
              {pdfProfile && <Badge variant="info">{pdfProfileLabel(pdfProfile)}</Badge>}
              {imageProfile && <Badge variant="info">{imageProfileLabel(imageProfile)}</Badge>}
              {perRowCurrency && <Badge variant="info">Moneda por movimiento</Badge>}
              {duplicateCount > 0 && (
                <Badge variant="warning">{duplicateCount} posibles duplicados</Badge>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Revisá excepciones, aplicá defaults al lote y confirmá cuando esté listo.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setBatchDefaultsOpen((open) => !open)}
                aria-expanded={batchDefaultsOpen}
                aria-controls="import-batch-defaults"
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
              >
                <div>
                  <span className="block text-sm font-semibold text-slate-800">Defaults del lote</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Categoría y reparto masivo para movimientos pendientes
                  </span>
                </div>
                <span className="text-slate-400" aria-hidden="true">
                  {batchDefaultsOpen ? '▴' : '▾'}
                </span>
              </button>

              {batchDefaultsOpen && (
                <div id="import-batch-defaults" className="mt-2 space-y-4 rounded-lg border border-slate-200 p-3">
                  <ImportCategoryPicker
                    idPrefix="import-bulk-category"
                    expenseCategories={expenseCategories}
                    frequentCategoryIds={frequentCategoryIds}
                    selectedCategoryId={bulkCategoryId || null}
                    onChange={setBulkCategoryId}
                    label="Categoría masiva"
                  />

                  <ImportShareControls
                    {...bulkShare}
                    persons={persons}
                    onChange={setBulkShare}
                    idPrefix="import-bulk-share"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={!bulkCategoryId} onClick={applyBulkCategoryToPending}>
                      Aplicar categoría a pendientes
                    </Button>
                    <Button size="sm" variant="secondary" onClick={applyBulkShareToPending}>
                      Aplicar reparto a pendientes
                    </Button>
                    {duplicateCount > 0 && (
                      <Button size="sm" variant="ghost" onClick={ignoreAllDuplicates}>
                        Ignorar duplicados
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['pending', `Pendientes (${pendingCount})`],
                ['duplicates', `Duplicados (${duplicateCount})`],
                ['ignored', `Ignorados (${ignoredCount})`],
                ['all', `Todos (${pendingItems.length})`],
              ] as const
            ).map(([filter, label]) => (
              <button
                key={filter}
                type="button"
                onClick={() => setReviewFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 ${
                  reviewFilter === filter
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2 pb-24">
            {visibleItems.length === 0 ? (
              <Card className="!p-4 text-center text-sm text-slate-500">
                No hay movimientos en esta vista.
              </Card>
            ) : (
              visibleItems.map((item) => (
                <ImportReviewItemCard
                  key={item.id}
                  item={item}
                  persons={persons}
                  expenseCategories={expenseCategories}
                  frequentCategoryIds={frequentCategoryIds}
                  perRowCurrency={perRowCurrency}
                  onCategoryChange={(categoryId) => updateItemCategory(item.id, categoryId)}
                  onCurrencyChange={(currency) => updateItemCurrency(item.id, currency)}
                  onShareChange={(share) => updateItemShare(item.id, share)}
                  onIgnore={() => ignoreItem(item.id)}
                  onRestore={() => restoreItem(item.id)}
                />
              ))
            )}
          </div>

          <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">
                  {loading ? 'Importando...' : `Confirmar ${pendingCount} movimiento(s)`}
                </p>
                <p className="text-xs text-slate-500">
                  {ignoredCount > 0 && `${ignoredCount} ignorado(s) · `}
                  Total pendiente ~{formatCurrency(pendingTotalArs, 'ARS')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={confirmSelected}
                  disabled={loading || pendingCount === 0}
                  className="flex-1 sm:flex-none"
                  aria-live="polite"
                >
                  {loading ? 'Importando...' : 'Confirmar'}
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </div>
            {error && <StatusMessage tone="error" className="mt-2">{error}</StatusMessage>}
            {loading && <LiveRegion>Importando movimientos</LiveRegion>}
          </div>
        </>
      )}

      {step === 'done' && (
        <Card className="text-center">
          <p className="text-4xl">✓</p>
          <h3 className="mt-2 text-lg font-bold">Importación completada</h3>
          <p className="mt-1 text-slate-600">
            Se importaron {confirmedCount} movimiento(s) desde {fileName}
          </p>
          <Button className="mt-4" onClick={reset}>
            Importar otro archivo
          </Button>
        </Card>
      )}
    </div>
  )
}
