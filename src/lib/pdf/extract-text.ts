import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

interface PdfTextItem {
  str: string
  transform: number[]
}

let workerConfigured = false

function ensurePdfWorker() {
  if (workerConfigured) return
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc
  workerConfigured = true
}

function isTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    'transform' in item &&
    typeof (item as PdfTextItem).str === 'string'
  )
}

/** Rebuild visual lines: pdf.js returns one fragment per text box, not per table row. */
export function extractLinesFromTextContent(content: { items: unknown[] }): string[] {
  const lines = new Map<number, { x: number; str: string }[]>()

  for (const item of content.items) {
    if (!isTextItem(item) || !item.str.trim()) continue

    const y = Math.round(item.transform[5])
    const row = lines.get(y) ?? []
    row.push({ x: item.transform[4], str: item.str.trim() })
    lines.set(y, row)
  }

  return [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.str)
        .join(' '),
    )
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  ensurePdfWorker()
  const pdf = await getDocument({ data: buffer }).promise
  const lines: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    lines.push(...extractLinesFromTextContent(content))
  }

  return lines.join('\n')
}
