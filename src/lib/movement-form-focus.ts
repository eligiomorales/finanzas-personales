/** Shared ref so focus retries from a user tap can reach the amount field after navigation. */
let amountInput: HTMLInputElement | null = null
let pendingFocusFromGesture = false

export const MOVEMENT_FORM_FOCUS_AMOUNT_STATE = { focusAmount: true } as const

export type MovementFormLocationState = {
  focusAmount?: boolean
}

const FOCUS_RETRY_DELAYS_MS = [0, 50, 150, 300, 500]

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function registerAmountInput(el: HTMLInputElement | null) {
  amountInput = el
  if (el && pendingFocusFromGesture) {
    focusAmountInput(el)
  }
}

function resolveAmountInput(): HTMLInputElement | null {
  if (amountInput) return amountInput
  const el = document.getElementById('amount')
  return el instanceof HTMLInputElement ? el : null
}

/** iOS Safari often ignores programmatic focus unless readonly is toggled around it. */
export function focusAmountInput(el: HTMLInputElement) {
  const wasReadOnly = el.readOnly
  el.readOnly = true
  el.focus({ preventScroll: true })

  window.setTimeout(() => {
    el.readOnly = wasReadOnly
    el.focus({ preventScroll: true })
    el.setSelectionRange(el.value.length, el.value.length)
  }, 100)
}

/** Call synchronously from a click/tap handler before navigating to the new movement form. */
export function scheduleAmountFocusFromUserGesture() {
  pendingFocusFromGesture = true
  window.setTimeout(() => {
    pendingFocusFromGesture = false
  }, 1200)

  const tryFocus = () => {
    const el = resolveAmountInput()
    if (!el) return
    focusAmountInput(el)
  }

  for (const delay of FOCUS_RETRY_DELAYS_MS) {
    window.setTimeout(tryFocus, delay)
  }
}

export function shouldFocusAmountFromNavigation(state: unknown): boolean {
  return Boolean((state as MovementFormLocationState | null)?.focusAmount)
}
