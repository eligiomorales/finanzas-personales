import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { ExpenseViewProvider } from '@/contexts/ExpenseViewContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { MovementFormPage } from '@/pages/MovementFormPage'
import { BalancePage } from '@/pages/BalancePage'
import { CategoriesPage } from '@/pages/CategoriesPage'
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
      <ExpenseViewProvider>
        <PeriodProvider>
          <AppRoutes />
        </PeriodProvider>
      </ExpenseViewProvider>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando sesión…</p>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (!membership) {
    return <CoupleSetupPage />
  }

  return (
    <ExpenseViewProvider>
      <PeriodProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </PeriodProvider>
    </ExpenseViewProvider>
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
