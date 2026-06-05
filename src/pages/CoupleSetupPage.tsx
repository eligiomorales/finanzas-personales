import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Label, FormGroup, StatusMessage } from '@/components/ui/Form'
import { Card } from '@/components/ui/Card'

export function CoupleSetupPage() {
  const { setupCouple, signOut, user, refreshMembership, membership } = useAuth()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void refreshMembership().finally(() => setCheckingExisting(false))
  }, [refreshMembership])

  if (checkingExisting || membership) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-slate-500">{checkingExisting ? 'Verificando tu pareja…' : 'Entrando…'}</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await setupCouple(mode, inviteCode)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo configurar la pareja',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configurar pareja</h1>
          <p className="mt-1 text-sm text-slate-600">
            Hola{user?.email ? `, ${user.email}` : ''}. Creá una pareja nueva o unite con un código de invitación.
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'create' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
            onClick={() => setMode('create')}
          >
            Crear pareja
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'join' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
            onClick={() => setMode('join')}
          >
            Unirme
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'join' && (
            <FormGroup>
              <Label htmlFor="inviteCode">Código de invitación</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ej: AB12CD34"
                required
                maxLength={12}
              />
            </FormGroup>
          )}

          {mode === 'create' && (
            <p className="text-sm text-slate-600">
              Vas a crear una pareja nueva. Después podés compartir el código de invitación con tu pareja desde
              Configuración.
            </p>
          )}

          {message && <StatusMessage tone={message.type}>{message.text}</StatusMessage>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando…' : mode === 'create' ? 'Crear pareja' : 'Unirme a la pareja'}
          </Button>
        </form>

        <button type="button" className="w-full text-sm text-slate-500 hover:text-slate-700" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </Card>
    </div>
  )
}
