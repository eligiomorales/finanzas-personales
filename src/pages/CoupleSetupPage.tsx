import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Label, FormGroup, StatusMessage } from '@/components/ui/Form'
import { Card } from '@/components/ui/Card'
import { LoadingState, PageShell } from '@/components/ui/PageShell'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

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
    return <LoadingState message={checkingExisting ? 'Verificando tu pareja…' : 'Entrando…'} />
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
    <PageShell>
      <Card className="w-full max-w-md space-y-6 p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Configurar pareja</h1>
          <p className="mt-1 text-sm text-stone-600">
            Hola{user?.email ? `, ${user.email}` : ''}. Creá una pareja nueva o unite con un código de invitación.
          </p>
        </div>

        <SegmentedControl
          aria-label="Modo de configuración de pareja"
          options={[
            { value: 'create' as const, label: 'Crear pareja' },
            { value: 'join' as const, label: 'Unirme' },
          ]}
          value={mode}
          onChange={setMode}
        />

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
            <p className="text-sm text-stone-600">
              Vas a crear una pareja nueva. Después podés compartir el código de invitación con tu pareja desde
              Configuración.
            </p>
          )}

          {message && <StatusMessage tone={message.type}>{message.text}</StatusMessage>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando…' : mode === 'create' ? 'Crear pareja' : 'Unirme a la pareja'}
          </Button>
        </form>

        <button type="button" className="w-full text-sm text-stone-500 hover:text-stone-700" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </Card>
    </PageShell>
  )
}
