import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminPasswordResetMutation,
  useGetAdminUserQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
} from '@/Redex/service/admin/AdminApi'

const ROLES = [
  'USER',
  'PATIENT',
  'DOCTOR',
  'NURSE',
  'MIDWIFE',
  'LAB_TECH',
  'PHARMACIST',
  'RECEPTIONIST',
  'ADMIN',
  'SUPER_ADMIN',
]

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useGetAdminUsersQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  })
  const { data: detail } = useGetAdminUserQuery(selectedId!, {
    skip: !selectedId,
  })
  const [updateUser, { isLoading: saving }] = useUpdateAdminUserMutation()
  const [resetPassword] = useAdminPasswordResetMutation()

  const users = data?.data ?? []
  const pagination = data?.pagination

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await updateUser({ id, body }).unwrap()
      toast.success('User updated')
      refetch()
    } catch (e: any) {
      toast.error(e?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, change roles, suspend, and reset passwords.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-2 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
          {isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
          {users.map((u: any) => (
            <article
              key={u.userid}
              className="flex flex-col gap-2 rounded-2xl border border-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <button
                type="button"
                className="min-w-0 text-left"
                onClick={() => setSelectedId(u.userid)}
              >
                <p className="font-heading font-semibold text-brand-dark">
                  {u.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.role}
                </p>
                <div className="mt-1 flex gap-1">
                  {u.isSuspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : u.isActive ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="secondary">Deactivated</Badge>
                  )}
                </div>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() =>
                    patch(u.userid, { isSuspended: !u.isSuspended })
                  }
                >
                  {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm(`Reset password for ${u.fullName}?`)) return
                    try {
                      const res = await resetPassword(u.userid).unwrap()
                      toast.success(
                        res?.result?.resetToken
                          ? `Reset token created (expires soon)`
                          : 'Password reset initiated',
                      )
                    } catch {
                      toast.error('Reset failed')
                    }
                  }}
                >
                  Reset PW
                </Button>
              </div>
            </article>
          ))}
          {users.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : null}
          <div className="flex items-center justify-between pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {pagination?.page ?? page} / {pagination?.totalPages ?? 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </section>

        <aside className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">
              Select a user to view details and change role.
            </p>
          ) : !detail ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-brand-dark">
                {detail.fullName}
              </h2>
              <p className="text-sm text-muted-foreground">{detail.email}</p>
              <p className="text-xs text-muted-foreground">
                Phone {detail.phone || '—'} · Last login{' '}
                {detail.lastLoginAt
                  ? new Date(detail.lastLoginAt).toLocaleString()
                  : '—'}
              </p>
              <label className="block text-xs font-semibold text-brand-dark">
                Role
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={detail.role}
                  onChange={(e) => patch(detail.userid, { role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-brand-bg p-3">
                  Appointments
                  <p className="font-heading text-lg font-bold">
                    {detail._count?.appointments ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-bg p-3">
                  Prescriptions
                  <p className="font-heading text-lg font-bold">
                    {detail._count?.prescriptions ?? 0}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() =>
                  patch(detail.userid, { isActive: !detail.isActive })
                }
              >
                {detail.isActive ? 'Deactivate account' : 'Activate account'}
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
