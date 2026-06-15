import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { seedDatabase } from '@/db/seed'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { LoadingState } from '@/components/ui/PageShell'
import './index.css'

function Bootstrap() {
  const [ready, setReady] = useState(isSupabaseConfigured())

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setReady(true)
      return
    }
    seedDatabase().then(() => setReady(true))
  }, [])

  if (!ready) {
    return <LoadingState message="Cargando…" />
  }

  if (isSupabaseConfigured()) {
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
