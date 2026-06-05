import type { AppSettings, CurrencyCode, Movement } from '@/types'
import { formatCurrency } from '@/lib/utils'

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['ARS', 'USD']

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  ARS: 'Pesos (ARS)',
  USD: 'Dólares (USD)',
}

export interface CurrencyConfig {
  displayCurrency: CurrencyCode
  exchangeRateUsd: number
}

export function getCurrencyConfig(
  settings: Pick<AppSettings, 'displayCurrency' | 'defaultExchangeRateUsd'> | null | undefined,
): CurrencyConfig {
  return {
    displayCurrency: settings?.displayCurrency ?? 'ARS',
    exchangeRateUsd: settings?.defaultExchangeRateUsd ?? 1200,
  }
}

/** Convert an amount between ARS and USD using the global exchange rate (1 USD = X ARS). */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRateUsd: number,
): number {
  if (from === to) return amount
  if (from === 'USD' && to === 'ARS') return amount * exchangeRateUsd
  if (from === 'ARS' && to === 'USD') return amount / exchangeRateUsd
  return amount
}

/** Movement amount expressed in the active display currency. */
export function getAmountInView(
  movement: Pick<Movement, 'amount' | 'currency'>,
  config: CurrencyConfig,
): number {
  return convertAmount(movement.amount, movement.currency, config.displayCurrency, config.exchangeRateUsd)
}

export function formatInViewCurrency(amount: number, config: CurrencyConfig): string {
  return formatCurrency(amount, config.displayCurrency)
}

export function formatMovementInView(
  movement: Pick<Movement, 'amount' | 'currency'>,
  config: CurrencyConfig,
): string {
  const { primary, secondary } = formatMovementAmountLines(movement, config)
  if (!secondary) return primary
  return `${primary} (${secondary})`
}

export function formatMovementAmountLines(
  movement: Pick<Movement, 'amount' | 'currency'>,
  config: CurrencyConfig,
): { primary: string; secondary?: string } {
  const viewAmount = getAmountInView(movement, config)
  const primary = formatInViewCurrency(viewAmount, config)
  if (movement.currency === config.displayCurrency) return { primary }
  return {
    primary,
    secondary: formatCurrency(movement.amount, movement.currency),
  }
}

/** Format movement amount lines using a precomputed display amount (e.g. personal share). */
export function formatMovementAmountLinesForView(
  movement: Pick<Movement, 'amount' | 'currency'>,
  config: CurrencyConfig,
  displayAmount: number,
): { primary: string; secondary?: string } {
  const fullAmount = getAmountInView(movement, config)
  if (Math.abs(displayAmount - fullAmount) < 0.01) {
    return formatMovementAmountLines(movement, config)
  }
  return {
    primary: formatInViewCurrency(displayAmount, config),
    secondary: `Total ${formatInViewCurrency(fullAmount, config)}`,
  }
}

export function formatMovementAmount(movement: Pick<Movement, 'amount' | 'currency'>): string {
  return formatCurrency(movement.amount, movement.currency)
}

/** Migrate legacy settings from earlier schema versions. */
export function normalizeSettings(raw: Record<string, unknown>): AppSettings {
  const displayCurrency = (raw.displayCurrency ?? raw.baseCurrency ?? raw.currency ?? 'ARS') as CurrencyCode
  return {
    id: 'settings',
    personAName: String(raw.personAName ?? 'Persona A'),
    personBName: String(raw.personBName ?? 'Persona B'),
    displayCurrency: displayCurrency === 'USD' ? 'USD' : 'ARS',
    defaultExchangeRateUsd: Number(raw.defaultExchangeRateUsd ?? raw.exchangeRateUsd) || 1200,
  }
}

/** Backfill currency on movements from older backups/schema. */
export function normalizeMovement(raw: Record<string, unknown>): Movement {
  const currency = (raw.currency ?? 'ARS') as CurrencyCode
  const { exchangeRateToBase: _rate, baseCurrency: _base, ...rest } = raw
  return {
    ...(rest as unknown as Movement),
    currency: currency === 'USD' ? 'USD' : 'ARS',
  }
}

export function normalizePendingImport(raw: Record<string, unknown>) {
  const currency = (raw.currency ?? 'ARS') as CurrencyCode
  const { exchangeRateToBase: _rate, ...rest } = raw
  return {
    ...rest,
    currency: currency === 'USD' ? 'USD' : 'ARS',
  }
}
