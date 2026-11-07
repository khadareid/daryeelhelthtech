import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useSelector } from "react-redux"
import {
  useCancelAppointmentMutation,
  useCreateAppointmentMutation,
  useGetMyAppointmentsQuery,
  useUpdateAppointmentMutation,
} from "@/Redex/service/appointments/AppointmentsApi"
import {
  doctorDisplayName,
  doctorPhoto,
  useGetMyDoctorProfileQuery,
  useListDoctorsQuery,
} from "@/Redex/service/doctors/DoctorsApi"
import {
  useCreateAllergyMutation,
  useCreateEmergencyContactMutation,
  useCreateFamilyMemberMutation,
  useCreateLabResultMutation,
  useCreateMedicationMutation,
  useCreateMedicalDocumentMutation,
  useCreateMedicalRecordMutation,
  useCreateVitalSignMutation,
  useDeleteAllergyMutation,
  useDeleteEmergencyContactMutation,
  useDeleteFamilyMemberMutation,
  useDeleteLabResultMutation,
  useDeleteMedicalDocumentMutation,
  useDeleteMedicalRecordMutation,
  useDeleteMedicationMutation,
  useGetEmergencyCardQuery,
  useListAllergiesQuery,
  useListEmergencyContactsQuery,
  useListFamilyMembersQuery,
  useListLabResultsQuery,
  useListMedicalDocumentsQuery,
  useListMedicalRecordsQuery,
  useListMedicationsQuery,
  useListPrescriptionsQuery,
  useListVitalSignsQuery,
  useUpsertEmergencyCardMutation,
} from "@/Redex/service/health/HealthApi"
import type { RootState } from "@/Redex/store/store"
import { isAdminRole, normalizeRole } from "./Sidebar"
import {
  useListNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/Redex/service/notifications/NotificationsApi"
import {
  useCreatePaymentMutation,
  useListPaymentsQuery,
  useUpdatePaymentMutation,
} from "@/Redex/service/care/CareApi"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnumSelect, FormField } from "@/components/ui/enum-select"
import {
  ALLERGY_SEVERITY_OPTIONS,
  ALLERGY_TYPE_OPTIONS,
  APPOINTMENT_STATUS_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  enumLabel,
  GENDER_OPTIONS,
  LAB_STATUS_OPTIONS,
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/enums"
import {
  BOOKING_TIME_SLOTS,
  combineDayAndSlot,
  nextBookingDays,
  toDateInputValue,
} from "@/lib/bookingSlots"
import {
  localPayLabel,
  type InvoiceDraft,
} from "@/lib/payments"
import { PayInvoiceDialog } from "@/components/payments/PayInvoiceDialog"
import { cn } from "@/lib/utils"
import type { Appointment } from "@/Redex/types/Types"

function visitFeeLabel(a: {
  paymentRequired?: boolean
  consultationFee?: number | string | null
  currency?: string
  paymentStatus?: string
}) {
  const amount = Number(a.consultationFee || 0)
  if (!a.paymentRequired || amount <= 0) return "Free"
  return `${a.currency || "USD"} ${amount.toFixed(2)}`
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

function SectionShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-brand-dark">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function DoctorsSection() {
  const [q, setQ] = useState("")
  const { data: doctors = [], isLoading, isError, refetch } = useListDoctorsQuery({
    limit: 50,
    search: q || undefined,
  })

  return (
    <SectionShell
      title="Doctors"
      subtitle="Verified clinicians on Daryeel — open a profile to see specialty, bio, and book"
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/doctors">Public directory</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/doctors/apply">Apply as doctor</Link>
          </Button>
        </div>
      }
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search specialty, name, city…"
        className="max-w-md"
      />
      {isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {isError ? (
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => {
          const fee = Number(d.consultationFee || 0)
          return (
            <Card key={d.id} className="border-blue-100">
              <CardContent className="flex gap-3 p-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={doctorPhoto(d)} />
                  <AvatarFallback>
                    {doctorDisplayName(d).slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-dark">
                    {doctorDisplayName(d)}
                  </p>
                  <p className="truncate text-sm font-medium text-primary">
                    {d.specialty}
                    {d.subSpecialty ? ` · ${d.subSpecialty}` : ""}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[d.clinicName, d.city].filter(Boolean).join(" · ") ||
                      "Somaliland"}
                    {" · "}
                    {fee <= 0 ? "Free" : `$${fee.toFixed(0)}`}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link to={`/doctors/${d.id}`}>View profile</Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 text-xs">
                      <Link to={`/doctors/${d.id}`}>Book visit</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {!isLoading && doctors.length === 0 ? (
        <Empty text="No doctors found yet." />
      ) : null}

      <Card className="border-dashed border-blue-200 bg-brand-light/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-brand-dark">
              Are you a clinician?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Submit your specialty, license, and clinic — admin will verify you.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/doctors/apply">Apply as doctor</Link>
          </Button>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function AppointmentsSection() {
  const session = useSelector((s: RootState) => s.userInfo)
  const role = normalizeRole(session.role)
  const { data: myDoctor } = useGetMyDoctorProfileQuery(undefined, {
    skip: !session.isAuthenticated,
  })
  const isDoctor = Boolean(myDoctor?.id)
  const [view, setView] = useState<"mine" | "inbox">("mine")

  useEffect(() => {
    if (isDoctor) setView("inbox")
  }, [isDoctor])

  const { data: myItems = [], isLoading: loadingMine, refetch: refetchMine } =
    useGetMyAppointmentsQuery({ limit: 40 })
  const {
    data: inboxItems = [],
    isLoading: loadingInbox,
    refetch: refetchInbox,
  } = useGetMyAppointmentsQuery(
    { limit: 40, as: "doctor" },
    { skip: !isDoctor }
  )

  const [cancelAppt] = useCancelAppointmentMutation()
  const [updateAppt, { isLoading: updating }] = useUpdateAppointmentMutation()
  const [createAppt, { isLoading: booking }] = useCreateAppointmentMutation()
  const [createPayment, { isLoading: paying }] = useCreatePaymentMutation()
  const { data: doctors = [] } = useListDoctorsQuery({ limit: 20 })
  const [doctorId, setDoctorId] = useState("")
  const days = useMemo(() => nextBookingDays(14), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState(BOOKING_TIME_SLOTS[1] || "08:20 AM")
  const [reason, setReason] = useState("")
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null)
  const selectedDoctor = doctors.find((d) => d.id === doctorId)
  const selectedFee = Number(selectedDoctor?.consultationFee || 0)
  const selectedIsFree = !selectedDoctor || selectedFee <= 0

  const items = view === "inbox" && isDoctor ? inboxItems : myItems
  const isLoading = view === "inbox" && isDoctor ? loadingInbox : loadingMine
  const canManageStatus = isAdminRole(role) || (isDoctor && view === "inbox")
  const refetch = () => {
    refetchMine()
    if (isDoctor) refetchInbox()
  }

  const openPayInvoice = (a: Appointment) => {
    setInvoice({
      appointmentId: a.id,
      appointmentCode: a.appointmentCode,
      doctorName: a.doctor?.fullName || "Doctor",
      patientName: a.user?.fullName,
      scheduledAt: a.scheduledAt,
      amount: Number(a.consultationFee || 0),
      currency: a.currency || "USD",
      reason: a.reason,
    })
  }

  const onBook = async (e: FormEvent) => {
    e.preventDefault()
    if (!doctorId || !slot) {
      toast.error("Pick a doctor and time (e.g. 8:20 AM)")
      return
    }
    try {
      const when = combineDayAndSlot(days[dayIndex], slot)
      await createAppt({
        doctorId,
        scheduledAt: when.toISOString(),
        reason: reason || undefined,
        consultationFee: selectedIsFree ? 0 : selectedFee,
        currency: selectedDoctor?.currency || "USD",
        paymentRequired: !selectedIsFree,
      }).unwrap()
      toast.success(
        selectedIsFree
          ? "Appointment requested — Free"
          : `Requested · pay later with Zaad / eDahab (${selectedFee.toFixed(2)})`
      )
      setReason("")
      setSlot(BOOKING_TIME_SLOTS[1] || "08:20 AM")
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not book")
    }
  }

  const confirm = async (id: string) => {
    try {
      await updateAppt({ id, data: { status: "CONFIRMED" } }).unwrap()
      toast.success("Visit confirmed")
      refetch()
    } catch {
      toast.error("Could not confirm")
    }
  }

  return (
    <SectionShell
      title="Visits"
      subtitle={
        isDoctor
          ? "Your bookings and patient requests waiting for confirmation"
          : "Book and manage your visits"
      }
      action={
        isDoctor ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === "inbox" ? "default" : "outline"}
              onClick={() => setView("inbox")}
            >
              Doctor inbox
            </Button>
            <Button
              size="sm"
              variant={view === "mine" ? "default" : "outline"}
              onClick={() => setView("mine")}
            >
              My bookings
            </Button>
          </div>
        ) : isAdminRole(role) ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/appointments">Admin bookings</Link>
          </Button>
        ) : undefined
      }
    >
      {view === "mine" ? (
        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-brand-dark">Book a visit</p>
            <form onSubmit={onBook} className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm sm:col-span-2"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => {
                  const fee = Number(d.consultationFee || 0)
                  return (
                    <option key={d.id} value={d.id}>
                      {doctorDisplayName(d)} · {d.specialty} ·{" "}
                      {fee > 0 ? `$${fee}` : "Free"}
                    </option>
                  )
                })}
              </select>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Day
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((d, i) => (
                    <button
                      key={toDateInputValue(d)}
                      type="button"
                      onClick={() => setDayIndex(i)}
                      className={cn(
                        "min-w-[64px] shrink-0 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold",
                        dayIndex === i
                          ? "border-primary bg-primary text-white"
                          : "border-blue-100 bg-brand-light/50 text-brand-dark"
                      )}
                    >
                      {d.toLocaleDateString(undefined, { weekday: "short" })}
                      <span className="mt-0.5 block opacity-80">
                        {d.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time (every 20 min)
                </p>
                <div className="grid max-h-36 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-5">
                  {BOOKING_TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlot(t)}
                      className={cn(
                        "rounded-lg border px-1 py-1.5 text-center text-[10px] font-semibold",
                        slot === t
                          ? "border-primary bg-primary text-white"
                          : "border-blue-100 bg-white text-brand-dark"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                className="sm:col-span-2"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {doctorId ? (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {selectedIsFree
                    ? "This doctor is free — no payment needed."
                    : `Fee $${selectedFee.toFixed(2)} — pay with Zaad, eDahab, Sahal after booking.`}
                </p>
              ) : null}
              <Button type="submit" disabled={booking} className="sm:col-span-2">
                {booking ? "Booking…" : `Request · ${slot}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          Patient booking requests for Dr. {myDoctor?.fullName}. Confirm or
          change status below. Fee is based on your consultation fee (0 = free).
        </div>
      )}

      {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : null}

      <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {view === "inbox" ? "Patient" : "Doctor"}
              </th>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Fee</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const pending = ["PENDING", "RESCHEDULE_REQUESTED"].includes(
                String(a.status)
              )
              const needsPay =
                view === "mine" &&
                a.paymentRequired &&
                Number(a.consultationFee || 0) > 0 &&
                !["PAID", "REFUNDED"].includes(String(a.paymentStatus || ""))
              const canPatientCancel =
                view === "mine" &&
                !["CANCELLED", "COMPLETED", "REJECTED"].includes(String(a.status))

              return (
                <tr key={a.id} className="border-b border-blue-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-dark">
                      {view === "inbox"
                        ? a.user?.fullName || "Patient"
                        : a.doctor?.fullName || "Doctor"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.appointmentCode}
                      {a.reason ? ` · ${a.reason}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{visitFeeLabel(a)}</Badge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {enumLabel(String(a.paymentStatus || "PENDING"))}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {canManageStatus ? (
                      <select
                        className="h-8 rounded-md border border-blue-100 bg-white px-2 text-xs"
                        value={String(a.status)}
                        disabled={updating}
                        onChange={async (e) => {
                          try {
                            await updateAppt({
                              id: a.id,
                              data: { status: e.target.value },
                            }).unwrap()
                            toast.success("Status updated")
                            refetch()
                          } catch {
                            toast.error("Could not update status")
                          }
                        }}
                      >
                        {APPOINTMENT_STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary">
                        {enumLabel(String(a.status))}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {view === "inbox" && isDoctor && pending ? (
                        <Button
                          size="sm"
                          disabled={updating}
                          onClick={() => confirm(a.id)}
                        >
                          Confirm
                        </Button>
                      ) : null}
                      {needsPay ? (
                        <Button
                          size="sm"
                          disabled={paying}
                          onClick={() => openPayInvoice(a)}
                        >
                          Pay now
                        </Button>
                      ) : null}
                      {canPatientCancel ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await cancelAppt({ id: a.id }).unwrap()
                              toast.success("Cancelled")
                              refetch()
                            } catch {
                              toast.error("Cancel failed")
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      {isAdminRole(role) ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/admin/appointments">Admin manage</Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {view === "inbox"
              ? "No patient requests yet."
              : "No appointments yet."}
          </p>
        ) : null}
      </div>

      <PayInvoiceDialog
        open={Boolean(invoice)}
        invoice={invoice}
        busy={paying}
        onClose={() => setInvoice(null)}
        onPay={async ({ method, provider, phone }) => {
          if (!invoice) return
          try {
            await createPayment({
              appointmentId: invoice.appointmentId,
              amount: invoice.amount,
              currency: invoice.currency,
              method,
              status: "PAID",
              provider,
              transactionId: phone,
            }).unwrap()
            toast.success(`Paid with ${localPayLabel(provider, method)}`)
            setInvoice(null)
            refetch()
          } catch {
            toast.error("Payment failed")
          }
        }}
      />
    </SectionShell>
  )
}

export function PaymentsSection() {
  const session = useSelector((s: RootState) => s.userInfo)
  const role = normalizeRole(session.role)
  const { data: myDoctor } = useGetMyDoctorProfileQuery(undefined, {
    skip: !session.isAuthenticated,
  })
  const isDoctor = Boolean(myDoctor?.id)
  const { data: items = [], isLoading, refetch } = useListPaymentsQuery({
    limit: 50,
    ...(isDoctor ? { as: "doctor" } : {}),
  })
  const [createPayment, { isLoading: paying }] = useCreatePaymentMutation()
  const [updatePayment, { isLoading: saving }] = useUpdatePaymentMutation()
  const { data: appointments = [] } = useGetMyAppointmentsQuery({
    limit: 40,
    ...(isDoctor ? { as: "doctor" } : {}),
  })
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null)

  const unpaid = appointments.filter(
    (a) =>
      a.paymentRequired &&
      Number(a.consultationFee || 0) > 0 &&
      !["PAID", "REFUNDED"].includes(String(a.paymentStatus || ""))
  )

  const openInvoiceFromAppt = (a: Appointment) => {
    setInvoice({
      appointmentId: a.id,
      appointmentCode: a.appointmentCode,
      doctorName: a.doctor?.fullName || "Doctor",
      patientName: a.user?.fullName,
      scheduledAt: a.scheduledAt,
      amount: Number(a.consultationFee || 0),
      currency: a.currency || "USD",
      reason: a.reason,
    })
  }

  return (
    <SectionShell
      title={isDoctor ? "Clinic payments" : "Payments"}
      subtitle={
        isDoctor
          ? "Payments for visits booked with you — Zaad, eDahab, cash, and free visits."
          : "Free when the doctor fee is $0. Pay with Zaad, eDahab, Sahal and see your invoice."
      }
      action={
        isAdminRole(role) ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/payments">Admin payments</Link>
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-emerald-900">Free visits</p>
            <p className="mt-1 text-emerald-800/80">
              Doctors with consultation fee $0 (or empty) are free. Booking marks
              payment as Paid automatically.
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-amber-950">Local money</p>
            <p className="mt-1 text-amber-900/80">
              Pay now opens your invoice — choose Zaad, eDahab, Sahal, EVC Plus,
              cash, bank, or card.
            </p>
          </CardContent>
        </Card>
      </div>

      {unpaid.length > 0 ? (
        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-brand-dark">
              Awaiting payment
            </p>
            {unpaid.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {a.doctor?.fullName || "Doctor"} · {a.appointmentCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {visitFeeLabel(a)} ·{" "}
                    {new Date(a.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={paying}
                  onClick={() => openInvoiceFromAppt(a)}
                >
                  View invoice · Pay
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : null}

      <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Visit</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const amount = Number(p.amount || 0)
              const isFree = amount <= 0 || p.provider === "FREE"
              const pending = String(p.status) === "PENDING"
              return (
                <tr key={p.id} className="border-b border-blue-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-dark">
                      {p.paymentReference || p.id.slice(0, 10)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.appointment?.appointmentCode ||
                      p.appointment?.doctor?.fullName ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {isFree
                      ? "Free"
                      : `${p.currency || "USD"} ${amount.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {isFree
                      ? "Free"
                      : localPayLabel(p.provider, String(p.method || ""))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {enumLabel(String(p.status))}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {pending && !isFree ? (
                      <Button
                        size="sm"
                        disabled={saving || paying}
                        onClick={() => {
                          const appt = p.appointment
                          setInvoice({
                            appointmentId: p.appointmentId || appt?.id || "",
                            paymentId: p.id,
                            appointmentCode: appt?.appointmentCode,
                            doctorName: appt?.doctor?.fullName || "Doctor",
                            scheduledAt: appt?.scheduledAt,
                            amount,
                            currency: p.currency || "USD",
                            reason: appt?.reason,
                          })
                        }}
                      >
                        Pay now
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!isLoading && items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No payment history yet. Book a doctor to see free or paid invoices.
          </p>
        ) : null}
      </div>

      <PayInvoiceDialog
        open={Boolean(invoice)}
        invoice={invoice}
        busy={paying || saving}
        onClose={() => setInvoice(null)}
        onPay={async ({ method, provider, phone }) => {
          if (!invoice) return
          try {
            if (invoice.paymentId) {
              await updatePayment({
                id: invoice.paymentId,
                data: {
                  status: "PAID",
                  method,
                  provider,
                  transactionId: phone,
                },
              }).unwrap()
            } else {
              await createPayment({
                appointmentId: invoice.appointmentId,
                amount: invoice.amount,
                currency: invoice.currency,
                method,
                status: "PAID",
                provider,
                transactionId: phone,
              }).unwrap()
            }
            toast.success(`Paid with ${localPayLabel(provider, method)}`)
            setInvoice(null)
            refetch()
          } catch {
            toast.error("Payment failed")
          }
        }}
      />
    </SectionShell>
  )
}

export function MedicationsSection() {
  const { data = [], isLoading, refetch } = useListMedicationsQuery()
  const [create] = useCreateMedicationMutation()
  const [remove] = useDeleteMedicationMutation()
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")

  return (
    <SectionShell title="Medications" subtitle="Track what you take">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          try {
            await create({ name: name.trim(), dosage: dosage || undefined }).unwrap()
            setName("")
            setDosage("")
            refetch()
            toast.success("Added")
          } catch {
            toast.error("Failed")
          }
        }}
      >
        <Input
          placeholder="Medicine name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className="max-w-[140px]"
        />
        <Button type="submit">Add</Button>
      </form>
      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="space-y-2">
        {data.map((m) => (
          <Card key={m.id} className="border-blue-100">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.dosage || "—"} · {m.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await remove(m.id)
                  refetch()
                }}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

export function AllergiesSection() {
  const { data = [], isLoading, refetch } = useListAllergiesQuery()
  const [create] = useCreateAllergyMutation()
  const [remove] = useDeleteAllergyMutation()
  const [allergen, setAllergen] = useState("")
  const [severity, setSeverity] = useState("MODERATE")
  const [type, setType] = useState("OTHER")

  return (
    <SectionShell title="Allergies" subtitle="Keep your care team informed">
      <Card className="border-blue-100">
        <CardContent className="p-4 sm:p-5">
          <p className="text-sm font-semibold text-brand-dark">Add allergy</p>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!allergen.trim()) return
              try {
                await create({
                  allergen: allergen.trim(),
                  severity,
                  type,
                }).unwrap()
                setAllergen("")
                setSeverity("MODERATE")
                setType("OTHER")
                refetch()
                toast.success("Added")
              } catch {
                toast.error("Failed")
              }
            }}
          >
            <FormField label="Allergen" required className="sm:col-span-2">
              <Input
                placeholder="e.g. Penicillin"
                value={allergen}
                onChange={(e) => setAllergen(e.target.value)}
                required
              />
            </FormField>
            <EnumSelect
              label="Type"
              value={type}
              onChange={setType}
              options={ALLERGY_TYPE_OPTIONS}
              required
            />
            <EnumSelect
              label="Severity"
              value={severity}
              onChange={setSeverity}
              options={ALLERGY_SEVERITY_OPTIONS}
              required
            />
            <div className="sm:col-span-2">
              <Button type="submit">Add allergy</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Allergen</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Severity</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-b border-blue-50 last:border-0">
                <td className="px-4 py-3 font-semibold text-brand-dark">
                  {a.allergen}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{enumLabel(a.type)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{enumLabel(a.severity, "Unknown")}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No allergies yet.</p>
        ) : null}
      </div>
    </SectionShell>
  )
}

export function VitalsSection() {
  const { data = [], isLoading, refetch } = useListVitalSignsQuery()
  const [create] = useCreateVitalSignMutation()
  const [sys, setSys] = useState("")
  const [dia, setDia] = useState("")
  const [hr, setHr] = useState("")

  return (
    <SectionShell title="Vital signs" subtitle="Log blood pressure and heart rate">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await create({
              bloodPressureSys: sys ? Number(sys) : undefined,
              bloodPressureDia: dia ? Number(dia) : undefined,
              heartRate: hr ? Number(hr) : undefined,
            }).unwrap()
            setSys("")
            setDia("")
            setHr("")
            refetch()
            toast.success("Saved")
          } catch {
            toast.error("Failed")
          }
        }}
      >
        <Input
          placeholder="SYS"
          value={sys}
          onChange={(e) => setSys(e.target.value)}
          className="w-24"
        />
        <Input
          placeholder="DIA"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="w-24"
        />
        <Input
          placeholder="HR"
          value={hr}
          onChange={(e) => setHr(e.target.value)}
          className="w-24"
        />
        <Button type="submit">Log</Button>
      </form>
      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="space-y-2">
        {data.map((v) => (
          <Card key={v.id} className="border-blue-100">
            <CardContent className="p-4 text-sm">
              BP {v.bloodPressureSys ?? "—"}/{v.bloodPressureDia ?? "—"} · HR{" "}
              {v.heartRate ?? "—"} ·{" "}
              {v.recordedAt ? new Date(v.recordedAt).toLocaleString() : ""}
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

export function PrescriptionsSection() {
  const { data = [], isLoading } = useListPrescriptionsQuery()
  return (
    <SectionShell title="Prescriptions" subtitle="Issued by your clinicians">
      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="space-y-2">
        {data.map((p) => (
          <Card key={p.id} className="border-blue-100">
            <CardContent className="p-4">
              <p className="font-semibold">{p.prescriptionNumber}</p>
              <p className="text-xs text-muted-foreground">
                {p.status} · {p.issuedAt ? new Date(p.issuedAt).toLocaleDateString() : ""}
              </p>
              {(p.items ?? []).length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.items!.map((i) => (
                    <li key={i.id}>
                      {i.medicineName} {i.dosage ? `· ${i.dosage}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && data.length === 0 ? <Empty text="No prescriptions yet." /> : null}
    </SectionShell>
  )
}

export function RecordsSection() {
  const [tab, setTab] = useState<"visits" | "labs" | "documents">("visits")

  const {
    data: records = [],
    isLoading: loadingRecords,
    refetch: refetchRecords,
  } = useListMedicalRecordsQuery()
  const {
    data: labs = [],
    isLoading: loadingLabs,
    refetch: refetchLabs,
  } = useListLabResultsQuery()
  const {
    data: docs = [],
    isLoading: loadingDocs,
    refetch: refetchDocs,
  } = useListMedicalDocumentsQuery()

  const [createRecord] = useCreateMedicalRecordMutation()
  const [deleteRecord] = useDeleteMedicalRecordMutation()
  const [createLab] = useCreateLabResultMutation()
  const [deleteLab] = useDeleteLabResultMutation()
  const [createDoc] = useCreateMedicalDocumentMutation()
  const [deleteDoc] = useDeleteMedicalDocumentMutation()

  const [visitForm, setVisitForm] = useState({
    title: "",
    recordType: "VISIT",
    doctorName: "",
    facilityName: "",
    diagnosis: "",
    notes: "",
  })
  const [labForm, setLabForm] = useState({
    testName: "",
    resultValue: "",
    unit: "",
    referenceRange: "",
    labName: "",
    status: "FINAL",
  })
  const [docForm, setDocForm] = useState({
    title: "",
    documentType: "REPORT",
    fileUrl: "",
    description: "",
  })

  return (
    <SectionShell
      title="Health records"
      subtitle="Visits, labs, and documents — add and review in one place"
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["visits", "Visits"],
            ["labs", "Labs"],
            ["documents", "Documents"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? "bg-primary text-white"
                : "border border-blue-100 bg-brand-light text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "visits" ? (
        <div className="space-y-4">
          <Card className="border-blue-100">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-brand-dark">
                Add visit / clinical note
              </p>
              <form
                className="mt-3 grid gap-2 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!visitForm.title.trim()) {
                    toast.error("Title is required")
                    return
                  }
                  try {
                    await createRecord({
                      title: visitForm.title.trim(),
                      recordType: visitForm.recordType,
                      recordDate: new Date().toISOString(),
                      doctorName: visitForm.doctorName || undefined,
                      facilityName: visitForm.facilityName || undefined,
                      diagnosis: visitForm.diagnosis || undefined,
                      notes: visitForm.notes || undefined,
                    }).unwrap()
                    setVisitForm({
                      title: "",
                      recordType: "VISIT",
                      doctorName: "",
                      facilityName: "",
                      diagnosis: "",
                      notes: "",
                    })
                    refetchRecords()
                    toast.success("Visit record saved")
                  } catch {
                    toast.error("Could not save record")
                  }
                }}
              >
                <FormField label="Title" required>
                  <Input
                    placeholder="e.g. Clinic visit"
                    value={visitForm.title}
                    onChange={(e) =>
                      setVisitForm({ ...visitForm, title: e.target.value })
                    }
                    required
                  />
                </FormField>
                <EnumSelect
                  label="Record type"
                  value={visitForm.recordType}
                  onChange={(v) =>
                    setVisitForm({ ...visitForm, recordType: v })
                  }
                  options={RECORD_TYPE_OPTIONS}
                  required
                />
                <Input
                  placeholder="Doctor name"
                  value={visitForm.doctorName}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, doctorName: e.target.value })
                  }
                />
                <Input
                  placeholder="Facility"
                  value={visitForm.facilityName}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, facilityName: e.target.value })
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Diagnosis summary"
                  value={visitForm.diagnosis}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, diagnosis: e.target.value })
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Notes"
                  value={visitForm.notes}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, notes: e.target.value })
                  }
                />
                <Button type="submit" className="sm:col-span-2">
                  Save visit record
                </Button>
              </form>
            </CardContent>
          </Card>

          {loadingRecords ? <Skeleton className="h-28 rounded-2xl" /> : null}
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Clinician</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-blue-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-dark">{r.title}</p>
                      {r.diagnosis ? (
                        <p className="text-xs text-muted-foreground">
                          {r.diagnosis}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {enumLabel(r.recordType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.recordDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[r.doctorName, r.facilityName].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteRecord(r.id)
                          refetchRecords()
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingRecords && records.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No visit records yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "labs" ? (
        <div className="space-y-4">
          <Card className="border-blue-100">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-brand-dark">
                Add lab result
              </p>
              <form
                className="mt-3 grid gap-2 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!labForm.testName.trim()) {
                    toast.error("Test name is required")
                    return
                  }
                  try {
                    await createLab({
                      testName: labForm.testName.trim(),
                      resultValue: labForm.resultValue || undefined,
                      unit: labForm.unit || undefined,
                      referenceRange: labForm.referenceRange || undefined,
                      labName: labForm.labName || undefined,
                      status: labForm.status,
                      resultDate: new Date().toISOString(),
                    }).unwrap()
                    setLabForm({
                      testName: "",
                      resultValue: "",
                      unit: "",
                      referenceRange: "",
                      labName: "",
                      status: "FINAL",
                    })
                    refetchLabs()
                    toast.success("Lab result saved")
                  } catch {
                    toast.error("Could not save lab")
                  }
                }}
              >
                <Input
                  placeholder="Test name *"
                  value={labForm.testName}
                  onChange={(e) =>
                    setLabForm({ ...labForm, testName: e.target.value })
                  }
                />
                <Input
                  placeholder="Result value"
                  value={labForm.resultValue}
                  onChange={(e) =>
                    setLabForm({ ...labForm, resultValue: e.target.value })
                  }
                />
                <Input
                  placeholder="Unit"
                  value={labForm.unit}
                  onChange={(e) =>
                    setLabForm({ ...labForm, unit: e.target.value })
                  }
                />
                <Input
                  placeholder="Reference range"
                  value={labForm.referenceRange}
                  onChange={(e) =>
                    setLabForm({ ...labForm, referenceRange: e.target.value })
                  }
                />
                <Input
                  placeholder="Lab / facility"
                  value={labForm.labName}
                  onChange={(e) =>
                    setLabForm({ ...labForm, labName: e.target.value })
                  }
                />
                <EnumSelect
                  label="Status"
                  value={labForm.status}
                  onChange={(v) => setLabForm({ ...labForm, status: v })}
                  options={LAB_STATUS_OPTIONS}
                  required
                />
                <Button type="submit" className="sm:col-span-2">
                  Save lab result
                </Button>
              </form>
            </CardContent>
          </Card>

          {loadingLabs ? <Skeleton className="h-28 rounded-2xl" /> : null}
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Test</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Range</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {labs.map((l) => (
                  <tr key={l.id} className="border-b border-blue-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-dark">{l.testName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[l.labName, enumLabel(l.status, "")].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {l.resultValue ?? "—"} {l.unit ?? ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.referenceRange || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(l.resultDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteLab(l.id)
                          refetchLabs()
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingLabs && labs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No lab results yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="space-y-4">
          <Card className="border-blue-100">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-brand-dark">
                Add document
              </p>
              <form
                className="mt-3 grid gap-2 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!docForm.title.trim() || !docForm.fileUrl.trim()) {
                    toast.error("Title and file URL are required")
                    return
                  }
                  try {
                    await createDoc({
                      title: docForm.title.trim(),
                      documentType: docForm.documentType,
                      fileUrl: docForm.fileUrl.trim(),
                      description: docForm.description || undefined,
                      documentDate: new Date().toISOString(),
                    }).unwrap()
                    setDocForm({
                      title: "",
                      documentType: "REPORT",
                      fileUrl: "",
                      description: "",
                    })
                    refetchDocs()
                    toast.success("Document saved")
                  } catch {
                    toast.error("Could not save document")
                  }
                }}
              >
                <Input
                  placeholder="Title *"
                  value={docForm.title}
                  onChange={(e) =>
                    setDocForm({ ...docForm, title: e.target.value })
                  }
                />
                <EnumSelect
                  label="Document type"
                  value={docForm.documentType}
                  onChange={(v) =>
                    setDocForm({ ...docForm, documentType: v })
                  }
                  options={DOCUMENT_TYPE_OPTIONS}
                  required
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="File URL *"
                  value={docForm.fileUrl}
                  onChange={(e) =>
                    setDocForm({ ...docForm, fileUrl: e.target.value })
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Description"
                  value={docForm.description}
                  onChange={(e) =>
                    setDocForm({ ...docForm, description: e.target.value })
                  }
                />
                <Button type="submit" className="sm:col-span-2">
                  Save document
                </Button>
              </form>
            </CardContent>
          </Card>

          {loadingDocs ? <Skeleton className="h-28 rounded-2xl" /> : null}
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Link</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-blue-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-dark">{d.title}</p>
                      {d.description ? (
                        <p className="text-xs text-muted-foreground">
                          {d.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {enumLabel(d.documentType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.documentDate
                        ? new Date(d.documentDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary underline"
                      >
                        Open
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteDoc(d.id)
                          refetchDocs()
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingDocs && docs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No documents yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </SectionShell>
  )
}

export function FamilySection() {
  const { data = [], isLoading, refetch } = useListFamilyMembersQuery()
  const [create] = useCreateFamilyMemberMutation()
  const [remove] = useDeleteFamilyMemberMutation()
  const [fullName, setFullName] = useState("")
  const [relationship, setRelationship] = useState("SON")
  const [phone, setPhone] = useState("")
  const [gender, setGender] = useState("")

  return (
    <SectionShell
      title="Family members"
      subtitle="People you care for — names like Maxamed Xasan"
    >
      <Card className="border-blue-100">
        <CardContent className="p-4 sm:p-5">
          <p className="text-sm font-semibold text-brand-dark">Add family member</p>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!fullName.trim() || !relationship) {
                toast.error("Name and relationship are required")
                return
              }
              try {
                await create({
                  fullName: fullName.trim(),
                  relationship,
                  phone: phone.trim() || undefined,
                  gender: gender || undefined,
                }).unwrap()
                setFullName("")
                setRelationship("SON")
                setPhone("")
                setGender("")
                refetch()
                toast.success("Family member added")
              } catch {
                toast.error("Failed")
              }
            }}
          >
            <FormField label="Full name" required className="sm:col-span-2">
              <Input
                placeholder="e.g. Maxamed Xasan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </FormField>
            <EnumSelect
              label="Relationship"
              value={relationship}
              onChange={setRelationship}
              options={RELATIONSHIP_OPTIONS}
              required
              placeholder="Select relationship"
            />
            <FormField label="Phone">
              <Input
                placeholder="e.g. 63xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <EnumSelect
              label="Gender"
              value={gender}
              onChange={setGender}
              options={GENDER_OPTIONS}
              placeholder="Optional"
            />
            <div className="sm:col-span-2">
              <Button type="submit">Add member</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Relationship</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Gender</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-b border-blue-50 last:border-0">
                <td className="px-4 py-3 font-semibold text-brand-dark">
                  {m.fullName}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{enumLabel(m.relationship)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.phone || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {enumLabel(m.gender)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No family members yet.
          </p>
        ) : null}
      </div>
    </SectionShell>
  )
}

export function EmergencySection() {
  const { data: contacts = [], refetch } = useListEmergencyContactsQuery()
  const { data: card } = useGetEmergencyCardQuery()
  const [createContact] = useCreateEmergencyContactMutation()
  const [removeContact] = useDeleteEmergencyContactMutation()
  const [upsertCard] = useUpsertEmergencyCardMutation()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [relationship, setRelationship] = useState("FAMILY")
  const [bloodType, setBloodType] = useState(card?.bloodType || "UNKNOWN")

  useEffect(() => {
    if (card?.bloodType) setBloodType(String(card.bloodType))
  }, [card?.bloodType])

  return (
    <SectionShell title="Emergency" subtitle="Contacts and emergency card">
      <Card className="border-blue-100">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <p className="font-semibold text-brand-dark">Emergency card</p>
          <p className="text-sm text-muted-foreground">
            {card
              ? `Card ${card.cardNumber} · Blood ${enumLabel(card.bloodType)}`
              : "No card yet — create one to share critical info."}
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <EnumSelect
              label="Blood type"
              value={bloodType}
              onChange={setBloodType}
              options={BLOOD_TYPE_OPTIONS}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-10"
              onClick={async () => {
                try {
                  await upsertCard({
                    bloodType: bloodType as never,
                    emergencyContactName: contacts[0]?.fullName,
                    emergencyContactPhone: contacts[0]?.phone,
                  }).unwrap()
                  toast.success("Card saved")
                } catch {
                  toast.error("Could not save card")
                }
              }}
            >
              {card ? "Update card" : "Create card"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardContent className="p-4 sm:p-5">
          <p className="text-sm font-semibold text-brand-dark">Add contact</p>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!fullName.trim() || !phone.trim() || !relationship) {
                toast.error("Name, phone, and relationship are required")
                return
              }
              try {
                await createContact({
                  fullName: fullName.trim(),
                  phone: phone.trim(),
                  relationship,
                }).unwrap()
                setFullName("")
                setPhone("")
                setRelationship("FAMILY")
                refetch()
                toast.success("Contact added")
              } catch {
                toast.error("Failed")
              }
            }}
          >
            <FormField label="Full name" required className="sm:col-span-2">
              <Input
                placeholder="e.g. Maxamed Xasan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Phone" required>
              <Input
                placeholder="e.g. 63xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </FormField>
            <EnumSelect
              label="Relationship / Family"
              value={relationship}
              onChange={setRelationship}
              options={RELATIONSHIP_OPTIONS}
              required
              placeholder="Select relationship"
            />
            <div className="sm:col-span-2">
              <Button type="submit">Add contact</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-blue-50 bg-brand-light/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Family / relationship</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b border-blue-50 last:border-0">
                <td className="px-4 py-3 font-semibold text-brand-dark">
                  {c.fullName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{enumLabel(c.relationship)}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeContact(c.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No emergency contacts yet.
          </p>
        ) : null}
      </div>
    </SectionShell>
  )
}

export function NotificationsSection() {
  const { data = [], isLoading, refetch } = useListNotificationsQuery({ limit: 40 })
  const [markOne] = useMarkAsReadMutation()
  const [markAll] = useMarkAllAsReadMutation()

  return (
    <SectionShell
      title="Notifications"
      subtitle="Appointments, payments, and system alerts"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await markAll()
            refetch()
          }}
        >
          Mark all read
        </Button>
      }
    >
      {isLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
      <div className="space-y-2">
        {data.map((n) => (
          <Card
            key={n.id}
            className={n.isRead ? "border-blue-50 opacity-80" : "border-blue-100"}
          >
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.isRead ? (
                <Button size="sm" variant="ghost" onClick={() => markOne(n.id)}>
                  Read
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && data.length === 0 ? <Empty text="No notifications." /> : null}
    </SectionShell>
  )
}
