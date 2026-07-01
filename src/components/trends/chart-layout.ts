/** SVG plot height for cash-flow chart (month summary sits below) */
export const TREND_CHART_H = 220

/** Horizontal gap subtracted per bar slot: barW = plotW/months.length - this */
export const TREND_BAR_SLOT_INSET = 10

/** Fixed height of the month summary slot — always reserved, content fades in/out */
export const TREND_MONTH_SUMMARY_H = 'h-[88px]'

/** Ritmo de gasto fills the carousel body — no month summary block */
export const TREND_PACE_CHART_H = 288

/** Min body height: chart (220) + summary slot (88) + gap (12+1+12=25) — keeps carousel cards equal */
export const TREND_CAROUSEL_BODY_MIN_H = 'min-h-[333px]'
