/** Shared ref so focus retries from a user tap can reach the amount field after navigation. */
let amountInput: HTMLInputElement | null = null

export const MOVEMENT_FORM_FOCUS_AMOUNT_STATE = { focusAmount: true } as const

export type MovementFormLocationState = {
  focusAmount?: boolean
}

export function registerAmountInput(el: HTMLInputElement | null) {
  amountInput = el
}

function resolveAmountInput(): HTMLInputElement | null {
  if (amountInput) return amountInput
  const el = document.getElementById('amount')
  return el instanceof HTMLInputElement ? el : null
}

/** Call synchronously from a click/tap handler before navigating to the new movement form. */
export function scheduleAmountFocusFromUserGesture() {
  const tryFocus = () => {
    const el = resolveAmountInput()
    if (!el) return
    el.focus({ preventScroll: true })
  }

  for (const delay of [0, 50, 150, 300]) {
    window.setTimeout(tryFocus, delay)
  }
}

export function shouldFocusAmountFromNavigation(state: unknown): boolean {
  return Boolean((state as MovementFormLocationState | null)?.focusAmount)
}
