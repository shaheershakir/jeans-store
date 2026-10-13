'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import { login, loginAs } from '@/services/auth'
import { useAdminStore } from '@/store/admin-store'
import { Button, Card, Input, Spinner } from '@/components/ui/primitives'
import { toastError } from '@/components/ui/toast'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const adminUsers = useAdminStore((s) => s.data.adminUsers)
  const session = useAdminStore((s) => s.session)

  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
    if (session) {
      router.push('/')
    }
  }, [session, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your admin email.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(email.trim())
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in.')
      toastError(err?.message || 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (userId: number) => {
    try {
      setLoading(true)
      setError(null)
      await loginAs(userId)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Quick login failed.')
      toastError(err?.message || 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 sm:p-6" suppressHydrationWarning>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white shadow-card">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">INFIT Admin Panel</h1>
          <p className="text-sm text-ink-3">Jeans commerce operations dashboard</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-ink mb-1">
                Admin Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@infitjeans.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-xs text-danger">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : 'Sign in to Dashboard'}
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divider" />
            </div>
            <span className="relative bg-surface px-3 text-xs text-ink-3">
              Or quick test with demo accounts
            </span>
          </div>

          <div className="space-y-2">
            {mounted &&
              adminUsers.slice(0, 4).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user.id)}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-lg border border-line p-3 text-left transition-colors hover:bg-surface-subtle disabled:opacity-50"
                >
                  <div>
                    <p className="text-xs font-semibold text-ink">{user.name}</p>
                    <p className="text-[11px] text-ink-3">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    Login <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
          </div>
        </Card>

        <p className="text-center text-xs text-ink-4">
          INFIT Admin Panel v0.1.0 &bull; Simulated Environment
        </p>
      </div>
    </div>
  )
}
