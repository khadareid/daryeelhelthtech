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
  useGetAdminPaymentsQuery,
  useUpdateAdminPaymentMutation,
} from "@/Redex/service/admin/AdminApi"
import type { Payment } from "@/Redex/types/Types"
import { enumLabel, PAYMENT_STATUS_OPTIONS } from "@/lib/enums"
import { localPayLabel } from "@/lib/payments"

const FILTERS = [
  { id: "", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "PAID", label: "Paid / Free" },
  { id: "FAILED", label: "Failed" },
  { id: "REFUNDED", label: "Refunded" },
]

function money(p: Payment) {
  const amount = Number(p.amount || 0)
  if (amount <= 0 || p.provider === "FREE") return "Free"
  return `${p.currency || "USD"} ${amount.toFixed(2)}`
}

export default function AdminPayments() {
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Payment | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [refundReason, setRefundReason] = useState("")

  const { data, isLoading, refetch } = useGetAdminPaymentsQuery({
    limit: 20,
    page,
    status: status || undefined,
  })
  const [updatePay, { isLoading: saving }] = useUpdateAdminPaymentMutation()
  const items = useMemo(() => {
    const rows = data?.items ?? []
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (p) =>
        p.user?.fullName?.toLowerCase().includes(q) ||
        p.paymentReference?.toLowerCase().includes(q) ||
        p.appointment?.appointmentCode?.toLowerCase().includes(q) ||
        p.appointment?.doctor?.fullName?.toLowerCase().includes(q) ||
        localPayLabel(p.provider, String(p.method || ""))
          .toLowerCase()
          .includes(q)
    )
  }, [data, search])
  const meta = data?.meta

  const open = (p: Payment) => {
    setSelected(p)
    setEditStatus(String(p.status))
    setRefundReason(p.refundReason || "")
  }

  const save = async () => {
    if (!selected) return
    try {
      await updatePay({
        id: selected.id,
        status: editStatus,
        refundReason:
          editStatus === "REFUNDED" ? refundReason || undefined : undefined,
      }).unwrap()
      toast.success("Payment updated")
      setSelected(null)
      refetch()
    } catch {
      toast.error("Could not update payment")
    }
  }

  const markPaid = async (id: string) => {
    try {
      await updatePay({ id, status: "PAID" }).unwrap()
      toast.success("Marked paid")
      refetch()
    } catch {
      toast.error("Could not update payment")
    }
  }

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="Admin"
        title="Payments"
        subtitle="Invoices, Zaad / eDahab / cash — mark paid or refund from live records."
        meta={
          meta?.total != null
            ? `${meta.total.toLocaleString()} payment records`
            : undefined
        }
      />

      <AdminToolbar>
        <Input
          className="h-9 flex-1 rounded-lg border-blue-100 sm:min-w-[220px]"
          placeholder="Search patient, reference, method…"
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
          "Visit",
          "Amount",
          "Method",
          "Status",
          "Actions",
        ]}
        empty={
          !isLoading && items.length === 0 ? "No payments found." : undefined
        }
        minWidth="920px"
      >
        {items.map((p) => (
          <tr key={p.id} className="border-t border-blue-50">
            <td className="px-3 py-2.5">
              <p className="text-sm font-semibold text-brand-dark">
                {p.user?.fullName || "Patient"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {p.paymentReference || p.id.slice(0, 8)}
              </p>
            </td>
            <td className="px-3 py-2.5">
              <p className="text-sm font-medium">
                {p.appointment?.doctor?.fullName || "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {p.appointment?.appointmentCode || "No visit linked"}
              </p>
            </td>
            <td className="px-3 py-2.5 text-sm font-semibold">{money(p)}</td>
            <td className="px-3 py-2.5 text-xs text-muted-foreground">
              {Number(p.amount || 0) <= 0 || p.provider === "FREE"
                ? "Free"
                : localPayLabel(p.provider, String(p.method || ""))}
              {p.transactionId ? (
                <p className="mt-0.5 text-[10px]">{p.transactionId}</p>
              ) : null}
            </td>
            <td className="px-3 py-2.5">
              <Badge variant="secondary" className="text-[10px]">
                {enumLabel(String(p.status))}
              </Badge>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => open(p)}>
                  View
                </Button>
                {String(p.status) === "PENDING" ? (
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={saving}
                    onClick={() => markPaid(p.id)}
                  >
                    Mark paid
                  </Button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onPage={setPage}
      />

      <AdminDrawer
        open={Boolean(selected)}
        title="Payment invoice"
        subtitle={selected?.paymentReference || selected?.id.slice(0, 10)}
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
            <div className="rounded-2xl border border-dashed border-blue-200 bg-slate-50/80 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Patient
                  </p>
                  <p className="font-semibold">
                    {selected.user?.fullName || "Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.appointment?.doctor?.fullName || "Visit"}
                    {selected.appointment?.appointmentCode
                      ? ` · ${selected.appointment.appointmentCode}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">
                    Amount
                  </p>
                  <p className="font-heading text-2xl font-bold">
                    {money(selected)}
                  </p>
                </div>
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Row
                label="Method"
                value={
                  Number(selected.amount || 0) <= 0 || selected.provider === "FREE"
                    ? "Free"
                    : localPayLabel(
                        selected.provider,
                        String(selected.method || "")
                      )
                }
              />
              <Row
                label="Transaction"
                value={selected.transactionId || "—"}
              />
              <Row
                label="Created"
                value={
                  selected.createdAt
                    ? new Date(selected.createdAt).toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Paid at"
                value={
                  selected.paidAt
                    ? new Date(selected.paidAt).toLocaleString()
                    : "—"
                }
              />
            </dl>
            <AdminField label="Status">
              <select
                className={adminSelectClass}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </AdminField>
            {editStatus === "REFUNDED" ? (
              <AdminField label="Refund reason">
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Why was this refunded?"
                />
              </AdminField>
            ) : null}
          </div>
        ) : null}
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
