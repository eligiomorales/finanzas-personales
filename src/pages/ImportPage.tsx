/* Hallmark · genre: modern-minimal · macrostructure: Workbench
 * design-system: DESIGN.md · designed-as-app · enrichment: none */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useCategories, useImportMutations, useMovementFormHints, useSettings } from '@/hooks/useData'
import { useRepositories } from '@/contexts/DataContext'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { ImportBatchDefaultsCard } from '@/components/ImportBatchDefaultsCard'
import { ImportReviewItemCard } from '@/components/ImportReviewItemCard'
import { buildDefaultImportShare } from '@/lib/couple/person-labels'
import { isDuplicateMovement } from '@/lib/balance'
import { filterImportReviewItems, type ImportReviewFilter, type ImportReviewItem } from '@/lib/import-display'
import { getFrequentCategoryIds } from '@/lib/movement-form-defaults'
import { cn, dateSpanFromIsoDates, formatCurrency, generateId } from '@/lib/utils'
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
import { Badge, Card, MetricCard } from '@/components/ui/Card'
import { ChoiceChip } from '@/components/ui/ChoiceChip'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stepper } from '@/components/ui/Stepper'
import type { ImportShareValues } from '@/components/ImportShareControls'
import { Button, Select, StatusMessage, LiveRegion } from '@/components/ui/Form'
import type { AccountType, CurrencyCode, Movement } from '@/types'

type Step = 'upload' | 'mapping' | 'review' | 'done'

const IMPORT_STEPS = [
  { id: 'upload', label: 'Archivo' },
  { id: 'mapping', label: 'Mapeo' },
  { id: 'review', label: 'Revisión' },
  { id: 'done', label: 'Listo' },
] as const

function ImportUploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 16V4M12 4l4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  )
}

function ImportFileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4" strokeLinejoin="round" />
    </svg>
  )
}

function ImportPdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  )
}

function ImportImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" strokeLinejoin="round" />
    </svg>
  )
}

function ImportFileTypeIcon({
  imageProfile,
  pdfProfile,
  className,
}: {
  imageProfile: ImageProfile | null
  pdfProfile: PdfProfile | null
  className?: string
}) {
  if (imageProfile) return <ImportImageIcon className={className} />
  if (pdfProfile) return <ImportPdfIcon className={className} />
  return <ImportFileIcon className={className} />
}

export function ImportPage() {
  const categories = useCategories() ?? []
  const { movements: hintMovements } = useMovementFormHints()
  const repos = useRepositories()
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
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (persons.loading || shareDefaultApplied.current) return
    shareDefaultApplied.current = true
    setBulkShare(buildDefaultImportShare(persons.myRole))
  }, [persons.loading, persons.myRole])

  const defaultRate = settings?.defaultExchangeRateUsd ?? 1200

  async function loadDuplicateCandidates(rows: ParsedRow[]): Promise<Movement[]> {
    const span = dateSpanFromIsoDates(rows.map((row) => row.date))
    if (!span) return []
    return repos.movements.listInRange({ dateFrom: span.from, dateTo: span.to })
  }

  function buildPendingItems(
    rows: ParsedRow[],
    newImportId: string,
    duplicateCandidates: Movement[],
  ): ImportReviewItem[] {
    const shareDefaults = buildDefaultImportShare(persons.myRole)
    return rows.map((row) => {
      const currency = row.currency
      const duplicate = duplicateCandidates.find((m) =>
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

  async function processFile(file: File) {
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
        setPendingItems(buildPendingItems(result.rows, newImportId, await loadDuplicateCandidates(result.rows)))
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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    e.target.value = ''
  }

  async function handleFileDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
  }

  async function handleApplyMapping() {
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
    const duplicateCandidates = await loadDuplicateCandidates(rows)
    setPendingItems(buildPendingItems(rows, newImportId, duplicateCandidates))
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
    setDragging(false)
  }

  const mappingFields = [
    { id: 'date' as const, label: 'Fecha', required: true },
    { id: 'description' as const, label: 'Descripción', required: true },
    { id: 'amount' as const, label: 'Monto en pesos (ARS)', required: false },
    { id: 'amountUsd' as const, label: 'Monto en dólares (USD)', required: false },
    { id: 'debit' as const, label: 'Débito', required: false },
    { id: 'credit' as const, label: 'Crédito', required: false },
    { id: 'merchant' as const, label: 'Comercio', required: false },
  ]

  const previewRows = rawRows.slice(0, 3)

  const pendingCount = pendingItems.filter((p) => p.status === 'pending').length
  const ignoredCount = pendingItems.filter((p) => p.status === 'ignored').length
  const duplicateCount = pendingItems.filter((p) => p.possibleDuplicate && p.status === 'pending').length
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const frequentCategoryIds = useMemo(
    () => getFrequentCategoryIds(hintMovements, 'expense', 6),
    [hintMovements],
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
    <div className="mx-auto min-w-0 max-w-2xl space-y-6">
      <PageHeader title="Importar" />

      <Stepper steps={[...IMPORT_STEPS]} currentStepId={step} completedStepIds={completedStepIds} />

      {(step === 'upload' || step === 'mapping' || step === 'done') && (
        <Card className="min-w-0 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-stone-800">Subí tu resumen</h3>

              <label
                htmlFor="import-file"
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!loading) setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-colors',
                  loading && 'pointer-events-none opacity-60',
                  dragging
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-stone-300 bg-surface-50 hover:border-brand-400 hover:bg-brand-50/40',
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <ImportUploadIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">
                    {loading ? (loadingDetail ?? 'Procesando archivo...') : 'Arrastrá un archivo o tocá para elegir'}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    CSV, XLSX, XLS, PDF, PNG, JPG o WEBP · máximo 20 MB
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white sm:inline-flex">
                  Elegir
                </span>
                <input
                  id="import-file"
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
              </label>

              <div className="space-y-3 border-t border-stone-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-700">Configuración del archivo</p>
                  <Badge variant="info">Editable después</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-700">Tipo de cuenta</span>
                    <SegmentedControl
                      aria-label="Tipo de cuenta"
                      options={[
                        { value: 'credit' as const, label: 'Crédito' },
                        { value: 'debit' as const, label: 'Débito' },
                      ]}
                      value={accountType}
                      onChange={setAccountType}
                      fullWidth={false}
                      size="sm"
                    />
                  </div>

                  {showDefaultCurrency && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-stone-700">Moneda por defecto</span>
                        <p className="text-xs text-stone-400">Si el archivo no trae moneda por movimiento</p>
                      </div>
                      <SegmentedControl
                        aria-label="Moneda por defecto"
                        options={[
                          { value: 'ARS' as const, label: 'ARS' },
                          { value: 'USD' as const, label: 'USD' },
                        ]}
                        value={importCurrency}
                        onChange={setImportCurrency}
                        fullWidth={false}
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                {showDefaultCurrency && importCurrency === 'USD' && (
                  <p className="text-xs text-stone-400">
                    Conversión con cotización global: 1 USD = {defaultRate.toLocaleString('es-AR')} ARS
                  </p>
                )}
              </div>

              {error && <StatusMessage tone="error">{error}</StatusMessage>}
              {loading && <LiveRegion>{loadingDetail ?? 'Procesando archivo'}</LiveRegion>}

              <p className="border-t border-stone-200 pt-4 text-xs text-stone-500">
                <span className="font-medium text-stone-600">Privacidad:</span> las capturas se procesan con OCR en tu navegador, sin enviarse a servicios externos.
              </p>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <ImportFileIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-800">{fileName}</p>
                  <p className="text-xs text-stone-500">
                    {rawRows.length} filas detectadas · Encabezados detectados automáticamente
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="ml-auto shrink-0 text-xs whitespace-nowrap text-stone-400 hover:text-stone-600"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="space-y-3 border-t border-stone-200 pt-5">
                <h3 className="text-sm font-semibold text-stone-700">Asignar columnas</h3>
                <p className="text-xs text-stone-500">Vinculá cada campo con la columna correspondiente del archivo.</p>
                <div className="space-y-3">
                  {mappingFields.map((field) => {
                    const fieldId = `import-mapping-${field.id}`
                    const mapped = mapping[field.id]
                    return (
                      <div key={field.id} className="space-y-1">
                        <label htmlFor={fieldId} className="flex items-center gap-1 text-xs font-medium text-stone-700">
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                          {mapped && <span className="text-brand-500">✓</span>}
                        </label>
                        <Select
                          id={fieldId}
                          value={mapped ?? ''}
                          onChange={(e) => setMapping({ ...mapping, [field.id]: e.target.value || undefined })}
                          className={cn(mapped ? 'border-brand-300 bg-brand-50 text-brand-800' : undefined)}
                        >
                          <option value="">Sin asignar</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </Select>
                      </div>
                    )
                  })}
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="min-w-0 space-y-2 border-t border-stone-200 pt-5">
                  <h3 className="text-sm font-semibold text-stone-700">Vista previa</h3>
                  <p className="text-xs text-stone-500">Primeras {previewRows.length} filas del archivo</p>
                  <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-stone-200">
                    <table className="w-full min-w-max text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-surface-50">
                          {headers.map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-stone-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-50/60'}>
                            {headers.map((h) => (
                              <td key={h} className="whitespace-nowrap px-3 py-2 text-stone-700">
                                {row[h] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && <StatusMessage tone="error">{error}</StatusMessage>}
              <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-5">
                <Button onClick={handleApplyMapping}>Previsualizar movimientos →</Button>
                <Button variant="secondary" onClick={reset}>Cancelar</Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7.5 12l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-stone-900">¡Importación completada!</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Se importaron <strong className="text-stone-800">{confirmedCount} movimiento(s)</strong> desde{' '}
                    <strong className="text-stone-800">{fileName}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Importados" value={String(confirmedCount)} compact />
                <MetricCard label="Ignorados" value={String(ignoredCount)} compact />
                <MetricCard label="Duplicados" value={String(duplicateCount)} compact className="col-span-2 sm:col-span-1" />
              </div>

              <Button onClick={reset}>Importar otro archivo</Button>
            </div>
          )}
        </Card>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <ImportFileTypeIcon
                  imageProfile={imageProfile}
                  pdfProfile={pdfProfile}
                  className="h-4 w-4"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">{fileName}</p>
                <p className="text-xs text-stone-500">
                  {[
                    pdfProfile && pdfProfileLabel(pdfProfile),
                    imageProfile && imageProfileLabel(imageProfile),
                    perRowCurrency && 'Moneda detectada por movimiento',
                    !pdfProfile && !imageProfile && !perRowCurrency && `${pendingItems.length} movimiento(s) detectados`,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
                {pdfProfile && <Badge variant="info">PDF</Badge>}
                {imageProfile && <Badge variant="info">OCR</Badge>}
                {perRowCurrency && <Badge variant="info">Moneda por mov.</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-stone-200 pt-4">
              <MetricCard label="Pendientes" value={String(pendingCount)} compact />
              <MetricCard label="Total ARS" value={formatCurrency(pendingTotalArs, 'ARS')} compact />
              <MetricCard label="Ignorados" value={String(ignoredCount)} compact />
              <MetricCard label="Duplicados" value={String(duplicateCount)} compact />
            </div>

            <ImportBatchDefaultsCard
              expenseCategories={expenseCategories}
              frequentCategoryIds={frequentCategoryIds}
              bulkCategoryId={bulkCategoryId}
              bulkShare={bulkShare}
              persons={persons}
              pendingCount={pendingCount}
              duplicateCount={duplicateCount}
              onCategoryChange={setBulkCategoryId}
              onShareChange={setBulkShare}
              onApplyCategory={applyBulkCategoryToPending}
              onApplyShare={applyBulkShareToPending}
              onIgnoreDuplicates={ignoreAllDuplicates}
            />
          </Card>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['pending', `Pendientes (${pendingCount})`],
                ['duplicates', `Duplicados (${duplicateCount})`],
                ['ignored', `Ignorados (${ignoredCount})`],
                ['all', `Todos (${pendingItems.length})`],
              ] as const
            ).map(([filter, label]) => (
              <ChoiceChip
                key={filter}
                shape="pill"
                size="sm"
                selected={reviewFilter === filter}
                onClick={() => setReviewFilter(filter)}
              >
                {label}
              </ChoiceChip>
            ))}
          </div>

          <div className="space-y-2 pb-28">
            {visibleItems.length === 0 ? (
              <Card compact className="text-center text-sm text-stone-500">
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

          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200 bg-surface-50 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-800">
                  {loading ? 'Importando...' : `Confirmar ${pendingCount} movimiento(s)`}
                </p>
                <p className="text-xs text-stone-500">
                  {ignoredCount > 0 && `${ignoredCount} ignorado(s) · `}
                  Total pendiente ~{formatCurrency(pendingTotalArs, 'ARS')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={confirmSelected}
                  disabled={loading || pendingCount === 0}
                  className="flex-1 whitespace-nowrap sm:flex-none"
                  aria-live="polite"
                >
                  {loading ? 'Importando...' : 'Confirmar'}
                </Button>
                <Button variant="secondary" onClick={reset} className="whitespace-nowrap">
                  Cancelar
                </Button>
              </div>
            </div>
            {error && <StatusMessage tone="error" className="mx-auto mt-2 max-w-2xl">{error}</StatusMessage>}
            {loading && <LiveRegion>Importando movimientos</LiveRegion>}
          </div>
        </div>
      )}
    </div>
  )
}
