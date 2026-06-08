import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { AmountsVisibilityProvider } from '@/contexts/AmountsVisibilityContext'
import { ExpenseViewProvider } from '@/contexts/ExpenseViewContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layout } from '@/components/Layout'
import { LoadingState } from '@/components/ui/PageShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { MovementFormPage } from '@/pages/MovementFormPage'
import { BalancePage } from '@/pages/BalancePage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { ImportPage } from '@/pages/ImportPage'
import { SettingsPage } from '@/pages/SettingsPage'
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
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="presupuesto" element={<BudgetPage />} />
        <Route path="importar" element={<ImportPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
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
          <PeriodProvider>
            <AppRoutes />
          </PeriodProvider>
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
        <PeriodProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </PeriodProvider>
      </ExpenseViewProvider>
    </AmountsVisibilityProvider>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
