import { NavLink, useLocation } from 'react-router-dom'
import { AnimatedRoutes } from '@/components/AnimatedRoutes'
import { Badge } from '@/components/ui/Card'
import { useAmountsVisibility, useAmountsVisible } from '@/contexts/AmountsVisibilityContext'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { LayoutHeaderProvider, useLayoutHeaderContext } from '@/contexts/LayoutHeaderContext'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'

type NavIconName =
  | 'home'
  | 'movements'
  | 'balance'
  | 'analysis'
  | 'categories'
  | 'budget'
  | 'import'
  | 'settings'

function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const props = {
    className: cn('h-5 w-5', className),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      )
    case 'movements':
      return (
        <svg {...props}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      )
    case 'balance':
      return (
        <svg {...props}>
          <path d="M12 3v18M7 8h10M6 12h12M7 16h10" />
        </svg>
      )
    case 'analysis':
      return (
        <svg {...props}>
          <path d="M4 20V10M4 10h16M8 18v-4M12 18V8M16 18v-6" />
          <path d="M4 4h16" />
        </svg>
      )
    case 'categories':
      return (
        <svg {...props}>
          <path d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
        </svg>
      )
    case 'budget':
      return (
        <svg {...props}>
          <path d="M4 20V10M4 10h16M8 18v-4M12 18V8M16 18v-6" />
        </svg>
      )
    case 'import':
      return (
        <svg {...props}>
          <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      )
  }
}

function EyeIcon({ visible, className }: { visible: boolean; className?: string }) {
  const props = {
    className: cn('h-5 w-5', className),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (visible) {
    return (
      <svg {...props}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx={12} cy={12} r={3} />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="M10.7 10.7a3 3 0 0 0 4.2 4.2M9.9 5.5A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-4.1 5.2M6.1 6.1C3.5 7.8 2 12 2 12a18.5 18.5 0 0 0 5.2 5.2M3 3l18 18" />
    </svg>
  )
}

const navItems: { to: string; label: string; icon: NavIconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/movimientos', label: 'Movimientos', icon: 'movements' },
  { to: '/balance', label: 'Balance', icon: 'balance' },
  { to: '/analisis', label: 'Análisis', icon: 'analysis' },
  { to: '/importar', label: 'Importar', icon: 'import' },
]

function RoutedContent() {
  const amountsVisible = useAmountsVisible()

  return (
    <AnimatedRoutes outletKey={amountsVisible ? 'amounts-visible' : 'amounts-hidden'} />
  )
}

function AppChrome() {
  const location = useLocation()
  const { shouldAnimate } = useMotionPreferences()
  const { isPersonal } = useExpenseViewMode()
  const { visible: amountsVisible, toggle: toggleAmountsVisibility } = useAmountsVisibility()
  const { active: header } = useLayoutHeaderContext()
  const isFormPage = location.pathname.includes('/nuevo') || location.pathname.includes('/editar')
  const hideFab = isFormPage || location.pathname.includes('/analisis/presupuesto')
  const showPersonalBadge =
    isPersonal &&
    !location.pathname.includes('/analisis/presupuesto') &&
    !location.pathname.startsWith('/balance') &&
    !location.pathname.startsWith('/importar')

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-surface-50 md:max-w-2xl lg:max-w-4xl">
      <header className="sticky top-0 z-10 bg-surface-50 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img src="/duo-wordmark.svg" alt="duo" className="h-10 w-auto shrink-0" />
            {(header.leading || header.title || header.subtitle) && (
              <div className="flex min-w-0 items-center gap-1.5">
                {header.leading}
                {(header.title || header.subtitle) && (
              <div className="min-w-0">
                {header.title && (
                  <div className="flex items-baseline gap-1.5">
                    <h1
                      className={cn(
                        'truncate leading-none',
                        header.leading
                          ? 'text-base font-semibold text-stone-700'
                          : 'text-sm font-medium text-stone-600',
                      )}
                    >
                      {header.title}
                    </h1>
                    {showPersonalBadge && (
                      <Badge variant="info">Personal</Badge>
                    )}
                  </div>
                )}
                {header.subtitle && (
                  <p className="mt-0.5 truncate text-xs leading-none text-stone-500">
                    {header.subtitle}
                  </p>
                )}
              </div>
                )}
              </div>
            )}
          </div>
          {!isFormPage && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleAmountsVisibility}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  focusRing,
                  amountsVisible
                    ? 'text-stone-500 hover:bg-surface-100 hover:text-stone-700'
                    : 'bg-brand-50 text-brand-600',
                )}
                aria-label={amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
                aria-pressed={!amountsVisible}
              >
                <EyeIcon visible={amountsVisible} />
              </button>
              <NavLink
                to="/configuracion"
                className={({ isActive }) =>
                  cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    focusRing,
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-stone-500 hover:bg-surface-100 hover:text-stone-700',
                  )
                }
                aria-label="Ajustes"
              >
                <NavIcon name="settings" />
              </NavLink>
            </div>
          )}
        </div>
        {header.toolbar && (
          <div className="mt-2 flex items-center justify-end gap-2 overflow-x-auto pb-0.5">
            {header.toolbar}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] pt-2">
        <RoutedContent />
      </main>

      {!isFormPage && (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/80 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="mx-auto flex max-w-lg justify-around px-1 py-1.5 md:max-w-2xl md:justify-center md:gap-0.5 md:px-4 lg:max-w-4xl">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors md:flex-row md:gap-2 md:px-3 md:text-sm',
                    focusRing,
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-500 hover:text-stone-700',
                  )
                }
              >
                <NavIcon name={item.icon} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {!hideFab && (
        <NavLink
          to="/movimientos/nuevo"
          className={cn(
            'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-5 z-20',
            'flex h-[52px] w-[52px] items-center justify-center rounded-full',
            'bg-brand-600 text-2xl text-white shadow-lg shadow-brand-600/25',
            shouldAnimate && 'transition-transform hover:scale-105 active:scale-95',
            focusRing,
          )}
          aria-label="Nuevo movimiento"
        >
          +
        </NavLink>
      )}
    </div>
  )
}

export function Layout() {
  return (
    <LayoutHeaderProvider>
      <AppChrome />
    </LayoutHeaderProvider>
  )
}
