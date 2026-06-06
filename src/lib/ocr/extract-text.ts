import { createWorker, PSM, type Worker } from 'tesseract.js'

export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024
const MIN_OCR_SIDE = 1100
const MAX_OCR_DIMENSION = 5000

export type OcrProgress = {
  status: string
  progress: number
}

let workerPromise: Promise<Worker> | null = null

async function getOcrWorker(onProgress?: (progress: OcrProgress) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (message) => {
        if (!onProgress) return
        onProgress({
          status: message.status,
          progress: typeof message.progress === 'number' ? message.progress : 0,
        })
      },
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      })
      return worker
    })
  }
  return workerPromise
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = url
  })
}

/** Escala capturas chicas y limita capturas muy largas para mantener tiempos razonables. */
export function scaleImageForOcr(width: number, height: number): { width: number; height: number } {
  let w = width
  let h = height
  const minSide = Math.min(w, h)

  if (minSide < MIN_OCR_SIDE) {
    const factor = Math.min(MIN_OCR_SIDE / minSide, 3)
    w = Math.round(w * factor)
    h = Math.round(h * factor)
  }

  const scaledMax = Math.max(w, h)
  if (scaledMax > MAX_OCR_DIMENSION) {
    const factor = MAX_OCR_DIMENSION / scaledMax
    w = Math.round(w * factor)
    h = Math.round(h * factor)
  }

  return { width: w, height: h }
}

function renderImageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const { width, height } = scaleImageForOcr(image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen para OCR.')
  ctx.drawImage(image, 0, 0, width, height)
  return canvas
}

export async function extractTextFromImageFile(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const maxMb = Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))
    throw new Error(`La imagen supera el tamaño máximo permitido (${maxMb} MB).`)
  }

  const image = await loadImageFromFile(file)
  const canvas = renderImageToCanvas(image)
  const worker = await getOcrWorker(onProgress)
  const result = await worker.recognize(canvas)
  return result.data.text
}

/** Solo para tests: libera el worker reutilizado entre importaciones. */
export async function terminateOcrWorkerForTests(): Promise<void> {
  if (!workerPromise) return
  const worker = await workerPromise
  await worker.terminate()
  workerPromise = null
}
