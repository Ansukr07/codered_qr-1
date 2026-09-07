'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/config/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabaseBrowser) {
      setError('Supabase browser authentication is not configured.')
      return
    }
    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('This invitation link is invalid or has expired.')
      return
    }

    supabaseBrowser.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) setError(sessionError.message)
        else setReady(true)
        window.history.replaceState({}, document.title, '/auth/callback')
      })
  }, [])

  async function handleSetPassword(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setSaving(true)
    if (!supabaseBrowser) return setError('Supabase browser authentication is not configured.')
    const { error: updateError } = await supabaseBrowser.auth.updateUser({ password })
    setSaving(false)
    if (updateError) return setError(updateError.message)
    router.replace('/login?invited=1')
  }

  if (error) return <main className="min-h-screen grid place-items-center p-6 text-center"><p>{error}</p></main>
  if (!ready) return <main className="min-h-screen grid place-items-center p-6"><p>Preparing your CodeRed invitation…</p></main>

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={handleSetPassword} className="w-full max-w-md space-y-5 rounded-xl border p-8">
        <div>
          <h1 className="text-2xl font-bold">Set your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Finish setting up your CodeRed account.</p>
        </div>
        <input className="w-full rounded-md border bg-transparent p-3" type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required />
        <input className="w-full rounded-md border bg-transparent p-3" type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="w-full rounded-md bg-red-600 p-3 font-semibold text-white disabled:opacity-50" disabled={saving}>
          {saving ? 'Saving…' : 'Complete account setup'}
        </button>
      </form>
    </main>
  )
}
