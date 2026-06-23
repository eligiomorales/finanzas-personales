import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { AmountsVisibilityProvider } from '@/contexts/AmountsVisibilityContext'
import { ExpenseViewProvider } from '@/contexts/ExpenseViewContext'
import { MovementFiltersProvider } from '@/contexts/MovementFiltersContext'
import { DashboardPeriodProvider } from '@/contexts/DashboardPeriodContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MotionProvider } from '@/components/MotionProvider'
import { Layout } from '@/components/Layout'
import { LoadingState } from '@/components/ui/PageShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { MovementFormPage } from '@/pages/MovementFormPage'
import { BalancePage } from '@/pages/BalancePage'
import { BudgetPage } from '@/pages/BudgetPage'
import { AnalisisPage } from '@/pages/AnalisisPage'
import { TrendPage } from '@/pages/TrendPage'
import { ImportPage } from '@/pages/ImportPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CategorySettingsPage } from '@/pages/CategorySettingsPage'
import { LoginPage } from '@/pages/LoginPage'
import { CoupleSetupPage } from '@/pages/CoupleSetupPage'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="movimientos" element={<MovementsPage />} />
        <Route path="movimientos/nuevo" element={<MovementFormPage />} />
        <Route path="movimientos/editar/:id" element={<MovementFormPage />} />
        <Route path="balance" element={<BalancePage />} />
        <Route path="analisis" element={<AnalisisPage />}>
          <Route index element={<Navigate to="tendencias" replace />} />
          <Route path="presupuesto" element={<BudgetPage embedded />} />
          <Route path="tendencias" element={<TrendPage />} />
          <Route path="categorias" element={<Navigate to="tendencias" replace />} />
        </Route>
        <Route path="categorias" element={<Navigate to="/analisis/tendencias" replace />} />
        <Route path="presupuesto" element={<Navigate to="/analisis/presupuesto" replace />} />
        <Route path="importar" element={<ImportPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="configuracion/categorias" element={<CategorySettingsPage />} />
      </Route>
    </Routes>
  )
}

function AuthenticatedApp() {
  const { configured, loading, session, membership } = useAuth()

  if (!configured) {
    return (
      <AmountsVisibilityProvider>
        <ExpenseViewProvider>
          <DashboardPeriodProvider>
            <MovementFiltersProvider>
              <AppRoutes />
            </MovementFiltersProvider>
          </DashboardPeriodProvider>
        </ExpenseViewProvider>
      </AmountsVisibilityProvider>
    )
  }

  if (loading) {
    return <LoadingState message="Cargando sesión…" />
  }

  if (!session) {
    return <LoginPage />
  }

  if (!membership) {
    return <CoupleSetupPage />
  }

  return (
    <AmountsVisibilityProvider>
      <ExpenseViewProvider>
        <DashboardPeriodProvider>
          <MovementFiltersProvider>
            <DataProvider>
              <AppRoutes />
            </DataProvider>
          </MovementFiltersProvider>
        </DashboardPeriodProvider>
      </ExpenseViewProvider>
    </AmountsVisibilityProvider>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MotionProvider>
          <AuthenticatedApp />
        </MotionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
