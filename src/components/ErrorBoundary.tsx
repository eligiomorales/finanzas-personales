import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Form'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de aplicación:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Algo salió mal</h1>
            <p className="text-sm text-slate-600">
              La app encontró un error inesperado. Podés recargar la página o volver a iniciar sesión.
            </p>
            <p className="rounded-lg bg-slate-50 p-3 font-mono text-xs text-red-700 break-all">
              {this.state.error.message}
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={() => window.location.reload()}>
                Recargar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  this.setState({ error: null })
                  window.location.href = '/'
                }}
              >
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
