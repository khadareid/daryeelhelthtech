import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  BadgeCheck,
  Calendar,
  CalendarClock,
  CreditCard,
  Plus,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  doctorDisplayName,
  doctorPhoto,
  useCopyMyScheduleMutation,
  useCreateMyScheduleMutation,
  useCreateMyTimeOffMutation,
  useDeleteMyScheduleMutation,
  useDeleteMyTimeOffMutation,
  useGetMyDoctorProfileQuery,
  useListMySchedulesQuery,
  useListMyTimeOffQuery,
  useUpsertMyDoctorProfileMutation,
} from "@/Redex/service/doctors/DoctorsApi"
import {
  useGetMyAppointmentsQuery,
  useUpdateAppointmentMutation,
} from "@/Redex/service/appointments/AppointmentsApi"
import { useListPaymentsQuery } from "@/Redex/service/care/CareApi"
import { enumLabel } from "@/lib/enums"
import { localPayLabel } from "@/lib/payments"
import { cn } from "@/lib/utils"
import type { Appointment, Doctor } from "@/Redex/types/Types"

type Tab = "overview" | "patients" | "payments" | "availability" | "profile"

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

function formatClock(raw?: string | null) {
  if (!raw) return "—"
  const [h, m] = raw.split(":").map(Number)
  if (Number.isNaN(h)) return raw
  const d = new Date()
  d.setHours(h, m || 0, 0, 0)
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function todayIso() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
}

export function DoctorWorkspace() {
  const [tab, setTab] = useState<Tab>("overview")
  const { data: me, isLoading: loadingMe, refetch: refetchMe } =
    useGetMyDoctorProfileQuery()
  const {
    data: visits = [],
    isLoading: loadingVisits,
    refetch: refetchVisits,
  } = useGetMyAppointmentsQuery(
    { limit: 80, as: "doctor" },
    { skip: !me?.id }
  )
  const { data: payments = [], isLoading: loadingPay } = useListPaymentsQuery(
    { limit: 80, as: "doctor" },
    { skip: !me?.id }
  )
  const [updateAppt, { isLoading: updating }] = useUpdateAppointmentMutation()
  const [upsert, { isLoading: saving }] = useUpsertMyDoctorProfileMutation()

  const patients = useMemo(() => {
    const map = new Map<
      string,
      {
        userid: string
        fullName: string
        email?: string | null
        phone?: string | null
        visits: number
        lastVisit?: string
        unpaid: number
      }
    >()
    for (const a of visits) {
      const uid = a.userId || a.user?.userid
      if (!uid) continue
      const prev = map.get(uid)
      const unpaid =
        a.paymentRequired &&
        Number(a.consultationFee || 0) > 0 &&
        !["PAID", "REFUNDED"].includes(String(a.paymentStatus || ""))
          ? 1
          : 0
      if (!prev) {
        map.set(uid, {
          userid: uid,
          fullName: a.user?.fullName || "Patient",
          email: a.user?.email,
          phone: a.user?.phone,
          visits: 1,
          lastVisit: a.scheduledAt,
          unpaid,
        })
      } else {
        prev.visits += 1
        prev.unpaid += unpaid
        if (
          a.scheduledAt &&
          (!prev.lastVisit ||
            new Date(a.scheduledAt) > new Date(prev.lastVisit))
        ) {
          prev.lastVisit = a.scheduledAt
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(b.lastVisit || "").localeCompare(String(a.lastVisit || ""))
    )
  }, [visits])

  const pendingVisits = visits.filter((a) =>
    ["PENDING", "RESCHEDULE_REQUESTED"].includes(String(a.status))
  )
  const confirmedVisits = visits.filter((a) =>
    ["CONFIRMED", "ACCEPTED", "CHECKED_IN", "IN_PROGRESS"].includes(
      String(a.status)
    )
  )
  const revenue = payments
    .filter((p) => String(p.status) === "PAID" && Number(p.amount || 0) > 0)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const pendingPay = payments.filter((p) => String(p.status) === "PENDING")

  const confirm = async (id: string) => {
    try {
      await updateAppt({ id, data: { status: "CONFIRMED" } }).unwrap()
      toast.success("Visit confirmed")
      refetchVisits()
    } catch {
      toast.error("Could not confirm")
    }
  }

  if (loadingMe) return <Skeleton className="h-64 rounded-3xl" />

  if (!me?.id) {
    return (
      <Card className="border-blue-100">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-heading text-xl font-bold text-brand-dark">
            Doctor clinic desk
          </h2>
          <p className="text-sm text-muted-foreground">
            You do not have a doctor profile yet. Apply to become a verified
            clinician, then manage patients and payments here.
          </p>
          <Button asChild>
            <Link to="/doctors/apply">Apply as doctor</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const fee = Number(me.consultationFee || 0)

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={doctorPhoto(me)} />
            <AvatarFallback>
              {doctorDisplayName(me).slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Doctor clinic desk
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-brand-dark">
                {doctorDisplayName(me)}
              </h1>
              {me.verificationStatus === "VERIFIED" ? (
                <BadgeCheck className="h-5 w-5 text-primary" />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {me.specialty}
              {me.subSpecialty ? ` · ${me.subSpecialty}` : ""}
              {me.clinicName ? ` · ${me.clinicName}` : ""}
              {me.city ? ` · ${me.city}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {enumLabel(String(me.verificationStatus || "PENDING"))}
              </Badge>
              <Badge variant="secondary">
                {fee <= 0 ? "Free visits" : `Fee $${fee.toFixed(2)}`}
              </Badge>
              {me.isAvailable !== false ? (
                <Badge variant="secondary">Available</Badge>
              ) : (
                <Badge variant="destructive">Unavailable</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTab("availability")}
            >
              Manage schedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTab("profile")}
            >
              Edit profile
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview", Stethoscope],
              ["patients", `Patients (${patients.length})`, Users],
              ["payments", `Payments (${payments.length})`, CreditCard],
              ["availability", "Availability", CalendarClock],
              ["profile", "My profile", Calendar],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                tab === id
                  ? "bg-primary text-white"
                  : "border border-blue-100 bg-brand-light text-primary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Patients" value={patients.length} />
            <Stat label="All visits" value={visits.length} />
            <Stat label="Pending requests" value={pendingVisits.length} accent />
            <Stat label="Confirmed / active" value={confirmedVisits.length} />
            <Stat label="Payment records" value={payments.length} />
            <Stat label="Awaiting pay" value={pendingPay.length} accent />
            <Stat label="Revenue (paid)" value={revenue} money />
          </div>

          <Card className="border-blue-100">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-brand-dark">
                  Your schedule
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {me.isAvailable !== false
                    ? "Patients can book you when shifts are open."
                    : "You are marked unavailable for booking."}{" "}
                  Slot length: {me.appointmentDurationMinutes || 30} min.
                </p>
              </div>
              <Button size="sm" onClick={() => setTab("availability")}>
                <CalendarClock className="mr-1.5 h-4 w-4" />
                Manage availability
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-brand-dark">
                  Pending patient requests
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTab("patients")}
                >
                  All patients
                </Button>
              </div>
              {loadingVisits ? <Skeleton className="mt-3 h-24 rounded-xl" /> : null}
              <div className="mt-3 space-y-2">
                {pendingVisits.slice(0, 6).map((a) => (
                  <VisitRow
                    key={a.id}
                    a={a}
                    busy={updating}
                    onConfirm={() => confirm(a.id)}
                  />
                ))}
                {!loadingVisits && pendingVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pending requests.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "patients" ? (
        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-4">
            <h2 className="font-heading text-lg font-bold text-brand-dark">
              Your patients
            </h2>
            <p className="text-sm text-muted-foreground">
              People who booked visits with you — open visits to manage status.
            </p>
            <div className="overflow-x-auto rounded-xl border border-blue-50">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-brand-light/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Patient</th>
                    <th className="px-3 py-2.5 font-semibold">Visits</th>
                    <th className="px-3 py-2.5 font-semibold">Last visit</th>
                    <th className="px-3 py-2.5 font-semibold">Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.userid} className="border-t border-blue-50">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-brand-dark">
                          {p.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.email || p.phone || p.userid.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">{p.visits}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {p.lastVisit
                          ? new Date(p.lastVisit).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {p.unpaid > 0 ? (
                          <Badge variant="destructive">{p.unpaid}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingVisits && patients.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No patients yet. When someone books you, they appear here.
                </p>
              ) : null}
            </div>

            <h3 className="pt-2 font-heading font-bold text-brand-dark">
              Recent visits
            </h3>
            <div className="space-y-2">
              {visits.slice(0, 12).map((a) => (
                <VisitRow
                  key={a.id}
                  a={a}
                  busy={updating}
                  onConfirm={
                    ["PENDING", "RESCHEDULE_REQUESTED"].includes(String(a.status))
                      ? () => confirm(a.id)
                      : undefined
                  }
                />
              ))}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard?section=appointments">Open full visits inbox</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "payments" ? (
        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-bold text-brand-dark">
                  Visit payments
                </h2>
                <p className="text-sm text-muted-foreground">
                  Invoices for your consultations (Zaad, eDahab, cash…).
                </p>
              </div>
              <Badge variant="secondary">
                Paid revenue ${revenue.toFixed(2)}
              </Badge>
            </div>
            {loadingPay ? <Skeleton className="h-28 rounded-xl" /> : null}
            <div className="overflow-x-auto rounded-xl border border-blue-50">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-brand-light/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Patient</th>
                    <th className="px-3 py-2.5 font-semibold">Visit</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">Method</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const amount = Number(p.amount || 0)
                    const free = amount <= 0 || p.provider === "FREE"
                    return (
                      <tr key={p.id} className="border-t border-blue-50">
                        <td className="px-3 py-2.5 font-medium">
                          {p.user?.fullName || "Patient"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {p.appointment?.appointmentCode || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-semibold">
                          {free
                            ? "Free"
                            : `${p.currency || "USD"} ${amount.toFixed(2)}`}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {free
                            ? "Free"
                            : localPayLabel(p.provider, String(p.method || ""))}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary">
                            {enumLabel(String(p.status))}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!loadingPay && payments.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No payment records for your visits yet.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "availability" ? (
        <DoctorAvailabilityPanel
          doctor={me}
          onProfilePatch={async (body) => {
            try {
              await upsert(body).unwrap()
              toast.success("Availability settings saved")
              refetchMe()
            } catch {
              toast.error("Could not save settings")
            }
          }}
          savingProfile={saving}
        />
      ) : null}

      {tab === "profile" ? (
        <DoctorProfileForm
          doctor={me}
          saving={saving}
          onSave={async (body) => {
            try {
              await upsert(body).unwrap()
              toast.success("Profile updated")
              refetchMe()
            } catch (err: unknown) {
              const msg =
                err && typeof err === "object" && "data" in err
                  ? String(
                      (err as { data?: { message?: string } }).data?.message ||
                        ""
                    )
                  : ""
              toast.error(msg || "Could not save profile")
            }
          }}
        />
      ) : null}
    </div>
  )
}

function DoctorAvailabilityPanel({
  doctor,
  onProfilePatch,
  savingProfile,
}: {
  doctor: Doctor
  onProfilePatch: (body: Partial<Doctor>) => Promise<void>
  savingProfile?: boolean
}) {
  const { data: schedules = [], isLoading: loadingSchedules, refetch } =
    useListMySchedulesQuery()
  const { data: timeOffs = [], refetch: refetchOff } = useListMyTimeOffQuery()
  const [createShift, { isLoading: creating }] = useCreateMyScheduleMutation()
  const [deleteShift] = useDeleteMyScheduleMutation()
  const [copyShift, { isLoading: copying }] = useCopyMyScheduleMutation()
  const [createOff, { isLoading: creatingOff }] = useCreateMyTimeOffMutation()
  const [deleteOff] = useDeleteMyTimeOffMutation()

  const [duration, setDuration] = useState(
    String(doctor.appointmentDurationMinutes || 30)
  )
  const [available, setAvailable] = useState(doctor.isAvailable !== false)
  const [form, setForm] = useState({
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "13:00",
    breakStart: "",
    breakEnd: "",
    label: "Morning",
    slotMinutes: String(doctor.appointmentDurationMinutes || 30),
  })
  const [offForm, setOffForm] = useState({
    date: todayIso(),
    startTime: "",
    endTime: "",
    kind: "OFF_DUTY",
    reason: "",
  })
  const [copyFrom, setCopyFrom] = useState("1")
  const [copyTo, setCopyTo] = useState<string[]>(["2", "3", "4"])

  useEffect(() => {
    setDuration(String(doctor.appointmentDurationMinutes || 30))
    setAvailable(doctor.isAvailable !== false)
  }, [doctor])

  const weekGrid = useMemo(() => {
    const byDay: Record<number, typeof schedules> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    }
    for (const s of schedules) {
      byDay[s.dayOfWeek] = byDay[s.dayOfWeek] || []
      byDay[s.dayOfWeek].push(s)
    }
    return byDay
  }, [schedules])

  const saveSettings = async () => {
    await onProfilePatch({
      isAvailable: available,
      appointmentDurationMinutes: Number(duration) || 30,
    })
  }

  const addShift = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createShift({
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        breakStart: form.breakStart || null,
        breakEnd: form.breakEnd || null,
        label: form.label || null,
        slotMinutes: Number(form.slotMinutes) || 30,
      }).unwrap()
      toast.success("Shift added")
      refetch()
    } catch {
      toast.error("Could not add shift")
    }
  }

  const addOff = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createOff({
        date: offForm.date,
        startTime: offForm.startTime || null,
        endTime: offForm.endTime || null,
        kind: offForm.kind,
        reason: offForm.reason || undefined,
      }).unwrap()
      toast.success("Time off saved")
      refetchOff()
    } catch {
      toast.error("Could not save time off")
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-100">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-dark">
              Availability &amp; schedule
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage when patients can book you. Times use Africa/Mogadishu
              (clinic clock).
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-blue-100 px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-brand-dark">
                  Available for booking
                </span>
                <span className="block text-xs text-muted-foreground">
                  Turn off to hide open slots
                </span>
              </span>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-brand-dark">
                Appointment duration
              </span>
              <select
                className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                {[15, 20, 30, 45, 60].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={savingProfile}
                onClick={() => void saveSettings()}
              >
                {savingProfile ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardContent className="p-0">
          <div className="border-b border-blue-50 px-5 py-3">
            <h3 className="font-semibold text-brand-dark">Weekly schedule</h3>
          </div>
          <div className="grid grid-cols-7 divide-x divide-blue-50">
            {WEEK_DAYS.map((day, idx) => (
              <div key={day} className="min-h-[110px] p-2">
                <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {day.slice(0, 3)}
                </p>
                {(weekGrid[idx] || []).length === 0 ? (
                  <p className="rounded-lg bg-slate-50 py-3 text-center text-[10px] font-semibold text-slate-400">
                    OFF
                  </p>
                ) : (
                  <div className="space-y-1">
                    {(weekGrid[idx] || []).map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-sky-100 bg-sky-50/80 px-1 py-1.5 text-center"
                      >
                        <p className="text-[10px] font-bold text-sky-900">
                          {formatClock(s.startTime)}
                        </p>
                        <p className="text-[9px] text-sky-700">–</p>
                        <p className="text-[10px] font-bold text-sky-900">
                          {formatClock(s.endTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-5">
            <h3 className="font-semibold text-brand-dark">Add working hours</h3>
            <form onSubmit={addShift} className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Day</span>
                <select
                  className="h-10 w-full rounded-xl border border-blue-100 px-3"
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({ ...form, dayOfWeek: e.target.value })
                  }
                >
                  {WEEK_DAYS.map((d, i) => (
                    <option key={d} value={String(i)}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Label"
                value={form.label}
                onChange={(v) => setForm({ ...form, label: v })}
                placeholder="Morning / Evening"
              />
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Start</span>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">End</span>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Break start</span>
                <Input
                  type="time"
                  value={form.breakStart}
                  onChange={(e) =>
                    setForm({ ...form, breakStart: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Break end</span>
                <Input
                  type="time"
                  value={form.breakEnd}
                  onChange={(e) =>
                    setForm({ ...form, breakEnd: e.target.value })
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={creating}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {creating ? "Saving…" : "Add shift"}
                </Button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-blue-50">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-brand-light/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Hours</th>
                    <th className="px-3 py-2">Break</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {loadingSchedules ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4">
                        <Skeleton className="h-8 rounded-lg" />
                      </td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-muted-foreground"
                      >
                        No shifts yet — add morning/evening windows above.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => (
                      <tr key={s.id} className="border-t border-blue-50">
                        <td className="px-3 py-2 font-medium">
                          {WEEK_DAYS[s.dayOfWeek]}
                          {s.label ? (
                            <span className="block text-[11px] text-muted-foreground">
                              {s.label}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {formatClock(s.startTime)} – {formatClock(s.endTime)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {s.breakStart && s.breakEnd
                            ? `${formatClock(s.breakStart)} – ${formatClock(s.breakEnd)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600"
                            onClick={async () => {
                              await deleteShift(s.id)
                              toast.success("Shift removed")
                              refetch()
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-dashed border-blue-100 p-3">
              <p className="mb-2 text-sm font-semibold text-brand-dark">
                Copy day to other days
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  From
                  <select
                    className="ml-2 h-9 rounded-lg border border-blue-100 px-2"
                    value={copyFrom}
                    onChange={(e) => setCopyFrom(e.target.value)}
                  >
                    {WEEK_DAYS.map((d, i) => (
                      <option key={d} value={String(i)}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-1">
                  {WEEK_DAYS.map((d, i) => {
                    const id = String(i)
                    const on = copyTo.includes(id)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setCopyTo((prev) =>
                            on ? prev.filter((x) => x !== id) : [...prev, id]
                          )
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          on
                            ? "bg-primary text-white"
                            : "border border-blue-100 text-primary"
                        )}
                      >
                        {d.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={copying}
                  onClick={async () => {
                    try {
                      await copyShift({
                        fromDay: Number(copyFrom),
                        toDays: copyTo.map(Number),
                      }).unwrap()
                      toast.success("Schedule copied")
                      refetch()
                    } catch {
                      toast.error("Copy failed")
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="space-y-3 p-5">
            <h3 className="font-semibold text-brand-dark">
              Off duty / temporary block
            </h3>
            <form onSubmit={addOff} className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="font-medium">Date</span>
                <Input
                  type="date"
                  value={offForm.date}
                  onChange={(e) =>
                    setOffForm({ ...offForm, date: e.target.value })
                  }
                  required
                />
              </label>
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="font-medium">Kind</span>
                <select
                  className="h-10 w-full rounded-xl border border-blue-100 px-3"
                  value={offForm.kind}
                  onChange={(e) =>
                    setOffForm({ ...offForm, kind: e.target.value })
                  }
                >
                  <option value="OFF_DUTY">Off duty (full day if no times)</option>
                  <option value="TEMPORARY_BLOCK">
                    Temporary block (set times)
                  </option>
                  <option value="HOLIDAY">Holiday</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Start (optional)</span>
                <Input
                  type="time"
                  value={offForm.startTime}
                  onChange={(e) =>
                    setOffForm({ ...offForm, startTime: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">End (optional)</span>
                <Input
                  type="time"
                  value={offForm.endTime}
                  onChange={(e) =>
                    setOffForm({ ...offForm, endTime: e.target.value })
                  }
                />
              </label>
              <Field
                label="Reason"
                value={offForm.reason}
                onChange={(v) => setOffForm({ ...offForm, reason: v })}
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={creatingOff}>
                  {creatingOff ? "Saving…" : "Save time off"}
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {timeOffs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No off-duty days yet.
                </p>
              ) : (
                timeOffs.slice(0, 12).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-blue-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-brand-dark">
                        {String(t.date).slice(0, 10)} ·{" "}
                        {(t.kind || "OFF_DUTY").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.startTime && t.endTime
                          ? `${formatClock(t.startTime)} – ${formatClock(t.endTime)}`
                          : "Full day"}
                        {t.reason ? ` · ${t.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      onClick={async () => {
                        await deleteOff(t.id)
                        toast.success("Removed")
                        refetchOff()
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function VisitRow({
  a,
  busy,
  onConfirm,
}: {
  a: Appointment
  busy?: boolean
  onConfirm?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 px-3 py-2">
      <div className="min-w-0">
        <p className="font-medium text-brand-dark">
          {a.user?.fullName || "Patient"}
        </p>
        <p className="text-xs text-muted-foreground">
          {a.appointmentCode} · {new Date(a.scheduledAt).toLocaleString()}
          {a.reason ? ` · ${a.reason}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{enumLabel(String(a.status))}</Badge>
        <Badge variant="secondary">
          {enumLabel(String(a.paymentStatus || "PENDING"))}
        </Badge>
        {onConfirm ? (
          <Button size="sm" disabled={busy} onClick={onConfirm}>
            Confirm
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function DoctorProfileForm({
  doctor,
  saving,
  onSave,
}: {
  doctor: Doctor
  saving?: boolean
  onSave: (body: Partial<Doctor>) => Promise<void>
}) {
  const [form, setForm] = useState({
    fullName: doctor.fullName || "",
    specialty: doctor.specialty || "",
    subSpecialty: doctor.subSpecialty || "",
    qualification: doctor.qualification || "",
    licenseNumber: doctor.licenseNumber || "",
    clinicName: doctor.clinicName || "",
    city: doctor.city || "",
    country: doctor.country || "",
    consultationFee:
      doctor.consultationFee != null ? String(doctor.consultationFee) : "",
    yearsExperience:
      doctor.yearsExperience != null ? String(doctor.yearsExperience) : "",
    bio: doctor.bio || "",
    videoConsultationEnabled: Boolean(doctor.videoConsultationEnabled),
    chatConsultationEnabled: Boolean(doctor.chatConsultationEnabled),
    isAvailable: doctor.isAvailable !== false,
  })

  useEffect(() => {
    setForm({
      fullName: doctor.fullName || "",
      specialty: doctor.specialty || "",
      subSpecialty: doctor.subSpecialty || "",
      qualification: doctor.qualification || "",
      licenseNumber: doctor.licenseNumber || "",
      clinicName: doctor.clinicName || "",
      city: doctor.city || "",
      country: doctor.country || "",
      consultationFee:
        doctor.consultationFee != null ? String(doctor.consultationFee) : "",
      yearsExperience:
        doctor.yearsExperience != null ? String(doctor.yearsExperience) : "",
      bio: doctor.bio || "",
      videoConsultationEnabled: Boolean(doctor.videoConsultationEnabled),
      chatConsultationEnabled: Boolean(doctor.chatConsultationEnabled),
      isAvailable: doctor.isAvailable !== false,
    })
  }, [doctor])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onSave({
      fullName: form.fullName,
      specialty: form.specialty,
      subSpecialty: form.subSpecialty || null,
      qualification: form.qualification || null,
      licenseNumber: form.licenseNumber || null,
      clinicName: form.clinicName || null,
      city: form.city || null,
      country: form.country || null,
      consultationFee: form.consultationFee
        ? Number(form.consultationFee)
        : 0,
      yearsExperience: form.yearsExperience
        ? Number(form.yearsExperience)
        : null,
      bio: form.bio || null,
      videoConsultationEnabled: form.videoConsultationEnabled,
      chatConsultationEnabled: form.chatConsultationEnabled,
      isAvailable: form.isAvailable,
      consultationEnabled: true,
    })
  }

  return (
    <Card className="border-blue-100">
      <CardContent className="p-5">
        <h2 className="font-heading text-lg font-bold text-brand-dark">
          My doctor profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Same details patients see on your public page (e.g. Dr. Khalid Omar).
        </p>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field
            label="Full name"
            value={form.fullName}
            onChange={(v) => setForm({ ...form, fullName: v })}
            required
          />
          <Field
            label="Specialty"
            value={form.specialty}
            onChange={(v) => setForm({ ...form, specialty: v })}
            required
          />
          <Field
            label="Sub-specialty"
            value={form.subSpecialty}
            onChange={(v) => setForm({ ...form, subSpecialty: v })}
          />
          <Field
            label="Qualification"
            value={form.qualification}
            onChange={(v) => setForm({ ...form, qualification: v })}
          />
          <Field
            label="License"
            value={form.licenseNumber}
            onChange={(v) => setForm({ ...form, licenseNumber: v })}
          />
          <Field
            label="Clinic"
            value={form.clinicName}
            onChange={(v) => setForm({ ...form, clinicName: v })}
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <Field
            label="Consultation fee (USD)"
            value={form.consultationFee}
            onChange={(v) => setForm({ ...form, consultationFee: v })}
            placeholder="0 = free"
          />
          <Field
            label="Years experience"
            value={form.yearsExperience}
            onChange={(v) => setForm({ ...form, yearsExperience: v })}
          />
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-brand-dark">Bio</span>
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-blue-100 px-3 py-2 text-sm"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.videoConsultationEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    videoConsultationEnabled: e.target.checked,
                  })
                }
              />
              Video visits
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.chatConsultationEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    chatConsultationEnabled: e.target.checked,
                  })
                }
              />
              Chat visits
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm({ ...form, isAvailable: e.target.checked })
                }
              />
              Available for booking
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
            <Button asChild type="button" variant="outline" className="ml-2">
              <Link to={`/doctors/${doctor.id}`}>View public profile</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-brand-dark">
        {label}
        {required ? " *" : ""}
      </span>
      <Input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function Stat({
  label,
  value,
  accent,
  money,
}: {
  label: string
  value: number
  accent?: boolean
  money?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        accent
          ? "border-amber-200 bg-amber-50/60"
          : "border-blue-100 bg-white"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-brand-dark">
        {money ? `$${value.toFixed(2)}` : value.toLocaleString()}
      </p>
    </div>
  )
}
