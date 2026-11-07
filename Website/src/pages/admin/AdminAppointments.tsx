import { useMemo, useState } from "react"
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
  AdminTable,
  AdminToolbar,
  adminSelectClass,
} from "@/components/admin/AdminShell"
import {
  useGetAdminAppointmentsQuery,
  useUpdateAdminAppointmentMutation,
} from "@/Redex/service/admin/AdminApi"
import type { Appointment } from "@/Redex/types/Types"
import {
  APPOINTMENT_STATUS_OPTIONS,
  enumLabel,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/enums"

const FILTERS = [
  { id: "", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "COMPLETED", label: "Completed" },
]

function feeLabel(a: Appointment) {
  const amount = Number(a.consultationFee || 0)
  if (!a.paymentRequired || amount <= 0) return "Free"
  return `${a.currency || "USD"} ${amount.toFixed(2)}`
}

export default function AdminAppointments() {
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [editPay, setEditPay] = useState("")
  const [cancelReason, setCancelReason] = useState("")

  const { data, isLoading, refetch } = useGetAdminAppointmentsQuery({
    limit: 20,
    page,
    status: status || undefined,
  })
  const [updateAppt, { isLoading: saving }] = useUpdateAdminAppointmentMutation()
  const items = useMemo(() => {
    const rows = data?.items ?? []
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (a) =>
        a.user?.fullName?.toLowerCase().includes(q) ||
        a.doctor?.fullName?.toLowerCase().includes(q) ||
        a.appointmentCode?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q)
    )
  }, [data, search])
  const meta = data?.meta

  const open = (a: Appointment) => {
    setSelected(a)
    setEditStatus(String(a.status))
    setEditPay(String(a.paymentStatus || "PENDING"))
    setCancelReason("")
  }

  const save = async () => {
    if (!selected) return
    try {
      await updateAppt({
        id: selected.id,
        status: editStatus,
        paymentStatus: editPay,
        cancellationReason:
          editStatus === "CANCELLED" || editStatus === "REJECTED"
            ? cancelReason || undefined
            : undefined,
      }).unwrap()
      toast.success("Booking updated")
      setSelected(null)
      refetch()
    } catch {
      toast.error("Could not update booking")
    }
  }

  const quickStatus = async (id: string, next: string) => {
    try {
      await updateAppt({ id, status: next }).unwrap()
      toast.success(`Marked ${enumLabel(next)}`)
      refetch()
    } catch {
      toast.error("Update failed")
    }
  }

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="Admin"
        title="Bookings"
        subtitle="Confirm, cancel, and update visit status — live appointment records."
        meta={
          meta?.total != null
            ? `${meta.total.toLocaleString()} bookings`
            : undefined
        }
      />

      <AdminToolbar>
        <Input
          className="h-9 flex-1 rounded-lg border-blue-100 sm:min-w-[220px]"
          placeholder="Search patient, doctor, code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminFilterChips
          value={status}
          onChange={(id) => {
            setStatus(id)
            setPage(1)
          }}
          items={FILTERS}
        />
      </AdminToolbar>

      {isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}

      <AdminTable
        columns={[
          "Patient",
          "Doctor",
          "When",
          "Fee",
          "Visit",
          "Payment",
          "Actions",
        ]}
        empty={
          !isLoading && items.length === 0
            ? "No appointments in this filter."
            : undefined
        }
        minWidth="980px"
      >
        {items.map((a) => {
          const pending = ["PENDING", "RESCHEDULE_REQUESTED"].includes(
            String(a.status)
          )
          return (
            <tr key={a.id} className="border-t border-blue-50">
              <td className="px-3 py-2.5">
                <p className="text-sm font-semibold text-brand-dark">
                  {a.user?.fullName || "Patient"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {a.appointmentCode}
                  {a.reason ? ` · ${a.reason}` : ""}
                </p>
              </td>
              <td className="px-3 py-2.5">
                <p className="text-sm font-medium">{a.doctor?.fullName || "—"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.doctor?.specialty || ""}
                </p>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {new Date(a.scheduledAt).toLocaleString()}
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="secondary" className="text-[10px]">
                  {feeLabel(a)}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="secondary" className="text-[10px]">
                  {enumLabel(String(a.status))}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="secondary" className="text-[10px]">
                  {enumLabel(String(a.paymentStatus || "PENDING"))}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => open(a)}>
                    View
                  </Button>
                  {pending ? (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={saving}
                      onClick={() => quickStatus(a.id, "CONFIRMED")}
                    >
                      Confirm
                    </Button>
                  ) : null}
                  {!["CANCELLED", "COMPLETED", "REJECTED"].includes(
                    String(a.status)
                  ) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      disabled={saving}
                      onClick={() => quickStatus(a.id, "CANCELLED")}
                    >
                      Cancel
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
        open={Boolean(selected)}
        title="Booking details"
        subtitle={selected?.appointmentCode}
        onClose={() => setSelected(null)}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Row
                label="Patient"
                value={selected.user?.fullName || "Patient"}
              />
              <Row
                label="Doctor"
                value={selected.doctor?.fullName || "—"}
              />
              <Row
                label="When"
                value={new Date(selected.scheduledAt).toLocaleString()}
              />
              <Row label="Fee" value={feeLabel(selected)} />
              <Row
                className="sm:col-span-2"
                label="Reason"
                value={selected.reason || "—"}
              />
            </dl>
            <AdminField label="Visit status">
              <select
                className={adminSelectClass}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {APPOINTMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Payment status">
              <select
                className={adminSelectClass}
                value={editPay}
                onChange={(e) => setEditPay(e.target.value)}
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </AdminField>
            {editStatus === "CANCELLED" || editStatus === "REJECTED" ? (
              <AdminField label="Cancellation reason">
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Optional note"
                />
              </AdminField>
            ) : null}
          </div>
        ) : null}
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
