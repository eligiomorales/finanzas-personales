import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Label, FormGroup, StatusMessage } from '@/components/ui/Form'
import { Card } from '@/components/ui/Card'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        setMessage({
          type: 'success',
          text: 'Cuenta creada. Revisá tu email si la confirmación está activada, o iniciá sesión.',
        })
        setMode('login')
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo completar la autenticación',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finanzas Pareja</h1>
          <p className="mt-1 text-sm text-slate-600">
            {mode === 'login' ? 'Iniciá sesión para sincronizar datos' : 'Creá tu cuenta para empezar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormGroup>

          {message && <StatusMessage tone={message.type}>{message.text}</StatusMessage>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <button
          type="button"
          className="w-full text-sm text-brand-600 hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setMessage(null)
          }}
        >
          {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </Card>
    </div>
  )
}
