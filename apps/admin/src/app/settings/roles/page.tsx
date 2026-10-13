'use client'

import * as React from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader, Badge } from '@/components/ui/primitives'
import { ROLE_DEFS } from '@/lib/permissions'

export default function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Overview of Role-Based Access Control (RBAC) definitions and module permissions" />

      <PageContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_DEFS.map((role) => (
            <Card key={role.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-divider pb-2">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {role.name}
                </h3>
                <Badge tone="primary">{role.permissions.length} perms</Badge>
              </div>

              <p className="text-xs text-ink-2 leading-snug">{role.description}</p>

              <div className="pt-2 border-t border-divider space-y-1">
                <span className="text-[11px] font-semibold text-ink-3">Granted Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="rounded bg-surface-subtle border border-line px-1.5 py-0.5 text-[10px] font-mono text-ink-2">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContent>
    </div>
  )
}
