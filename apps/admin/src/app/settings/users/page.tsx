'use client'

import { useAdminStore } from '@/store/admin-store'
import { logout } from '@/services/auth'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader } from '@/components/ui/primitives'
import { toastError } from '@/components/ui/toast'

export default function AdminAccessPage() {
  const session = useAdminStore((state) => state.session)

  const signOut = async () => {
    try {
      await logout()
      window.location.assign('/login')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Could not sign out.')
    }
  }

  return (
    <div>
      <PageHeader title="Administrator access" description="Review the account currently signed in to this dashboard." />
      <PageContent>
        <Card className="max-w-2xl space-y-4 p-5">
          <CardHeader title="Signed-in administrator" subtitle="This dashboard uses one server-managed administrator account." />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="mt-1 text-sm font-medium">{session?.userName ?? 'Loading…'}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 text-sm font-medium">{session?.userEmail ?? 'Loading…'}</dd></div>
          </dl>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Account access is managed by deployment configuration.</p>
            <p className="mt-1">There is no public registration or invitation flow. To rotate the administrator credentials, update the API environment values for <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code>, then redeploy.</p>
          </div>
          <div><Button type="button" variant="secondary" onClick={() => void signOut()}>Sign out</Button></div>
        </Card>
      </PageContent>
    </div>
  )
}
