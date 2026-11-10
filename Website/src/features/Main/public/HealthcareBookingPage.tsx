import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react"
import {
  departmentIdOf,
  doctorIdOf,
  doctorNameOf,
  doctorSpecialtyOf,
  hospitalIdOf,
  hospitalNameOf,
  normalizeAvailabilitySlots,
  useCreateAppointmentMutation,
  useGetDepartmentsQuery,
  useGetDoctorAvailabilityQuery,
  useGetHospitalDoctorsQuery,
  useGetHospitalsQuery,
  type HealthcareAppointment,
} from "@/Redex/service/healthcare/HealthcareApi"
import { RootState } from "@/Redex/store/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { siteConfig } from "@/config/site"
import {
  BOOKING_TIME_SLOTS,
  combineDayAndSlot,
  isSlotInPast,
  nextBookingDays,
  toDateInputValue,
} from "@/lib/bookingSlots"
import { cn } from "@/lib/utils"

type Step =
  | "hospital"
  | "department"
  | "doctor"
  | "date"
  | "time"
  | "confirm"
  | "success"

const STEPS: Step[] = [
  "hospital",
  "department",
  "doctor",
  "date",
  "time",
  "confirm",
]

const STEP_LABELS: Record<Exclude<Step, "success">, string> = {
  hospital: "Hospital",
  department: "Department",
  doctor: "Doctor",
  date: "Date",
  time: "Time",
  confirm: "Confirm",
}

function formatSlotLabel(raw: string): string {
  if (/AM|PM/i.test(raw) && !raw.includes("T")) return raw
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  const m = raw.match(/(\d{1,2}:\d{2})/)
  return m ? m[1] : raw
}

function slotToIso(dateStr: string, slotRaw: string): string {
  if (slotRaw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(slotRaw)) {
    const d = new Date(slotRaw)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  if (/AM|PM/i.test(slotRaw)) {
    const day = new Date(`${dateStr}T00:00:00`)
    return combineDayAndSlot(day, slotRaw).toISOString()
  }
  const time = slotRaw.match(/(\d{1,2}:\d{2})/)?.[1]
  if (time) {
    return new Date(`${dateStr}T${time}:00`).toISOString()
  }
  return new Date(`${dateStr}T08:00:00`).toISOString()
}

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `ht-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

type Props = {
  /** When true, render inside the patient dashboard (no public home chrome). */
  embedded?: boolean
}

export default function HealthcareBookingPage({ embedded = false }: Props) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const hospitalsPath = embedded
    ? "/dashboard?section=hospitals"
    : "/hospitals"
  const visitsPath = "/dashboard?section=healthcare&tab=hospitals"
  const bookBase = embedded ? "/dashboard?section=book" : "/healthcare/book"

  const [hospitalId, setHospitalId] = useState(params.get("hospitalId") || "")
  const [department, setDepartment] = useState(params.get("department") || "")
  const [departmentId, setDepartmentId] = useState("")
  const [doctorId, setDoctorId] = useState(params.get("doctorId") || "")
  const days = useMemo(() => nextBookingDays(14), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState("")
  const [reason, setReason] = useState("")
  const [consent, setConsent] = useState(false)
  const [payMethod, setPayMethod] = useState<"later" | "zaad" | "edahab">(
    "later"
  )
  const [payPhone, setPayPhone] = useState("")
  const [step, setStep] = useState<Step>(() => {
    if (params.get("doctorId") && params.get("hospitalId")) return "date"
    if (params.get("hospitalId")) return "department"
    return "hospital"
  })
  const [created, setCreated] = useState<HealthcareAppointment | null>(null)

  const selectedDate = toDateInputValue(days[dayIndex])

  const { data: hospitals = [], isLoading: hospitalsLoading } =
    useGetHospitalsQuery({ limit: 60 })
  const { data: departments = [] } = useGetDepartmentsQuery(hospitalId, {
    skip: !hospitalId,
  })
  const { data: doctors = [], isLoading: doctorsLoading } =
    useGetHospitalDoctorsQuery(
      {
        hospitalId,
        department: department || undefined,
        limit: 60,
      },
      { skip: !hospitalId }
    )
  const { data: availability, isFetching: availLoading } =
    useGetDoctorAvailabilityQuery(
      { doctorId, date: selectedDate },
      { skip: !doctorId || !selectedDate || (step !== "time" && step !== "confirm") }
    )

  const [createAppt, { isLoading: booking }] = useCreateAppointmentMutation()

  const selectedHospital = hospitals.find(
    (h) => hospitalIdOf(h) === hospitalId
  )
  const selectedDoctor = doctors.find((d) => doctorIdOf(d) === doctorId)
  const fee = Number(selectedDoctor?.consultationFee || 0)
  const hasFee = fee > 0
  const currency = selectedDoctor?.currency || "USD"

  const apiSlots = useMemo(
    () => normalizeAvailabilitySlots(availability),
    [availability]
  )

  const timeOptions = useMemo(() => {
    if (apiSlots.length > 0) return apiSlots
    return BOOKING_TIME_SLOTS.filter(
      (s) => !isSlotInPast(days[dayIndex], s)
    )
  }, [apiSlots, days, dayIndex])

  useEffect(() => {
    if (!slot && timeOptions.length > 0) {
      setSlot(timeOptions[0])
    } else if (slot && timeOptions.length > 0 && !timeOptions.includes(slot)) {
      setSlot(timeOptions[0])
    }
  }, [timeOptions, slot])

  const goNext = () => {
    const idx = STEPS.indexOf(step as Exclude<Step, "success">)
    if (idx >= 0 && idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    }
  }

  const goBack = () => {
    if (step === "success") {
      setCreated(null)
      setStep("confirm")
      return
    }
    const idx = STEPS.indexOf(step as Exclude<Step, "success">)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const canProceed = () => {
    switch (step) {
      case "hospital":
        return Boolean(hospitalId)
      case "department":
        return true
      case "doctor":
        return Boolean(doctorId)
      case "date":
        return dayIndex >= 0
      case "time":
        return Boolean(slot)
      case "confirm":
        return consent && Boolean(slot) && Boolean(doctorId) && Boolean(hospitalId)
      default:
        return false
    }
  }

  const onConfirm = async (e: FormEvent) => {
    e.preventDefault()
    if (!signedIn) {
      const qs = params.toString()
      navigate("/signin", {
        state: {
          from: qs ? `${bookBase}&${qs}` : bookBase,
        },
      })
      return
    }
    if (!consent) {
      toast.error("Consent is required to share booking details with the hospital")
      return
    }
    if (!hospitalId || !doctorId || !slot) {
      toast.error("Complete all booking steps")
      return
    }
    try {
      const scheduledAt = slotToIso(selectedDate, slot)
      const feeNow = Number(selectedDoctor?.consultationFee || 0)
      const payNote =
        feeNow > 0
          ? payMethod === "later"
            ? "Payment: pay later at hospital"
            : `Payment preferred: ${payMethod.toUpperCase()}${
                payPhone.trim() ? ` · ${payPhone.trim()}` : ""
              }`
          : undefined
      const result = await createAppt({
        hospitalId,
        tenantId: hospitalId,
        doctorId,
        departmentId: departmentId || undefined,
        department: department || undefined,
        scheduledAt,
        reason: reason || undefined,
        notes: payNote,
        consentGranted: true,
        doctorName: selectedDoctor ? doctorNameOf(selectedDoctor) : undefined,
        facilityName: selectedHospital
          ? hospitalNameOf(selectedHospital)
          : undefined,
        specialty: selectedDoctor
          ? doctorSpecialtyOf(selectedDoctor)
          : department || undefined,
        consultationFee: feeNow > 0 ? feeNow : 0,
        currency: selectedDoctor?.currency || "USD",
        idempotencyKey: newIdempotencyKey(),
      }).unwrap()
      setCreated(result)
      setStep("success")
      toast.success(
        feeNow > 0
          ? "Appointment requested · fee noted for hospital"
          : "Appointment requested"
      )
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string }; message?: string })?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Booking failed"
      toast.error(message)
    }
  }

  const body = (
          <div className={cn(
            "rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8",
            !embedded && "mx-auto max-w-2xl"
          )}>
            {!embedded ? (
              <Button asChild variant="ghost" className="-ml-2 mb-4 w-fit text-brand-muted">
                <Link to={hospitalId ? `/hospitals/${hospitalId}` : hospitalsPath}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="-ml-2 mb-3 w-fit text-brand-muted">
                <Link to={hospitalsPath}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Hospitals
                </Link>
              </Button>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {siteConfig.appName}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              Book hospital visit
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              1 Hospital → 2 Department → 3 Doctor → 4 Date → 5 Time → 6 Confirm
              {hasFee ? " (pay if fee)" : ""}.
            </p>

            {step !== "success" ? (
              <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {STEPS.map((s, i) => {
                  const active = step === s
                  const done = STEPS.indexOf(step as Exclude<Step, "success">) > i
                  return (
                    <li
                      key={s}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-center",
                        active
                          ? "border-primary bg-primary text-white"
                          : done
                            ? "border-primary/30 bg-brand-light text-primary"
                            : "border-slate-100 bg-slate-50 text-slate-400"
                      )}
                    >
                      <span className="block text-[10px] font-bold tracking-wide">
                        {i + 1}
                      </span>
                      <span className="block text-[11px] font-semibold">
                        {STEP_LABELS[s]}
                      </span>
                    </li>
                  )
                })}
              </ol>
            ) : null}

            <div className="mt-6">
              {step === "hospital" ? (
                <div className="space-y-3">
                  <h2 className="font-semibold text-brand-dark">
                    1. Select hospital
                  </h2>
                  {hospitalsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-14 animate-pulse rounded-xl bg-brand-light"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {hospitals.map((h) => {
                        const id = hospitalIdOf(h)
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setHospitalId(id)
                              setDoctorId("")
                              setDepartment("")
                              setDepartmentId("")
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                              hospitalId === id
                                ? "border-primary bg-brand-light"
                                : "border-blue-100 hover:border-primary/30"
                            )}
                          >
                            <Building2 className="h-5 w-5 shrink-0 text-primary" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-brand-dark">
                                {hospitalNameOf(h)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {[h.city, h.country].filter(Boolean).join(", ")}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "department" ? (
                <div className="space-y-3">
                  <h2 className="font-semibold text-brand-dark">
                    2. Select department
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Optional — skip if you already know your doctor.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment("")
                      setDepartmentId("")
                    }}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left text-sm font-medium",
                      !department
                        ? "border-primary bg-brand-light text-primary"
                        : "border-blue-100"
                    )}
                  >
                    Any department
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((d) => {
                      const name = d.name || "Department"
                      const active = department === name
                      return (
                        <button
                          key={departmentIdOf(d)}
                          type="button"
                          onClick={() => {
                            setDepartment(name)
                            setDepartmentId(departmentIdOf(d))
                            setDoctorId("")
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            active
                              ? "bg-primary text-white"
                              : "bg-brand-light text-brand-dark"
                          )}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {step === "doctor" ? (
                <div className="space-y-3">
                  <h2 className="font-semibold text-brand-dark">
                    3. Select doctor
                  </h2>
                  {doctorsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-14 animate-pulse rounded-xl bg-brand-light"
                        />
                      ))}
                    </div>
                  ) : doctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No doctors found for this selection.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {doctors.map((d) => {
                        const id = doctorIdOf(d)
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setDoctorId(id)}
                            className={cn(
                              "flex w-full flex-col rounded-xl border px-3 py-3 text-left transition",
                              doctorId === id
                                ? "border-primary bg-brand-light"
                                : "border-blue-100 hover:border-primary/30"
                            )}
                          >
                            <span className="font-semibold text-brand-dark">
                              {doctorNameOf(d)}
                            </span>
                            <span className="text-xs text-primary">
                              {doctorSpecialtyOf(d)}
                              {Number(d.consultationFee || 0) > 0
                                ? ` · ${d.currency || "USD"} ${Number(d.consultationFee).toFixed(0)}`
                                : " · Free"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "date" ? (
                <div className="space-y-3">
                  <h2 className="font-semibold text-brand-dark">4. Select date</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {days.map((day, i) => (
                      <button
                        key={toDateInputValue(day)}
                        type="button"
                        onClick={() => {
                          setDayIndex(i)
                          setSlot("")
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-left text-sm",
                          dayIndex === i
                            ? "border-primary bg-brand-light font-semibold text-primary"
                            : "border-blue-100"
                        )}
                      >
                        {day.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "time" ? (
                <div className="space-y-3">
                  <h2 className="font-semibold text-brand-dark">5. Select time</h2>
                  {availLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading availability…
                    </p>
                  ) : timeOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No slots for this date. Try another day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {timeOptions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={cn(
                            "rounded-xl border px-2 py-2 text-xs font-semibold",
                            slot === s
                              ? "border-primary bg-primary text-white"
                              : "border-blue-100 text-brand-dark"
                          )}
                        >
                          {formatSlotLabel(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "confirm" ? (
                <form onSubmit={onConfirm} className="space-y-4">
                  <h2 className="font-semibold text-brand-dark">
                    6. Confirm{hasFee ? " & payment" : ""}
                  </h2>
                  <dl className="space-y-2 rounded-2xl bg-brand-light/60 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">1. Hospital</dt>
                      <dd className="font-semibold text-brand-dark">
                        {selectedHospital
                          ? hospitalNameOf(selectedHospital)
                          : hospitalId}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">2. Department</dt>
                      <dd className="font-semibold text-brand-dark">
                        {department || "Any"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">3. Doctor</dt>
                      <dd className="font-semibold text-brand-dark">
                        {selectedDoctor
                          ? doctorNameOf(selectedDoctor)
                          : doctorId}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">4–5. Date / time</dt>
                      <dd className="font-semibold text-brand-dark">
                        {selectedDate} · {formatSlotLabel(slot)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Fee</dt>
                      <dd className="font-semibold text-brand-dark">
                        {hasFee ? `${currency} ${fee.toFixed(2)}` : "Free"}
                      </dd>
                    </div>
                  </dl>

                  {hasFee ? (
                    <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                      <p className="text-sm font-semibold text-amber-950">
                        Payment required
                      </p>
                      <p className="text-xs text-amber-900/80">
                        Choose how you will pay the consultation fee.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            { id: "later", label: "Pay later" },
                            { id: "zaad", label: "Zaad" },
                            { id: "edahab", label: "eDahab" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPayMethod(opt.id)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-semibold",
                              payMethod === opt.id
                                ? "border-primary bg-white text-primary"
                                : "border-amber-100 bg-white/70 text-brand-dark"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {payMethod !== "later" ? (
                        <Input
                          value={payPhone}
                          onChange={(e) => setPayPhone(e.target.value)}
                          placeholder="Mobile money phone (optional)"
                        />
                      ) : (
                        <p className="text-xs text-amber-900/70">
                          Hospital can collect payment when they confirm your
                          visit.
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-brand-muted">
                      Reason (optional)
                    </label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why are you visiting?"
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-blue-100 p-3 text-sm">
                    <Checkbox
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      I consent to share my booking and contact details with the
                      hospital so they can process this appointment request.
                    </span>
                  </label>

                  {!signedIn ? (
                    <p className="text-xs text-amber-700">
                      You will be asked to sign in before submitting.
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canProceed() || booking}
                  >
                    {booking
                      ? "Submitting…"
                      : hasFee
                        ? payMethod === "later"
                          ? `Request · pay ${currency} ${fee.toFixed(0)} later`
                          : `Request · ${payMethod.toUpperCase()} ${currency} ${fee.toFixed(0)}`
                        : "Request appointment"}
                  </Button>
                </form>
              ) : null}

              {step === "success" && created ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-brand-dark">
                    Appointment requested
                  </h2>
                  <dl className="space-y-2 rounded-2xl bg-brand-light/60 p-4 text-left text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Appointment ID</dt>
                      <dd className="font-mono text-xs font-semibold text-brand-dark">
                        {created.appointmentCode || created.id}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Hospital</dt>
                      <dd className="font-semibold text-brand-dark">
                        {created.facilityName ||
                          (selectedHospital
                            ? hospitalNameOf(selectedHospital)
                            : "—")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Doctor</dt>
                      <dd className="font-semibold text-brand-dark">
                        {created.doctorName ||
                          (selectedDoctor
                            ? doctorNameOf(selectedDoctor)
                            : "—")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Date / time</dt>
                      <dd className="font-semibold text-brand-dark">
                        {new Date(created.scheduledAt).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-semibold text-primary">
                        {created.status}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link to={visitsPath}>
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        My Visits
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to={hospitalsPath}>Browse hospitals</Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {step !== "confirm" && step !== "success" ? (
              <div className="mt-6 flex gap-2">
                {STEPS.indexOf(step as Exclude<Step, "success">) > 0 ? (
                  <Button type="button" variant="outline" onClick={goBack}>
                    Back
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!canProceed()}
                  onClick={goNext}
                >
                  Continue
                </Button>
              </div>
            ) : null}

            {step === "confirm" ? (
              <div className="mt-3">
                <Button type="button" variant="ghost" onClick={goBack}>
                  Back
                </Button>
              </div>
            ) : null}
          </div>
  )

  if (embedded) return body

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">{body}</div>
    </div>
  )
}
