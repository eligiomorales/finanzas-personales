import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const tabs = [
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'categorias', label: 'Categorías' },
] as const

type AnalisisTab = (typeof tabs)[number]['value']

function activeTab(pathname: string): AnalisisTab {
  return pathname.includes('/presupuesto') ? 'presupuesto' : 'categorias'
}

export function AnalisisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = activeTab(location.pathname)

  return (
    <div className="space-y-4">
      <PageHeader title="Análisis" />
      <SegmentedControl
        aria-label="Sección de análisis"
        options={[...tabs]}
        value={tab}
        onChange={(value) => navigate(`/analisis/${value}`)}
      />
      <Outlet />
    </div>
  )
}
