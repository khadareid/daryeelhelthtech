import type { ElementType, ReactNode } from "react"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  FileText,
  RefreshCw,
  Stethoscope,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGetAdminDoctorsQuery,
  useGetAdminStatsQuery,
  useGetAuditLogsQuery,
  useUpdateAdminAppointmentMutation,
} from "@/Redex/service/admin/AdminApi"
import type { RootState } from "@/Redex/store/store"
import { doctorDisplayName, doctorPhoto } from "@/Redex/service/doctors/DoctorsApi"
import { enumLabel } from "@/lib/enums"
import { localPayLabel } from "@/lib/payments"
import { cn } from "@/lib/utils"
import type { Appointment, Doctor, Payment } from "@/Redex/types/Types"

export default function AdminDashboard() {
  const session = useSelector((s: RootState) => s.userInfo)
  const role = String(session.role || "").toUpperCase()
  const isSuper = role === "SUPER_ADMIN"

  const {
    data: stats,
    isLoading,
    isError,
    isFetching,
    refetch,
    fulfilledTimeStamp,
  } = useGetAdminStatsQuery()

  const { data: doctorsPage, isLoading: loadingDoctors } =
    useGetAdminDoctorsQuery({ page: 1, limit: 8 })
  const { data: auditsPage, isLoading: loadingAudits } = useGetAuditLogsQuery({
    page: 1,
    limit: 8,
  })

  const [updateAppt, { isLoading: saving }] = useUpdateAdminAppointmentMutation()

  const lastUpdated = fulfilledTimeStamp
    ? new Date(fulfilledTimeStamp).toLocaleString()
    : "—"

  const noShows = stats?.noShowAppointments ?? 0
  const failedPayments = stats?.failedPayments ?? 0
  const recentDoctors = doctorsPage?.items ?? []
  const recentAudits = auditsPage?.items ?? []

  const confirm = async (id: string) => {
    try {
      await updateAppt({ id, status: "CONFIRMED" }).unwrap()
      toast.success("Appointment confirmed")
      refetch()
    } catch {
      toast.error("Could not confirm")
    }
  }

  const paySegments = [
    { label: "Paid", value: stats?.paidPayments ?? 0, className: "bg-primary" },
    {
      label: "Pending",
      value: stats?.pendingPayments ?? 0,
      className: "bg-amber-400",
    },
    {
      label: "Failed",
      value: failedPayments,
      className: "bg-rose-400",
    },
    {
      label: "Refunded",
      value: stats?.refundedPayments ?? 0,
      className: "bg-slate-300",
    },
  ]
  const payTotal = paySegments.reduce((s, x) => s + x.value, 0)

  return (
    <div className="space-y-4">
      {/* Overview header */}
      <section className="rounded-xl border border-blue-100 bg-white px-4 py-3.5 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {isSuper ? "Super Admin" : "Admin"}
            </p>
            <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
              Overview
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Live platform totals from the database — users, doctors, bookings,
              payments, and health data.
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-lg border-blue-100"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </section>

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            Could not load dashboard data
          </p>
          <p className="mt-1 text-xs text-rose-600">
            Check your connection and try again.
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!isLoading && !isError && stats ? (
        <>
          {/* Main KPIs */}
          <section>
            <SectionTitle title="Key metrics" />
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Kpi
                label="Total Users"
                value={stats.users}
                icon={Users}
                to="/admin/users"
              />
              <Kpi
                label="Total Doctors"
                value={stats.doctors}
                icon={Stethoscope}
                to="/admin/doctors"
              />
              <Kpi
                label="Total Appointments"
                value={stats.appointments}
                icon={CalendarCheck}
                to="/admin/appointments"
              />
              <Kpi
                label="Total Revenue"
                value={stats.revenuePaid}
                icon={CreditCard}
                money
                to="/admin/payments"
              />
            </div>
          </section>

          {/* People + Doctors */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel
              title="People overview"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/users">
                  Manage
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat label="Patients" value={stats.patients} />
                <MiniStat label="Admins" value={stats.admins} />
                <MiniStat label="Super Admins" value={stats.superAdmins} />
                <MiniStat
                  label="Suspended"
                  value={stats.suspendedUsers}
                  warn={(stats.suspendedUsers || 0) > 0}
                />
              </div>
            </Panel>

            <Panel
              title="Doctor overview"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/doctors">
                  Manage
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <MiniStat label="Active" value={stats.doctors} />
                <MiniStat label="Verified" value={stats.verifiedDoctors} />
                <MiniStat
                  label="Pending"
                  value={stats.pendingDoctors}
                  warn={(stats.pendingDoctors || 0) > 0}
                />
                <MiniStat label="Rejected" value={stats.rejectedDoctors} />
                <MiniStat label="Suspended" value={stats.suspendedDoctors} />
              </div>
            </Panel>
          </div>

          {/* Appointments & Revenue */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel
              title="Appointments & consultations"
              action={
                <Link
                  className="text-xs font-semibold text-primary"
                  to="/admin/appointments"
                >
                  All bookings
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat label="Total" value={stats.appointments} />
                <MiniStat
                  label="Pending"
                  value={stats.pendingAppointments}
                  warn
                />
                <MiniStat label="Confirmed" value={stats.confirmedAppointments} />
                <MiniStat label="Completed" value={stats.completedAppointments} />
                <MiniStat label="Cancelled" value={stats.cancelledAppointments} />
                <MiniStat label="No-show" value={noShows} />
                <MiniStat label="Consultations" value={stats.consultations} />
              </div>
            </Panel>

            <Panel
              title="Revenue & payments"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/payments">
                  All payments
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <MiniStat label="Total payments" value={stats.payments} />
                <MiniStat label="Paid" value={stats.paidPayments} />
                <MiniStat
                  label="Pending"
                  value={stats.pendingPayments}
                  warn
                />
                <MiniStat label="Failed" value={failedPayments} />
                <MiniStat label="Refunded" value={stats.refundedPayments} />
                <MiniStat label="Revenue" value={stats.revenuePaid} money />
              </div>
              {payTotal > 0 ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex h-2 overflow-hidden rounded-full bg-blue-50">
                    {paySegments.map((seg) =>
                      seg.value > 0 ? (
                        <div
                          key={seg.label}
                          className={seg.className}
                          style={{ width: `${(seg.value / payTotal) * 100}%` }}
                          title={`${seg.label}: ${seg.value}`}
                        />
                      ) : null
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    {paySegments.map((seg) => (
                      <span key={seg.label} className="inline-flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", seg.className)} />
                        {seg.label} ({seg.value})
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Panel>
          </div>

          {/* Recent Bookings */}
          <Panel
            title="Recent bookings"
            action={
              <Link
                className="text-xs font-semibold text-primary"
                to="/admin/appointments"
              >
                Open all
              </Link>
            }
          >
            <ScrollTable minWidth="780px">
              <thead>
                <tr className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Th>Patient</Th>
                  <Th>Doctor</Th>
                  <Th>Appointment</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentAppointments ?? []).map((a) => (
                  <BookingRow
                    key={a.id}
                    a={a}
                    saving={saving}
                    onConfirm={() => confirm(a.id)}
                  />
                ))}
              </tbody>
            </ScrollTable>
            {(stats.recentAppointments ?? []).length === 0 ? (
              <Empty>No bookings yet.</Empty>
            ) : null}
          </Panel>

          {/* Recent Users + Doctors */}
          <div className="grid gap-3 xl:grid-cols-2">
            <Panel
              title="Recent users"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/users">
                  Manage users
                </Link>
              }
            >
              <ScrollTable minWidth="520px">
                <thead>
                  <tr className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentUsers ?? []).map((u) => (
                    <tr key={u.userid} className="border-t border-blue-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {(u.fullName || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-brand-dark">
                              {u.fullName}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {enumLabel(String(u.role))}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          tone={u.isSuspended ? "warn" : "ok"}
                          label={u.isSuspended ? "Suspended" : "Active"}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ScrollTable>
              {(stats.recentUsers ?? []).length === 0 ? (
                <Empty>No users yet.</Empty>
              ) : null}
            </Panel>

            <Panel
              title="Recent doctors"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/doctors">
                  Manage doctors
                </Link>
              }
            >
              {loadingDoctors ? (
                <Skeleton className="h-32 rounded-lg" />
              ) : (
                <>
                  <ScrollTable minWidth="640px">
                    <thead>
                      <tr className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <Th>Doctor</Th>
                        <Th>Specialty</Th>
                        <Th>Verification</Th>
                        <Th>Availability</Th>
                        <Th>Fee</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDoctors.map((d) => (
                        <DoctorRow key={d.id} d={d} />
                      ))}
                    </tbody>
                  </ScrollTable>
                  {recentDoctors.length === 0 ? (
                    <Empty>No doctors yet.</Empty>
                  ) : null}
                </>
              )}
            </Panel>
          </div>

          {/* Recent Payments */}
          <Panel
            title="Recent payments"
            action={
              <Link className="text-xs font-semibold text-primary" to="/admin/payments">
                Open all
              </Link>
            }
          >
            <ScrollTable minWidth="720px">
              <thead>
                <tr className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Th>Patient</Th>
                  <Th>Payment method</Th>
                  <Th>Appointment</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentPayments ?? []).map((p) => (
                  <PaymentRow key={p.id} p={p} />
                ))}
              </tbody>
            </ScrollTable>
            {(stats.recentPayments ?? []).length === 0 ? (
              <Empty>No payments yet.</Empty>
            ) : null}
          </Panel>

          {/* Health + Security */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Health data overview">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <MiniStat
                  label="Medical records"
                  value={stats.medicalRecords}
                  icon={FileText}
                />
                <MiniStat label="Lab results" value={stats.labResults} icon={Activity} />
                <MiniStat label="Medications" value={stats.medications} />
                <MiniStat label="Family members" value={stats.familyMembers} />
                <MiniStat label="Emergency cards" value={stats.emergencyCards} />
                <MiniStat label="Notifications" value={stats.notifications} />
                <MiniStat
                  label="Unread alerts"
                  value={stats.unreadNotifications}
                  warn={(stats.unreadNotifications || 0) > 0}
                  icon={AlertTriangle}
                />
              </div>
            </Panel>

            <Panel
              title="Security & audit"
              action={
                <Link className="text-xs font-semibold text-primary" to="/admin/audits">
                  All audits
                </Link>
              }
            >
              {loadingAudits ? (
                <Skeleton className="h-32 rounded-lg" />
              ) : (
                <>
                  <ScrollTable minWidth="560px">
                    <thead>
                      <tr className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <Th>User</Th>
                        <Th>Action</Th>
                        <Th>Entity</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAudits.map((log) => (
                        <tr key={log.id} className="border-t border-blue-50">
                          <td className="px-3 py-2 text-sm font-medium text-brand-dark">
                            {log.user?.fullName || "System"}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {enumLabel(String(log.action))}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {log.entity || "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge tone="ok" label="Logged" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ScrollTable>
                  {recentAudits.length === 0 ? (
                    <Empty>No audit activity yet.</Empty>
                  ) : null}
                </>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  )
}

function BookingRow({
  a,
  saving,
  onConfirm,
}: {
  a: Appointment
  saving: boolean
  onConfirm: () => void
}) {
  const pending = ["PENDING", "RESCHEDULE_REQUESTED"].includes(String(a.status))
  return (
    <tr className="border-t border-blue-50">
      <td className="px-3 py-2 text-sm font-medium text-brand-dark">
        {a.user?.fullName || "Patient"}
      </td>
      <td className="px-3 py-2 text-sm">{a.doctor?.fullName || "—"}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {a.appointmentCode}
      </td>
      <td className="px-3 py-2">
        <Badge variant="secondary" className="text-[10px]">
          {enumLabel(String(a.status))}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <Badge variant="secondary" className="text-[10px]">
          {enumLabel(String(a.paymentStatus || "PENDING"))}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : "—"}
      </td>
      <td className="px-3 py-2">
        {pending ? (
          <Button size="sm" className="h-7 px-2 text-xs" disabled={saving} onClick={onConfirm}>
            Confirm
          </Button>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  )
}

function DoctorRow({ d }: { d: Doctor }) {
  const fee = Number(d.consultationFee || 0)
  return (
    <tr className="border-t border-blue-50">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={doctorPhoto(d)} />
            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
              {doctorDisplayName(d).replace(/^Dr\.\s*/, "").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-brand-dark">
            {doctorDisplayName(d)}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{d.specialty}</td>
      <td className="px-3 py-2">
        <Badge variant="secondary" className="text-[10px]">
          {enumLabel(String(d.verificationStatus || "PENDING"))}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs">
        {d.isAvailable !== false ? "Available" : "Unavailable"}
      </td>
      <td className="px-3 py-2 text-sm font-semibold">
        {fee <= 0 ? "Free" : `$${fee.toFixed(2)}`}
      </td>
      <td className="px-3 py-2">
        <StatusBadge
          tone={d.isActive === false ? "warn" : "ok"}
          label={d.isActive === false ? "Inactive" : "Active"}
        />
      </td>
    </tr>
  )
}

function PaymentRow({ p }: { p: Payment }) {
  const amount = Number(p.amount || 0)
  const free = amount <= 0 || p.provider === "FREE"
  return (
    <tr className="border-t border-blue-50">
      <td className="px-3 py-2 text-sm font-medium text-brand-dark">
        {p.user?.fullName || "Patient"}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {free ? "Free" : localPayLabel(p.provider, String(p.method || ""))}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {p.appointment?.appointmentCode || "—"}
      </td>
      <td className="px-3 py-2 text-sm font-semibold">
        {free ? "Free" : `${p.currency || "USD"} ${amount.toFixed(2)}`}
      </td>
      <td className="px-3 py-2">
        <Badge variant="secondary" className="text-[10px]">
          {enumLabel(String(p.status))}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
      </td>
    </tr>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </h2>
  )
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-blue-100 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold text-brand-dark sm:text-base">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  money,
  to,
}: {
  label: string
  value?: number
  icon: ElementType
  money?: boolean
  to: string
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-blue-100 bg-white px-3.5 py-3 shadow-sm transition hover:border-primary/30 hover:bg-brand-light/30"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1.5 font-heading text-xl font-bold tabular-nums text-brand-dark">
        {fmt(value, money)}
      </p>
    </Link>
  )
}

function MiniStat({
  label,
  value,
  warn,
  money,
  icon: Icon,
}: {
  label: string
  value?: number
  warn?: boolean
  money?: boolean
  icon?: ElementType
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        warn ? "border-amber-200 bg-amber-50/70" : "border-blue-50 bg-brand-light/40"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? <Icon className="h-3 w-3 shrink-0 text-primary/60" /> : null}
      </div>
      <p className="mt-0.5 font-heading text-base font-bold tabular-nums text-brand-dark">
        {fmt(value, money)}
      </p>
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: "ok" | "warn"
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "ok"
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-800"
      )}
    >
      {label}
    </span>
  )
}

function ScrollTable({
  children,
  minWidth,
}: {
  children: ReactNode
  minWidth: string
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 font-semibold">{children}</th>
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>
}

function fmt(value?: number, money?: boolean) {
  if (typeof value !== "number") return "—"
  if (money) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }
  return value.toLocaleString()
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
