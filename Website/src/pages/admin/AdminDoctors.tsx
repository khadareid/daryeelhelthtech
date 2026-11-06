import { FormEvent, useEffect, useMemo, useState } from "react"
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
  AdminPanel,
  AdminStatusPill,
  AdminTable,
  AdminToolbar,
  adminInputClass,
  adminSelectClass,
} from "@/components/admin/AdminShell"
import {
  useCreateAdminDoctorMutation,
  useDeleteAdminDoctorMutation,
  useGetAdminDoctorsQuery,
  useGetPendingDoctorsQuery,
  useUpdateAdminDoctorMutation,
  useVerifyDoctorMutation,
} from "@/Redex/service/admin/AdminApi"
import type { Doctor } from "@/Redex/types/Types"
import { enumLabel } from "@/lib/enums"

type Tab = "all" | "pending" | "add"

const STATUS_FILTERS = [
  { id: "", label: "All" },
  { id: "VERIFIED", label: "Verified" },
  { id: "PENDING", label: "Pending" },
  { id: "REJECTED", label: "Rejected" },
  { id: "SUSPENDED", label: "Suspended" },
]

const emptyCreate = {
  fullName: "",
  email: "",
  password: "Daryeel@123",
  phone: "",
  specialty: "",
  licenseNumber: "",
  clinicName: "",
  city: "Hargeisa",
  consultationFee: "",
  qualification: "",
  bio: "",
  videoConsultationEnabled: true,
  chatConsultationEnabled: false,
  isAvailable: true,
}

function asList(data: unknown): Doctor[] {
  if (Array.isArray(data)) return data as Doctor[]
  if (data && typeof data === "object" && "items" in data) {
    return ((data as { items?: Doctor[] }).items ?? []) as Doctor[]
  }
  return []
}

function feeOf(d: Doctor) {
  const n = Number(d.consultationFee || 0)
  if (n <= 0) return "Free"
  return `${d.currency || "USD"} ${n.toFixed(2)}`
}

export default function AdminDoctors() {
  const [tab, setTab] = useState<Tab>("all")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<"view" | "edit" | null>(null)
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editForm, setEditForm] = useState({
    fullName: "",
    specialty: "",
    phone: "",
    licenseNumber: "",
    clinicName: "",
    city: "",
    country: "",
    consultationFee: "",
    qualification: "",
    bio: "",
    yearsExperience: "",
    verificationStatus: "VERIFIED",
    consultationEnabled: true,
    videoConsultationEnabled: false,
    chatConsultationEnabled: false,
    isAvailable: true,
    isActive: true,
  })

  const { data: allData, isLoading: loadingAll, refetch: refetchAll } =
    useGetAdminDoctorsQuery({
      limit: 20,
      page,
      q: q || undefined,
      status: status || undefined,
    })
  const {
    data: pendingData,
    isLoading: loadingPending,
    refetch: refetchPending,
  } = useGetPendingDoctorsQuery()
  const [verify, { isLoading: verifying }] = useVerifyDoctorMutation()
  const [createDoctor, { isLoading: creating }] = useCreateAdminDoctorMutation()
  const [updateDoctor, { isLoading: saving }] = useUpdateAdminDoctorMutation()
  const [deleteDoctor, { isLoading: deleting }] = useDeleteAdminDoctorMutation()

  const allDoctors = useMemo(() => {
    if (allData && typeof allData === "object" && "items" in allData) {
      return allData.items ?? []
    }
    return asList(allData)
  }, [allData])
  const meta =
    allData && typeof allData === "object" && "meta" in allData
      ? (allData as {
          meta?: { page?: number; totalPages?: number; total?: number }
        }).meta
      : undefined
  const pending = useMemo(() => asList(pendingData), [pendingData])

  useEffect(() => {
    if (!selected || mode !== "edit") return
    setEditForm({
      fullName: selected.fullName || "",
      specialty: selected.specialty || "",
      phone: selected.user?.phone || "",
      licenseNumber: selected.licenseNumber || "",
      clinicName: selected.clinicName || "",
      city: selected.city || "",
      country: selected.country || "",
      consultationFee:
        selected.consultationFee != null
          ? String(selected.consultationFee)
          : "",
      qualification: selected.qualification || "",
      bio: selected.bio || "",
      yearsExperience:
        selected.yearsExperience != null
          ? String(selected.yearsExperience)
          : "",
      verificationStatus: String(selected.verificationStatus || "PENDING"),
      consultationEnabled: selected.consultationEnabled !== false,
      videoConsultationEnabled: Boolean(selected.videoConsultationEnabled),
      chatConsultationEnabled: Boolean(selected.chatConsultationEnabled),
      isAvailable: selected.isAvailable !== false,
      isActive: selected.isActive !== false,
    })
  }, [selected, mode])

  const refresh = () => {
    refetchAll()
    refetchPending()
  }

  const actVerify = async (id: string, verificationStatus: string) => {
    try {
      await verify({ id, verificationStatus }).unwrap()
      toast.success(`Doctor ${verificationStatus.toLowerCase()}`)
      refresh()
    } catch {
      toast.error("Could not update verification")
    }
  }

  const openView = (d: Doctor) => {
    setSelected(d)
    setMode("view")
  }

  const openEdit = (d: Doctor) => {
    setSelected(d)
    setMode("edit")
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (
      !createForm.fullName ||
      !createForm.email ||
      !createForm.specialty ||
      !createForm.password
    ) {
      toast.error("Name, email, password, and specialty are required")
      return
    }
    try {
      await createDoctor({
        fullName: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone || undefined,
        specialty: createForm.specialty,
        licenseNumber: createForm.licenseNumber || undefined,
        clinicName: createForm.clinicName || undefined,
        city: createForm.city || undefined,
        consultationFee: createForm.consultationFee
          ? Number(createForm.consultationFee)
          : undefined,
        qualification: createForm.qualification || undefined,
        bio: createForm.bio || undefined,
        videoConsultationEnabled: createForm.videoConsultationEnabled,
        chatConsultationEnabled: createForm.chatConsultationEnabled,
        isAvailable: createForm.isAvailable,
      }).unwrap()
      toast.success("Doctor created and verified")
      setCreateForm(emptyCreate)
      setTab("all")
      refresh()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not create doctor")
    }
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      await updateDoctor({
        id: selected.id,
        body: {
          fullName: editForm.fullName,
          specialty: editForm.specialty,
          phone: editForm.phone || null,
          licenseNumber: editForm.licenseNumber || null,
          clinicName: editForm.clinicName || null,
          city: editForm.city || null,
          country: editForm.country || null,
          consultationFee: editForm.consultationFee
            ? Number(editForm.consultationFee)
            : 0,
          qualification: editForm.qualification || null,
          bio: editForm.bio || null,
          yearsExperience: editForm.yearsExperience
            ? Number(editForm.yearsExperience)
            : null,
          verificationStatus: editForm.verificationStatus,
          consultationEnabled: editForm.consultationEnabled,
          videoConsultationEnabled: editForm.videoConsultationEnabled,
          chatConsultationEnabled: editForm.chatConsultationEnabled,
          isAvailable: editForm.isAvailable,
          isActive: editForm.isActive,
        },
      }).unwrap()
      toast.success("Doctor updated")
      setMode(null)
      refresh()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not update doctor")
    }
  }

  const onDelete = async (d: Doctor) => {
    if (
      !window.confirm(
        `Deactivate ${d.fullName}? They will be suspended and hidden from the directory.`
      )
    ) {
      return
    }
    try {
      await deleteDoctor(d.id).unwrap()
      toast.success("Doctor deactivated")
      setMode(null)
      setSelected(null)
      refresh()
    } catch {
      toast.error("Could not deactivate doctor")
    }
  }

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="Admin"
        title="Doctors"
        subtitle="Verify clinicians, set fees, and manage visit features — live doctor records."
        meta={
          meta?.total != null
            ? `${Number(meta.total).toLocaleString()} doctors`
            : undefined
        }
        actions={
          <Button size="sm" className="h-8 rounded-lg" onClick={() => setTab("add")}>
            Add doctor
          </Button>
        }
      />

      <AdminToolbar>
        <AdminFilterChips
          value={tab}
          onChange={(id) => setTab(id as Tab)}
          items={[
            { id: "all", label: "All doctors" },
            { id: "pending", label: `Pending (${pending.length})` },
            { id: "add", label: "Add doctor" },
          ]}
        />
      </AdminToolbar>

      {tab === "add" ? (
        <AdminPanel title="Create doctor account">
        <form onSubmit={onCreate} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Creates login + verified profile. Fee 0 = free visits.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Full name" required>
              <Input
                value={createForm.fullName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, fullName: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="Email" required>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="Password" required>
              <Input
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="Phone">
              <Input
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Specialty" required>
              <Input
                value={createForm.specialty}
                onChange={(e) =>
                  setCreateForm({ ...createForm, specialty: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="License number">
              <Input
                value={createForm.licenseNumber}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    licenseNumber: e.target.value,
                  })
                }
              />
            </AdminField>
            <AdminField label="Clinic">
              <Input
                value={createForm.clinicName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, clinicName: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="City">
              <Input
                value={createForm.city}
                onChange={(e) =>
                  setCreateForm({ ...createForm, city: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Consultation fee (USD)">
              <Input
                value={createForm.consultationFee}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    consultationFee: e.target.value,
                  })
                }
                placeholder="0 = free"
              />
            </AdminField>
            <AdminField label="Qualification">
              <Input
                value={createForm.qualification}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    qualification: e.target.value,
                  })
                }
              />
            </AdminField>
            <AdminField label="Bio" className="sm:col-span-2">
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-blue-100 px-3 py-2 text-sm"
                value={createForm.bio}
                onChange={(e) =>
                  setCreateForm({ ...createForm, bio: e.target.value })
                }
              />
            </AdminField>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.videoConsultationEnabled}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    videoConsultationEnabled: e.target.checked,
                  })
                }
              />
              Video visits
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.chatConsultationEnabled}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    chatConsultationEnabled: e.target.checked,
                  })
                }
              />
              Chat visits
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.isAvailable}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    isAvailable: e.target.checked,
                  })
                }
              />
              Available for booking
            </label>
          </div>
          <Button type="submit" className="h-8 rounded-lg" disabled={creating}>
            {creating ? "Creating…" : "Create & verify doctor"}
          </Button>
        </form>
        </AdminPanel>
      ) : null}

      {tab === "pending" ? (
        <>
          {loadingPending ? <Skeleton className="h-40 rounded-xl" /> : null}
          <AdminTable
            columns={["Doctor", "Specialty", "License", "Actions"]}
            empty={
              !loadingPending && pending.length === 0
                ? "No pending doctors."
                : undefined
            }
          >
            {pending.map((d) => (
              <tr key={d.id} className="border-t border-blue-50">
                <td className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-brand-dark">{d.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.user?.email || "—"}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-sm">{d.specialty}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {d.licenseNumber || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openView(d)}>
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={verifying}
                      onClick={() => actVerify(d.id, "VERIFIED")}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={verifying}
                      onClick={() => actVerify(d.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      ) : null}

      {tab === "all" ? (
        <>
          <AdminToolbar>
            <Input
              className="h-9 flex-1 rounded-lg border-blue-100 sm:min-w-[220px]"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Search name, specialty, email…"
            />
            <AdminFilterChips
              value={status}
              onChange={(id) => {
                setStatus(id)
                setPage(1)
              }}
              items={STATUS_FILTERS}
            />
          </AdminToolbar>
          {loadingAll ? <Skeleton className="h-40 rounded-xl" /> : null}
          <AdminTable
            columns={[
              "Doctor",
              "Specialty",
              "Fee",
              "Features",
              "Status",
              "Actions",
            ]}
            empty={
              !loadingAll && allDoctors.length === 0
                ? "No doctors yet. Use Add doctor to create one."
                : undefined
            }
            minWidth="980px"
          >
            {allDoctors.map((d) => (
              <tr key={d.id} className="border-t border-blue-50">
                <td className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-brand-dark">{d.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.user?.email || d.clinicName || "—"}
                    {d.city ? ` · ${d.city}` : ""}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-sm">{d.specialty}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {feeOf(d)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                  {[
                    d.consultationEnabled !== false ? "In-person" : null,
                    d.videoConsultationEnabled ? "Video" : null,
                    d.chatConsultationEnabled ? "Chat" : null,
                    d.isAvailable === false ? "Unavailable" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      {enumLabel(String(d.verificationStatus || "PENDING"))}
                    </Badge>
                    {d.isActive === false ? (
                      <AdminStatusPill tone="warn" label="Inactive" />
                    ) : (
                      <AdminStatusPill tone="ok" label="Active" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openView(d)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openEdit(d)}>
                      Edit
                    </Button>
                    {d.verificationStatus !== "VERIFIED" ? (
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={verifying}
                        onClick={() => actVerify(d.id, "VERIFIED")}
                      >
                        Verify
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        disabled={verifying}
                        onClick={() => actVerify(d.id, "SUSPENDED")}
                      >
                        Suspend
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      disabled={deleting}
                      onClick={() => onDelete(d)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
          <AdminPagination
            page={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            total={typeof meta?.total === "number" ? meta.total : undefined}
            onPage={setPage}
          />
        </>
      ) : null}

      <AdminDrawer
        open={mode === "view" && Boolean(selected)}
        title={selected?.fullName || "Doctor"}
        subtitle={selected?.specialty}
        onClose={() => setMode(null)}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Close
            </Button>
            <Button onClick={() => selected && openEdit(selected)}>Edit</Button>
          </>
        }
      >
        {selected ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Email" value={selected.user?.email || "—"} />
            <Row label="Phone" value={selected.user?.phone || "—"} />
            <Row label="Specialty" value={selected.specialty} />
            <Row label="Fee" value={feeOf(selected)} />
            <Row label="Clinic" value={selected.clinicName || "—"} />
            <Row
              label="Location"
              value={[selected.city, selected.country].filter(Boolean).join(", ") || "—"}
            />
            <Row label="License" value={selected.licenseNumber || "—"} />
            <Row
              label="Status"
              value={enumLabel(String(selected.verificationStatus || "PENDING"))}
            />
            <Row
              label="Features"
              value={[
                selected.consultationEnabled !== false ? "In-person" : null,
                selected.videoConsultationEnabled ? "Video" : null,
                selected.chatConsultationEnabled ? "Chat" : null,
                selected.isAvailable !== false ? "Available" : "Unavailable",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Row
              className="sm:col-span-2"
              label="Bio"
              value={selected.bio || "—"}
            />
          </dl>
        ) : null}
      </AdminDrawer>

      <AdminDrawer
        open={mode === "edit" && Boolean(selected)}
        title="Edit doctor"
        subtitle={selected?.user?.email}
        onClose={() => setMode(null)}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              disabled={deleting}
              onClick={() => selected && onDelete(selected)}
            >
              Deactivate
            </Button>
            <Button form="doctor-edit-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <form id="doctor-edit-form" onSubmit={onSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Full name" required>
              <input
                className={adminInputClass}
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="Specialty" required>
              <input
                className={adminInputClass}
                value={editForm.specialty}
                onChange={(e) =>
                  setEditForm({ ...editForm, specialty: e.target.value })
                }
                required
              />
            </AdminField>
            <AdminField label="Phone">
              <input
                className={adminInputClass}
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="License">
              <input
                className={adminInputClass}
                value={editForm.licenseNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, licenseNumber: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Clinic">
              <input
                className={adminInputClass}
                value={editForm.clinicName}
                onChange={(e) =>
                  setEditForm({ ...editForm, clinicName: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="City">
              <input
                className={adminInputClass}
                value={editForm.city}
                onChange={(e) =>
                  setEditForm({ ...editForm, city: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Consultation fee">
              <input
                className={adminInputClass}
                value={editForm.consultationFee}
                onChange={(e) =>
                  setEditForm({ ...editForm, consultationFee: e.target.value })
                }
                placeholder="0 = free"
              />
            </AdminField>
            <AdminField label="Years experience">
              <input
                className={adminInputClass}
                value={editForm.yearsExperience}
                onChange={(e) =>
                  setEditForm({ ...editForm, yearsExperience: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Qualification">
              <input
                className={adminInputClass}
                value={editForm.qualification}
                onChange={(e) =>
                  setEditForm({ ...editForm, qualification: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Verification">
              <select
                className={adminSelectClass}
                value={editForm.verificationStatus}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    verificationStatus: e.target.value,
                  })
                }
              >
                {["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"].map((s) => (
                  <option key={s} value={s}>
                    {enumLabel(s)}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Bio" className="sm:col-span-2">
              <textarea
                className="min-h-[80px] w-full rounded-xl border border-blue-100 px-3 py-2 text-sm"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
              />
            </AdminField>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["consultationEnabled", "In-person"],
                ["videoConsultationEnabled", "Video"],
                ["chatConsultationEnabled", "Chat"],
                ["isAvailable", "Available"],
                ["isActive", "Active"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editForm[key])}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </form>
      </AdminDrawer>
    </div>
  )
}

function Row({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
