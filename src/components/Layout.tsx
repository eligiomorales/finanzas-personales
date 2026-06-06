import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/Card'
import { useExpenseViewMode } from '@/contexts/ExpenseViewContext'
import { cn } from '@/lib/utils'

type NavIconName = 'home' | 'movements' | 'balance' | 'categories' | 'budget' | 'import' | 'settings'

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

const navItems: { to: string; label: string; icon: NavIconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/movimientos', label: 'Movimientos', icon: 'movements' },
  { to: '/balance', label: 'Balance', icon: 'balance' },
  { to: '/presupuesto', label: 'Presupuesto', icon: 'budget' },
  { to: '/categorias', label: 'Categorías', icon: 'categories' },
  { to: '/importar', label: 'Importar', icon: 'import' },
]

export function Layout() {
  const location = useLocation()
  const { isPersonal } = useExpenseViewMode()
  const isFormPage = location.pathname.includes('/nuevo') || location.pathname.includes('/editar')
  const hideFab = isFormPage || location.pathname === '/presupuesto'

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50 md:max-w-2xl lg:max-w-4xl">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            Finanzas Pareja
            {isPersonal && location.pathname !== '/presupuesto' && (
              <Badge variant="info">Personal</Badge>
            )}
          </h1>
          {!isFormPage && (
            <NavLink
              to="/configuracion"
              className={({ isActive }) =>
                cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                )
              }
              aria-label="Ajustes"
            >
              <NavIcon name="settings" />
            </NavLink>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>

      {!isFormPage && (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="mx-auto flex max-w-lg justify-around px-2 py-2 md:max-w-2xl md:justify-center md:gap-1 md:px-4 lg:max-w-4xl">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors md:flex-row md:gap-2 md:px-3 md:text-sm',
                    isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700',
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
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-5 z-20 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Nuevo movimiento"
        >
          +
        </NavLink>
      )}
    </div>
  )
}
