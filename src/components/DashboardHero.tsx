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

export const dashboardHeroShellClass =
  'flex min-h-[42dvh] w-full max-w-none flex-col bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] text-white'

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
      <span className="text-5xl font-bold tabular-nums tracking-tight md:text-6xl">
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
      <span className="text-5xl font-bold tabular-nums tracking-tight md:text-6xl">
        {amount < 0 ? `−${numeric}` : numeric}
      </span>
    </span>
  )
}

function HeroStatIcon({ name }: { name: 'wallet' | 'income' }) {
  const props = {
    className: 'h-3.5 w-3.5 shrink-0 text-white/70',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'wallet') {
    return (
      <svg {...props}>
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M3 7h18v4H3z" />
        <path d="M16 13h.01" />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  )
}

function HeroStat({
  label,
  amount,
  currencyConfig,
  icon,
  align = 'start',
}: {
  label: string
  amount: number
  currencyConfig: CurrencyConfig
  icon: 'wallet' | 'income'
  align?: 'start' | 'end'
}) {
  return (
    <div className={cn('min-w-0', align === 'end' && 'text-right')}>
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'end' && 'justify-end',
        )}
      >
        <HeroStatIcon name={icon} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">{label}</p>
      </div>
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
    <div className="flex flex-1 flex-col items-center justify-center py-5 text-center">
      <p className="text-xs text-white/80 underline decoration-white/30 underline-offset-4">
        {expensesLabel} · {periodTitle}
      </p>
      <div className="mt-3">{formatHeroAmount(totalExpenses, currencyConfig)}</div>
      {expensesDelta && (
        <p className={cn('mt-2.5 text-xs font-medium', heroDeltaTone[expensesDelta.tone])}>
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
      <HeroStat
        label="Saldo"
        amount={netBalance}
        currencyConfig={currencyConfig}
        icon="wallet"
      />
      <HeroStat
        label="Ingresos"
        amount={totalIncome}
        currencyConfig={currencyConfig}
        icon="income"
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
      className={dashboardHeroShellClass}
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
