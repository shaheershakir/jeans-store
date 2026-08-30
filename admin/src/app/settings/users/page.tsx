'use client'

import * as React from 'react'
import { Plus, ShieldCheck, Trash2, Edit2 } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveAdminUser, deleteAdminUser, setAdminUserStatus } from '@/services/admin'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Avatar, Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { roleById } from '@/lib/permissions'
import type { AdminUser } from '@/lib/types'

export default function AdminUsersPage() {
  const adminUsers = useAdminStore((s) => s.data.adminUsers)
  const roles = useAdminStore((s) => s.data.roles)
  const session = useAdminStore((s) => s.session)

  const [editUser, setEditUser] = React.useState<AdminUser | null | 'new'>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [roleId, setRoleId] = React.useState<number>(1)
  const [status, setStatus] = React.useState<'Active' | 'Inactive'>('Active')
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setName('')
    setEmail('')
    setRoleId(roles[0]?.id ?? 1)
    setStatus('Active')
    setEditUser('new')
  }

  const handleOpenEdit = (u: AdminUser) => {
    setName(u.name)
    setEmail(u.email)
    setRoleId(u.roleId)
    setStatus(u.status)
    setEditUser(u)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return toastError('Name and email are required.')

    try {
      setLoading(true)
      const id = editUser === 'new' ? Date.now() : editUser?.id ?? Date.now()
      const user: AdminUser = {
        id,
        name: name.trim(),
        email: email.trim(),
        roleId: Number(roleId),
        status,
        lastLoginAt: editUser !== 'new' ? editUser?.lastLoginAt ?? null : null,
      }

      await saveAdminUser(user)
      toastSuccess(`Admin account "${name}" saved.`)
      setEditUser(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save admin user.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: 'Active' | 'Inactive') => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    try {
      setLoading(true)
      await setAdminUserStatus(id, nextStatus)
      toastSuccess(`Admin status updated to ${nextStatus}.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, uName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${uName}"?`)) return
    try {
      setLoading(true)
      await deleteAdminUser(id)
      toastSuccess(`Deleted admin "${uName}".`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete user.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Admin Users" description="Manage team members, roles, and administrative access">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Admin User
        </Button>
      </PageHeader>

      <PageContent>
        {/* Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editUser === 'new' ? 'Invite Admin User' : `Edit Admin User "${name}"`}
                </h3>
                <button onClick={() => setEditUser(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Full Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Connor" />
                </Field>

                <Field label="Email Address" required>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@infitjeans.com" />
                </Field>

                <Field label="Assigned Role">
                  <Select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Account Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Account
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Login</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {adminUsers.map((u) => {
                  const role = roleById(u.roleId)
                  const isCurrent = session?.userId === u.id

                  return (
                    <tr key={u.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <span>{u.name}</span>
                            {isCurrent && <span className="ml-2 text-[10px] text-primary font-normal">(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{u.email}</td>
                      <td className="px-4 py-3 font-medium text-ink">{role?.name ?? 'Admin'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={u.status === 'Active' ? 'success' : 'neutral'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-3">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isCurrent && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              disabled={loading}
                            >
                              {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(u)}>
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(u.id, u.name)}>
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
