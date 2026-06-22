import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const tabs = [
  { value: 'categorias', label: 'Categorías' },
  { value: 'tendencias', label: 'Tendencias' },
  { value: 'presupuesto', label: 'Presupuesto' },
] as const

type AnalisisTab = (typeof tabs)[number]['value']

function activeTab(pathname: string): AnalisisTab {
  if (pathname.includes('/presupuesto')) return 'presupuesto'
  if (pathname.includes('/tendencias')) return 'tendencias'
  return 'categorias'
}

export function AnalisisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = activeTab(location.pathname)

  return (
    <div className="space-y-4">
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
