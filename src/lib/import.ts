import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { OcrProgress } from '@/lib/ocr/extract-text'
import type { ImageProfile } from '@/lib/ocr/profile-labels'
import { parsePdfFile, type PdfProfile } from '@/lib/pdf/parse-pdf'
import type { AccountType, CurrencyCode } from '@/types'

export type { ImageProfile } from '@/lib/ocr/profile-labels'
export type { OcrProgress }

export interface ParsedRow {
  date: string
  description: string
  amount: number
  currency: CurrencyCode
  merchant?: string
}

export interface ColumnMapping {
  date: string
  description: string
  amount?: string
  amountUsd?: string
  debit?: string
  credit?: string
  merchant?: string
}

export interface ParseResult {
  rows: ParsedRow[]
  headers: string[]
  rawRows: Record<string, string>[]
  skipMapping?: boolean
  pdfProfile?: PdfProfile
  imageProfile?: ImageProfile
  /** When true, each row already has its currency; hide global currency selector. */
  perRowCurrency?: boolean
  /** Parser-level warnings shown in import preview (ponytail: string[], no structured warning engine). */
  warnings?: string[]
  /** When true, all parsed rows should be treated as needing manual review (OCR uncertainty). */
  forceNeedsReview?: boolean
}

export type CategoryMatchSource = 'user_rule' | 'keyword' | 'fallback' | 'none'

export interface CategorySuggestion {
  categoryId: string | null
  confidence: number
  source: CategoryMatchSource
}

/** ponytail: fixed scores; upgrade path = IMP-2 threshold + IMP-5 rule boost wiring */
export const IMPORT_CONFIDENCE = {
  USER_RULE: 95,
  KEYWORD: 100,
  FALLBACK: 70,
  OCR_UNCERTAIN: 40,
  DUPLICATE: 0,
} as const

export const IMPORT_REVIEW_THRESHOLD = 90

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

const DATE_PATTERNS: { re: RegExp; format: (m: RegExpMatchArray) => string }[] = [
  { re: /^(\d{4})-(\d{2})-(\d{2})$/, format: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  { re: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: (m) => `${m[3]}-${m[2]}-${m[1]}` },
  { re: /^(\d{2})-(\d{2})-(\d{4})$/, format: (m) => `${m[3]}-${m[2]}-${m[1]}` },
  {
    re: /^(\d{2})\/(\d{2})\/(\d{2})$/,
    format: (m) => {
      const year = parseInt(m[3], 10)
      const fullYear = year > 50 ? 1900 + year : 2000 + year
      return `${fullYear}-${m[2]}-${m[1]}`
    },
  },
  {
    re: /^(\d{2})-(\d{2})-(\d{2})$/,
    format: (m) => {
      const year = parseInt(m[3], 10)
      const fullYear = year > 50 ? 1900 + year : 2000 + year
      return `${fullYear}-${m[2]}-${m[1]}`
    },
  },
  {
    re: /^(\d{2})-([A-Za-z]{3})-(\d{2})$/,
    format: (m) => {
      const months: Record<string, string> = {
        ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
        jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
      }
      const month = months[m[2].toLowerCase()]
      if (!month) return ''
      const year = parseInt(m[3], 10)
      const fullYear = year > 50 ? 1900 + year : 2000 + year
      return `${fullYear}-${month}-${m[1]}`
    },
  },
]

const HEADER_KEYWORDS = {
  date: ['fecha', 'date', 'fec'],
  description: ['movimiento', 'descripcion', 'descripción', 'concepto', 'detalle', 'description', 'referencia'],
  amount: ['monto', 'importe', 'amount', 'valor', 'pesos'],
  debit: ['debito', 'débito', 'debit'],
  credit: ['credito', 'crédito', 'credit'],
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim()
}

function rowMatchesHeaderKeywords(row: unknown[]): boolean {
  const cells = row.map((cell) => normalizeHeader(cell).toLowerCase())
  const hasDate = cells.some((c) => HEADER_KEYWORDS.date.some((k) => c.includes(k)))
  const hasDescription = cells.some((c) => HEADER_KEYWORDS.description.some((k) => c.includes(k)))
  const hasAmount = cells.some((c) =>
    [...HEADER_KEYWORDS.amount, ...HEADER_KEYWORDS.debit, ...HEADER_KEYWORDS.credit].some((k) =>
      c.includes(k),
    ),
  )
  return hasDate && hasDescription && hasAmount
}

export function findHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 40); i++) {
    const row = matrix[i]
    if (Array.isArray(row) && rowMatchesHeaderKeywords(row)) {
      return i
    }
  }
  return 0
}

function buildHeaders(headerRow: unknown[]): string[] {
  const seen = new Map<string, number>()
  return headerRow.map((cell, index) => {
    const base = normalizeHeader(cell) || `Columna ${index + 1}`
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base} (${count + 1})`
  })
}

function matrixToRawRows(matrix: unknown[][], headerRowIndex: number): {
  headers: string[]
  rawRows: Record<string, string>[]
} {
  const headers = buildHeaders(matrix[headerRowIndex] ?? [])
  const rawRows: Record<string, string>[] = []

  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (!Array.isArray(row)) continue

    const record: Record<string, string> = {}
    let hasData = false

    for (let j = 0; j < headers.length; j++) {
      const value = normalizeCellValue(row[j])
      if (value) hasData = true
      record[headers[j]] = value
    }

    if (hasData) rawRows.push(record)
  }

  return { headers, rawRows }
}

function normalizeCellValue(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).replace(/\r\n/g, '\n').trim()
}

export function normalizeDescription(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

/** Build a single import description from primary text and optional metadata lines. */
export function buildImportDescription(parts: {
  primary: string
  comprobante?: string
}): string {
  const primary = normalizeDescription(parts.primary)
  const comprobante = parts.comprobante?.trim()
  if (!comprobante || primary.includes(comprobante)) return primary
  return `${primary}\nComprobante: ${comprobante}`
}

export function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  for (const { re, format } of DATE_PATTERNS) {
    const match = trimmed.match(re)
    if (match) {
      const iso = format(match)
      return iso || null
    }
  }

  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }
  return null
}

function normalizeAmountString(raw: string): string {
  const cleaned = raw.replace(/[^\d.,\-]/g, '')
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastDot > lastComma) {
      return cleaned.replace(/,/g, '')
    }
    return cleaned.replace(/\./g, '').replace(',', '.')
  }

  if (lastComma !== -1) {
    const commaCount = (cleaned.match(/,/g) ?? []).length
    if (commaCount > 1) {
      return cleaned.replace(/,/g, '')
    }
    return cleaned.replace(',', '.')
  }

  if (lastDot !== -1) {
    const dotCount = (cleaned.match(/\./g) ?? []).length
    if (dotCount > 1) {
      return cleaned.replace(/\./g, '')
    }
    const fractionalDigits = cleaned.length - lastDot - 1
    if (fractionalDigits <= 2) {
      return cleaned
    }
    return cleaned.replace(/\./g, '')
  }

  return cleaned
}

export function parseAmount(value: string | number): number | null {
  if (typeof value === 'number') return Math.abs(value)
  const trimmed = value.trim()
  if (!trimmed || trimmed === '0' || trimmed === '0,00' || trimmed === '0.00') return null

  const num = parseFloat(normalizeAmountString(trimmed))
  return isNaN(num) ? null : Math.abs(num)
}

function parseRowAmount(raw: Record<string, string>, mapping: ColumnMapping): number | null {
  if (mapping.amount) {
    return parseAmount(raw[mapping.amount] ?? '')
  }

  const debit = mapping.debit ? parseAmount(raw[mapping.debit] ?? '') : null
  const credit = mapping.credit ? parseAmount(raw[mapping.credit] ?? '') : null
  return debit ?? credit
}

function resolveRowCurrencyAndAmount(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  defaultCurrency: CurrencyCode,
): { amount: number; currency: CurrencyCode } | null {
  const pesos = mapping.amount ? parseAmount(raw[mapping.amount] ?? '') : null
  const dolares = mapping.amountUsd ? parseAmount(raw[mapping.amountUsd] ?? '') : null

  if (mapping.amountUsd) {
    if (dolares !== null && dolares > 0) {
      return { amount: dolares, currency: 'USD' }
    }
    if (pesos !== null) {
      return { amount: pesos, currency: 'ARS' }
    }
    return null
  }

  const amount = parseRowAmount(raw, mapping)
  if (amount === null) return null
  return { amount, currency: defaultCurrency }
}

export function hasPerRowCurrencyMapping(mapping: Partial<ColumnMapping>): boolean {
  return Boolean(mapping.amountUsd)
}

export function hasAmountMapping(mapping: Partial<ColumnMapping>): boolean {
  return Boolean(mapping.amount || mapping.debit || mapping.credit)
}

export async function parseFile(
  file: File,
  options?: { onOcrProgress?: (progress: OcrProgress) => void },
): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return parseCSV(file)
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  }
  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer()
    return parsePdfFile(buffer)
  }
  if (ext && IMAGE_EXTENSIONS.has(ext)) {
    const { parseImageFile } = await import('@/lib/ocr/parse-image')
    return parseImageFile(file, options?.onOcrProgress)
  }
  throw new Error(
    'Formato no soportado. Usa CSV, Excel (.xlsx, .xls), PDF (.pdf) o captura Wallbit (PNG/JPEG).',
  )
}

async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? []
        resolve({
          headers,
          rawRows: results.data,
          rows: [],
        })
      },
      error: (err) => reject(err),
    })
  })
}

async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const headerRowIndex = findHeaderRowIndex(matrix)
  const { headers, rawRows } = matrixToRawRows(matrix, headerRowIndex)
  return { headers, rawRows, rows: [] }
}

export function applyColumnMapping(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  _accountType: AccountType,
  defaultCurrency: CurrencyCode = 'ARS',
): ParsedRow[] {
  const rows: ParsedRow[] = []

  for (const raw of rawRows) {
    const dateStr = parseDate(String(raw[mapping.date] ?? ''))
    const resolved = resolveRowCurrencyAndAmount(raw, mapping, defaultCurrency)
    const primary = normalizeDescription(String(raw[mapping.description] ?? ''))
    const comprobante = mapping.merchant ? String(raw[mapping.merchant] ?? '').trim() : undefined
    const description = buildImportDescription({ primary, comprobante })

    if (!dateStr || !resolved || !description) continue

    rows.push({
      date: dateStr,
      description,
      amount: resolved.amount,
      currency: resolved.currency,
      merchant: comprobante || undefined,
    })
  }

  return rows
}

export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const lower = headers.map((h) => ({ original: h, lower: h.toLowerCase().trim() }))

  const find = (...keywords: string[]) =>
    lower.find((h) => keywords.some((k) => h.lower.includes(k)))?.original

  const debit = find('debito', 'débito', 'debit')
  const credit = find('credito', 'crédito', 'credit')
  const amountUsd = find('dolares', 'dólares', 'usd', 'dollar')
  const amount = find('monto', 'importe', 'amount', 'valor', 'pesos') ?? debit

  return {
    date: find('fecha', 'date', 'fec'),
    description: find('movimiento', 'descripcion', 'descripción', 'concepto', 'detalle', 'description', 'referencia'),
    amount,
    amountUsd,
    debit,
    credit,
    merchant: find('comercio', 'merchant', 'establecimiento'),
  }
}

const HARDCODED_CATEGORY_RULES: [string[], string][] = [
  [['super', 'carrefour', 'coto', 'jumbo', 'dia'], 'Supermercado'],
  [['restaurant', 'resto', 'cafe', 'café', 'pizza', 'burger'], 'Restaurantes'],
  [['uber', 'cabify', 'taxi', 'subte', 'colectivo', 'nafta', 'ypf', 'shell'], 'Transporte'],
  [['netflix', 'spotify', 'disney', 'hbo', 'suscrip'], 'Suscripciones'],
  [['farmacia', 'medico', 'médico', 'hospital', 'osde', 'swiss'], 'Salud'],
  [['edenor', 'metrogas', 'aysa', 'internet', 'telecom', 'movistar', 'claro'], 'Servicios'],
]

export function suggestCategoryWithConfidence(
  description: string,
  categories: { id: string; name: string; type: string }[],
  userRules?: { keyword: string; categoryId: string }[],
): CategorySuggestion {
  const desc = description.toLowerCase()
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const expenseIds = new Set(expenseCategories.map((c) => c.id))

  if (userRules) {
    for (const rule of userRules) {
      if (
        rule.keyword &&
        desc.includes(rule.keyword.toLowerCase()) &&
        expenseIds.has(rule.categoryId)
      ) {
        return {
          categoryId: rule.categoryId,
          confidence: IMPORT_CONFIDENCE.USER_RULE,
          source: 'user_rule',
        }
      }
    }
  }

  for (const [keywords, catName] of HARDCODED_CATEGORY_RULES) {
    if (keywords.some((k) => desc.includes(k))) {
      const cat = expenseCategories.find((c) => c.name === catName)
      if (cat) {
        return {
          categoryId: cat.id,
          confidence: IMPORT_CONFIDENCE.KEYWORD,
          source: 'keyword',
        }
      }
    }
  }

  const otros = expenseCategories.find((c) => c.name === 'Otros')
  const fallbackId = otros?.id ?? expenseCategories[0]?.id ?? null
  return {
    categoryId: fallbackId,
    confidence: fallbackId ? IMPORT_CONFIDENCE.FALLBACK : IMPORT_CONFIDENCE.OCR_UNCERTAIN,
    source: fallbackId ? 'fallback' : 'none',
  }
}

export function scoreImportRowConfidence(params: {
  suggestion: CategorySuggestion
  possibleDuplicate: boolean
  missingDate?: boolean
  forceNeedsReview?: boolean
}): { confidence: number; needsReview: boolean } {
  if (params.possibleDuplicate) {
    return { confidence: IMPORT_CONFIDENCE.DUPLICATE, needsReview: true }
  }

  let confidence = params.suggestion.confidence
  let needsReview = confidence < IMPORT_REVIEW_THRESHOLD || params.suggestion.source === 'fallback'

  if (params.missingDate || params.forceNeedsReview) {
    confidence = Math.min(confidence, IMPORT_CONFIDENCE.OCR_UNCERTAIN)
    needsReview = true
  }

  return { confidence, needsReview }
}

export function suggestCategory(
  description: string,
  categories: { id: string; name: string; type: string }[],
  userRules?: { keyword: string; categoryId: string }[],
): string | null {
  return suggestCategoryWithConfidence(description, categories, userRules).categoryId
}
