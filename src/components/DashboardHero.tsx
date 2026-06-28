import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChromeToolbarActions } from '@/components/ChromeToolbarActions'
import type { MetricDelta } from '@/lib/dashboard-insights'
import { formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import { getAmountsVisible } from '@/lib/amounts-visibility'
import { motionDelays, motionVariants, toMotionSeconds } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/lib/utils'

const MotionDiv = motion.div

const heroDeltaTone = {
  positive: 'text-emerald-200',
  negative: 'text-red-200',
  neutral: 'text-white/70',
} as const

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: toMotionSeconds(motionDelays.short),
    },
  },
}

interface DashboardHeroProps {
  periodTitle: string
  totalExpenses: number
  totalIncome: number
  netBalance: number
  expensesDelta: MetricDelta | null
  currencyConfig: CurrencyConfig
  expensesLabel?: string
  showPersonalBadge?: boolean
}

function formatHeroAmount(amount: number, currencyConfig: CurrencyConfig): ReactNode {
  if (!getAmountsVisible()) {
    return (
      <span className="text-4xl font-bold tabular-nums tracking-tight md:text-5xl">
        {formatInViewCurrency(amount, currencyConfig)}
      </span>
    )
  }

  const numeric = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-sm font-medium text-white/80">{currencyConfig.displayCurrency}</span>
      <span className="text-4xl font-bold tabular-nums tracking-tight md:text-5xl">
        {amount < 0 ? `−${numeric}` : numeric}
      </span>
    </span>
  )
}

function HeroStat({
  label,
  amount,
  currencyConfig,
  align = 'start',
}: {
  label: string
  amount: number
  currencyConfig: CurrencyConfig
  align?: 'start' | 'end'
}) {
  return (
    <div className={cn('min-w-0', align === 'end' && 'text-right')}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-white">
        {formatInViewCurrency(amount, currencyConfig)}
      </p>
    </div>
  )
}

function HeroToolbar({ showPersonalBadge }: { showPersonalBadge: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <img
        src="/duo-wordmark.svg"
        alt="duo"
        className="h-8 w-auto shrink-0 brightness-0 invert"
      />
      <ChromeToolbarActions variant="hero" showPersonalBadge={showPersonalBadge} />
    </div>
  )
}

function HeroFocus({
  periodTitle,
  expensesLabel,
  totalExpenses,
  expensesDelta,
  currencyConfig,
}: Pick<
  DashboardHeroProps,
  'periodTitle' | 'expensesLabel' | 'totalExpenses' | 'expensesDelta' | 'currencyConfig'
>) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
      <p className="text-xs text-white/80 underline decoration-white/30 underline-offset-4">
        {expensesLabel} · {periodTitle}
      </p>
      <div className="mt-2">{formatHeroAmount(totalExpenses, currencyConfig)}</div>
      {expensesDelta && (
        <p className={cn('mt-2 text-xs font-medium', heroDeltaTone[expensesDelta.tone])}>
          {expensesDelta.text}
        </p>
      )}
    </div>
  )
}

function HeroFooter({
  netBalance,
  totalIncome,
  currencyConfig,
}: Pick<DashboardHeroProps, 'netBalance' | 'totalIncome' | 'currencyConfig'>) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-3">
      <HeroStat label="Saldo" amount={netBalance} currencyConfig={currencyConfig} />
      <HeroStat
        label="Ingresos"
        amount={totalIncome}
        currencyConfig={currencyConfig}
        align="end"
      />
    </div>
  )
}

export function DashboardHero({
  periodTitle,
  totalExpenses,
  totalIncome,
  netBalance,
  expensesDelta,
  currencyConfig,
  expensesLabel = 'Gastado',
  showPersonalBadge = false,
}: DashboardHeroProps) {
  const { shouldAnimate } = useMotionPreferences()

  const body = (
    <>
      <HeroToolbar showPersonalBadge={showPersonalBadge} />
      <HeroFocus
        periodTitle={periodTitle}
        expensesLabel={expensesLabel}
        totalExpenses={totalExpenses}
        expensesDelta={expensesDelta}
        currencyConfig={currencyConfig}
      />
      <HeroFooter
        netBalance={netBalance}
        totalIncome={totalIncome}
        currencyConfig={currencyConfig}
      />
    </>
  )

  return (
    <section
      className="flex min-h-[42dvh] flex-col rounded-b-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))] text-white"
      aria-label={`Resumen del mes: ${expensesLabel} ${periodTitle}`}
    >
      {shouldAnimate ? (
        <MotionDiv
          className="flex min-h-0 flex-1 flex-col"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <MotionDiv variants={motionVariants.blurIn}>
            <HeroToolbar showPersonalBadge={showPersonalBadge} />
          </MotionDiv>
          <MotionDiv variants={motionVariants.blurIn} className="flex flex-1 flex-col">
            <HeroFocus
              periodTitle={periodTitle}
              expensesLabel={expensesLabel}
              totalExpenses={totalExpenses}
              expensesDelta={expensesDelta}
              currencyConfig={currencyConfig}
            />
          </MotionDiv>
          <MotionDiv variants={motionVariants.blurIn}>
            <HeroFooter
              netBalance={netBalance}
              totalIncome={totalIncome}
              currencyConfig={currencyConfig}
            />
          </MotionDiv>
        </MotionDiv>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      )}
    </section>
  )
}
