'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, LockKeyhole } from 'lucide-react'
import { login } from '@/services/auth'
import { Button, Card, Input, Spinner } from '@/components/ui/primitives'
import { toastError } from '@/components/ui/toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' }).then((response) => {
      if (response.ok) {
      router.push('/')
      }
    }).catch(() => undefined)
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(email.trim(), password)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in.')
      toastError(err?.message || 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 sm:p-6" suppressHydrationWarning>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-card">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">TEESGARAGE Admin Panel</h1>
          <p className="text-sm text-ink-3">Apparel store operations dashboard</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-xs text-danger">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-ink-4">
          TEESGARAGE Admin &bull; Staff access only
        </p>
      </div>
    </div>
  )
}
