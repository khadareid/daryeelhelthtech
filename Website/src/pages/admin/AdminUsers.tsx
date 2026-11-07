import { FormEvent, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AdminDrawer,
  AdminField,
  AdminFilterChips,
  AdminPageHeader,
  AdminPagination,
  AdminStatusPill,
  AdminTable,
  AdminToolbar,
  adminInputClass,
  adminSelectClass,
} from "@/components/admin/AdminShell"
import {
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminUserQuery,
  useGetAdminUsersQuery,
  useResetAdminUserPasswordMutation,
  useUpdateAdminUserMutation,
} from "@/Redex/service/admin/AdminApi"
import type { RootState } from "@/Redex/store/store"
import type { User } from "@/Redex/types/Types"
import { enumLabel } from "@/lib/enums"

const ROLES = ["USER", "ADMIN", "SUPER_ADMIN"]

const emptyForm = {
  fullName: "",
  email: "",
  password: "Daryeel@123",
  phone: "",
  role: "USER",
}

export default function AdminUsers() {
  const session = useSelector((s: RootState) => s.userInfo)
  const isSuper = String(session.role || "").toUpperCase() === "SUPER_ADMIN"
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(() => searchParams.get("search") || "")
  const [role, setRole] = useState("")
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<
    "view" | "edit" | "create" | "password" | null
  >(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [newPassword, setNewPassword] = useState("Daryeel@123")
  const [suspendReason, setSuspendReason] = useState("")

  const { data, isLoading, refetch } = useGetAdminUsersQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
  })
  const { data: detail, isFetching: loadingDetail } = useGetAdminUserQuery(
    selected?.userid || "",
    { skip: !selected?.userid || mode !== "view" }
  )
  const [updateUser, { isLoading: saving }] = useUpdateAdminUserMutation()
  const [createUser, { isLoading: creating }] = useCreateAdminUserMutation()
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation()
  const [resetPassword, { isLoading: resetting }] =
    useResetAdminUserPasswordMutation()

  const users = data?.items ?? []
  const meta = data?.meta
  const viewUser = (detail as User & Record<string, unknown>) || selected

  useEffect(() => {
    const q = searchParams.get("search")
    if (q != null) {
      setSearch(q)
      setPage(1)
    }
  }, [searchParams])

  useEffect(() => {
    if (mode === "edit" && selected) {
      setForm({
        fullName: selected.fullName || "",
        email: selected.email || "",
        password: "",
        phone: selected.phone || "",
        role: String(selected.role || "USER"),
      })
    }
    if (mode === "create") setForm(emptyForm)
    if (mode === "password") setNewPassword("Daryeel@123")
  }, [mode, selected])

  const openView = (u: User) => {
    setSelected(u)
    setMode("view")
  }

  const openEdit = (u: User) => {
    setSelected(u)
    setMode("edit")
  }

  const openPassword = (u: User) => {
    setSelected(u)
    setMode("password")
  }

  const canResetPassword = (u: User) => {
    const target = String(u.role || "").toUpperCase()
    if (isSuper) return true
    return target === "USER"
  }

  const creatableRoles = isSuper
    ? ROLES
    : ROLES.filter((r) => r !== "SUPER_ADMIN")

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Name, email, and password are required")
      return
    }
    try {
      await createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      }).unwrap()
      toast.success("User created")
      setMode(null)
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not create user")
    }
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      await updateUser({
        id: selected.userid,
        body: {
          fullName: form.fullName,
          phone: form.phone || null,
          role: form.role,
        },
      }).unwrap()
      toast.success("User updated")
      setMode(null)
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Update failed")
    }
  }

  const onResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    try {
      await resetPassword({
        id: selected.userid,
        newPassword: newPassword.trim(),
      }).unwrap()
      toast.success(`Password updated for ${selected.fullName}`)
      setMode(null)
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not reset password")
    }
  }

  const toggleSuspend = async (u: User) => {
    const next = !u.isSuspended
    try {
      await updateUser({
        id: u.userid,
        body: {
          isSuspended: next,
          suspensionReason: next
            ? suspendReason || "Suspended by admin"
            : undefined,
        },
      }).unwrap()
      toast.success(next ? "User suspended" : "User unsuspended")
      setSuspendReason("")
      refetch()
      if (selected?.userid === u.userid) {
        setSelected({ ...u, isSuspended: next })
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not update status")
    }
  }

  const onDelete = async (u: User) => {
    if (
      !window.confirm(
        `Delete ${u.fullName}? This soft-deletes the account (SUPER_ADMIN only).`
      )
    ) {
      return
    }
    try {
      await deleteUser(u.userid).unwrap()
      toast.success("User deleted")
      setMode(null)
      setSelected(null)
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not delete user")
    }
  }

  const counts = (viewUser as { _count?: Record<string, number> })?._count

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={isSuper ? "Super Admin" : "Admin"}
        title="Users"
        subtitle="View, edit, suspend, and support accounts — live database records."
        meta={
          meta?.total != null
            ? `${meta.total.toLocaleString()} users in directory`
            : undefined
        }
        actions={
          <Button
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => {
              setSelected(null)
              setMode("create")
            }}
          >
            Add user
          </Button>
        }
      />

      <AdminToolbar>
        <Input
          className="h-9 flex-1 rounded-lg border-blue-100 sm:min-w-[220px]"
          placeholder="Search name, email, phone, health ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <AdminFilterChips
          value={role}
          onChange={(id) => {
            setRole(id)
            setPage(1)
          }}
          items={[
            { id: "", label: "All roles" },
            ...ROLES.map((r) => ({ id: r, label: enumLabel(r) })),
          ]}
        />
      </AdminToolbar>

      {isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}

      <AdminTable
        columns={["User", "Contact", "Role", "Activity", "Status", "Actions"]}
        empty={!isLoading && users.length === 0 ? "No users found." : undefined}
        minWidth="960px"
      >
        {users.map((u) => {
          const row = u as User & {
            _count?: { appointments?: number; payments?: number }
            doctor?: { specialty?: string; verificationStatus?: string }
          }
          return (
            <tr key={u.userid} className="border-t border-blue-50">
              <td className="px-3 py-2.5">
                <p className="text-sm font-semibold text-brand-dark">{u.fullName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {u.healthId || u.userid.slice(0, 8)}
                  {row.doctor?.specialty
                    ? ` · Dr · ${row.doctor.specialty}`
                    : ""}
                </p>
              </td>
              <td className="px-3 py-2.5 text-sm">
                <p>{u.email}</p>
                <p className="text-[11px] text-muted-foreground">
                  {u.phone || "No phone"}
                </p>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="secondary" className="text-[10px]">
                  {enumLabel(String(u.role))}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                {row._count?.appointments ?? 0} visits ·{" "}
                {row._count?.payments ?? 0} payments
              </td>
              <td className="px-3 py-2.5">
                {u.isSuspended ? (
                  <AdminStatusPill tone="danger" label="Suspended" />
                ) : u.isActive === false ? (
                  <AdminStatusPill tone="warn" label="Inactive" />
                ) : (
                  <AdminStatusPill tone="ok" label="Active" />
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openView(u)}>
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openEdit(u)}>
                    Edit
                  </Button>
                  {canResetPassword(u) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => openPassword(u)}
                    >
                      Password
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={saving}
                    onClick={() => toggleSuspend(u)}
                  >
                    {u.isSuspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  {isSuper ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      disabled={deleting}
                      onClick={() => onDelete(u)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          )
        })}
      </AdminTable>

      <AdminPagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onPage={setPage}
      />

      <AdminDrawer
        open={mode === "view" && Boolean(selected)}
        title={viewUser?.fullName || "User"}
        subtitle="Full account & activity"
        onClose={() => setMode(null)}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Close
            </Button>
            {selected && canResetPassword(selected) ? (
              <Button variant="outline" onClick={() => openPassword(selected)}>
                Change password
              </Button>
            ) : null}
            <Button onClick={() => selected && openEdit(selected)}>Edit</Button>
          </>
        }
      >
        {loadingDetail ? <Skeleton className="h-40 rounded-xl" /> : null}
        {viewUser ? (
          <div className="space-y-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row label="Email" value={viewUser.email} />
              <Row label="Phone" value={viewUser.phone || "—"} />
              <Row label="Health ID" value={viewUser.healthId || "—"} />
              <Row label="Role" value={enumLabel(String(viewUser.role))} />
              <Row
                label="Status"
                value={
                  viewUser.isSuspended
                    ? "Suspended"
                    : viewUser.isActive === false
                      ? "Inactive"
                      : "Active"
                }
              />
              <Row
                label="Email verified"
                value={viewUser.emailVerified ? "Yes" : "No"}
              />
              <Row
                label="City"
                value={[viewUser.city, viewUser.country].filter(Boolean).join(", ") || "—"}
              />
              <Row
                label="Last login"
                value={
                  viewUser.lastLoginAt
                    ? new Date(viewUser.lastLoginAt).toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Created"
                value={
                  viewUser.createdAt
                    ? new Date(viewUser.createdAt).toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Language"
                value={viewUser.language || "—"}
              />
            </dl>

            {counts ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity totals
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Visits", counts.appointments],
                    ["Payments", counts.payments],
                    ["Consults", counts.consultations],
                    ["Records", counts.medicalRecords],
                    ["Labs", counts.labResults],
                    ["Meds", counts.medications],
                    ["Family", counts.familyMembers],
                    ["Alerts", counts.notifications],
                  ].map(([label, n]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl border border-blue-50 bg-brand-light/40 px-3 py-2"
                    >
                      <p className="text-[10px] uppercase text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-semibold text-brand-dark">
                        {typeof n === "number" ? n : 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(viewUser as { doctor?: { specialty?: string; verificationStatus?: string; clinicName?: string } }).doctor ? (
              <div className="rounded-xl border border-blue-50 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Doctor profile
                </p>
                <p className="mt-1 font-medium">
                  {
                    (viewUser as { doctor?: { specialty?: string } }).doctor
                      ?.specialty
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {enumLabel(
                    String(
                      (viewUser as { doctor?: { verificationStatus?: string } })
                        .doctor?.verificationStatus || "PENDING"
                    )
                  )}
                  {(viewUser as { doctor?: { clinicName?: string } }).doctor
                    ?.clinicName
                    ? ` · ${(viewUser as { doctor?: { clinicName?: string } }).doctor?.clinicName}`
                    : ""}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent visits
              </p>
              <div className="space-y-1.5">
                {(
                  (viewUser as {
                    appointments?: Array<{
                      id: string
                      appointmentCode?: string
                      scheduledAt: string
                      status: string
                      doctor?: { fullName?: string }
                    }>
                  }).appointments ?? []
                ).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-blue-50 px-3 py-2 text-xs"
                  >
                    <p className="font-medium">
                      {a.doctor?.fullName || "Doctor"} · {a.appointmentCode}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(a.scheduledAt).toLocaleString()} ·{" "}
                      {enumLabel(a.status)}
                    </p>
                  </div>
                ))}
                {!((viewUser as { appointments?: unknown[] }).appointments || [])
                  .length ? (
                  <p className="text-xs text-muted-foreground">No visits yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </AdminDrawer>

      <AdminDrawer
        open={mode === "edit" && Boolean(selected)}
        title="Edit user"
        subtitle={selected?.email}
        onClose={() => setMode(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button form="user-edit-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <form id="user-edit-form" onSubmit={onSave} className="space-y-3">
          <AdminField label="Full name" required>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </AdminField>
          <AdminField label="Role">
            <select
              className={adminSelectClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={!isSuper && form.role === "SUPER_ADMIN"}
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {enumLabel(r)}
                </option>
              ))}
            </select>
          </AdminField>
          {!selected?.isSuspended ? (
            <AdminField label="Suspend reason (if suspending later)">
              <Input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Optional note"
              />
            </AdminField>
          ) : null}
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={mode === "password" && Boolean(selected)}
        title="Change password"
        subtitle={selected ? `${selected.fullName} · ${selected.email}` : ""}
        onClose={() => setMode(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              form="user-password-form"
              type="submit"
              disabled={resetting}
            >
              {resetting ? "Saving…" : "Set new password"}
            </Button>
          </>
        }
      >
        <form id="user-password-form" onSubmit={onResetPassword} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Support can set a temporary password so the user can sign in again.
            Share it securely.
          </p>
          <AdminField label="New password" required>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </AdminField>
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={mode === "create"}
        title="Add user"
        subtitle="Create a patient or staff account"
        onClose={() => setMode(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button form="user-create-form" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create user"}
            </Button>
          </>
        }
      >
        <form id="user-create-form" onSubmit={onCreate} className="space-y-3">
          <AdminField label="Full name" required>
            <input
              className={adminInputClass}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Email" required>
            <input
              className={adminInputClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Password" required>
            <input
              className={adminInputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Phone">
            <input
              className={adminInputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </AdminField>
          <AdminField label="Role">
            <select
              className={adminSelectClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {enumLabel(r)}
                </option>
              ))}
            </select>
          </AdminField>
        </form>
      </AdminDrawer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
