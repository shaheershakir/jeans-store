'use client'

import * as React from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Card, Input } from '@/components/ui/primitives'

export default function AuditLogsPage() {
  const auditLog = useAdminStore((s) => s.data.auditLog)
  const [query, setQuery] = React.useState('')

  const filteredLogs = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return auditLog

    return auditLog.filter(
      (log) =>
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q)
    )
  }, [auditLog, query])

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable system activity history and security audit trail" />

      <PageContent>
        <Card className="p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="text"
              placeholder="Search by operator, action, entity..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Operator</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="px-4 py-3 text-ink-3">
                      {new Date(log.at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{log.userName}</td>
                    <td className="px-4 py-3 text-primary font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-ink-2 font-mono">{log.entity} #{log.entityId}</td>
                    <td className="px-4 py-3 text-ink-2 max-w-md">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
