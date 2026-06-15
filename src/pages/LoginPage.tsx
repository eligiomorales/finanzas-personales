import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Label, FormGroup, StatusMessage } from '@/components/ui/Form'
import { Card } from '@/components/ui/Card'
import { PageShell } from '@/components/ui/PageShell'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

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
    <PageShell>
      <Card className="w-full max-w-md space-y-6 p-6">
        <div>
          <img src="/duo-wordmark.svg" alt="duo" className="mb-3 h-9 w-auto" />
          <p className="text-sm text-stone-600">
            {mode === 'login' ? 'Iniciá sesión para sincronizar datos' : 'Creá tu cuenta para empezar'}
          </p>
        </div>

        <SegmentedControl
          aria-label="Modo de autenticación"
          options={[
            { value: 'login' as const, label: 'Iniciar sesión' },
            { value: 'signup' as const, label: 'Registrarse' },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v)
            setMessage(null)
          }}
        />

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
      </Card>
    </PageShell>
  )
}
