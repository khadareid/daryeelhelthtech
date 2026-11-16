import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Clock3,
  Languages,
  MapPin,
  Stethoscope,
  Star,
} from "lucide-react"
import { DoctorAvatar } from "@/components/home/DoctorAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { RootState } from "@/Redex/store/store"
import {
  doctorDisplayName,
  useGetDoctorQuery,
} from "@/Redex/service/doctors/DoctorsApi"
import { useCreateAppointmentMutation } from "@/Redex/service/appointments/AppointmentsApi"
import { siteConfig } from "@/config/site"
import {
  BOOKING_TIME_SLOTS,
  combineDayAndSlot,
  firstAvailableSlot,
  isSlotInPast,
  nextBookingDays,
  toDateInputValue,
} from "@/lib/bookingSlots"
import { cn } from "@/lib/utils"

export default function DoctorDetailPage() {
  const { doctorId = "" } = useParams()
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const { data: doctor, isLoading, isError } = useGetDoctorQuery(doctorId, {
    skip: !doctorId,
  })
  const [createAppt, { isLoading: booking }] = useCreateAppointmentMutation()
  const days = useMemo(() => nextBookingDays(14), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState(
    () => firstAvailableSlot(days[0]) || BOOKING_TIME_SLOTS[0],
  )
  const [reason, setReason] = useState("")
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const now = useMemo(() => new Date(nowTick), [nowTick])
  const selectedDay = days[dayIndex]
  const availableSlots = useMemo(
    () => BOOKING_TIME_SLOTS.filter((s) => !isSlotInPast(selectedDay, s, now)),
    [selectedDay, now],
  )
  const slotPast = isSlotInPast(selectedDay, slot, now)

  useEffect(() => {
    if (slotPast || !availableSlots.includes(slot)) {
      const next = firstAvailableSlot(selectedDay, BOOKING_TIME_SLOTS, now)
      if (next) setSlot(next)
    }
  }, [selectedDay, slotPast, availableSlots, slot, now])

  const fee = Number(doctor?.consultationFee || 0)
  const isFree = fee <= 0

  const onBook = async (e: FormEvent) => {
    e.preventDefault()
    if (!signedIn) {
      navigate("/signin", { state: { from: `/doctors/${doctorId}` } })
      return
    }
    if (!slot || availableSlots.length === 0) {
      toast.error("Pick a future time")
      return
    }
    const when = combineDayAndSlot(days[dayIndex], slot)
    if (when.getTime() <= Date.now()) {
      toast.error("That time has already passed — pick a later slot")
      return
    }
    try {
      await createAppt({
        doctorId,
        scheduledAt: when.toISOString(),
        reason: reason || undefined,
        consultationFee: isFree ? 0 : fee,
        currency: doctor?.currency || "USD",
        paymentRequired: !isFree,
      }).unwrap()
      toast.success(
        isFree
          ? "Booking confirmed — opening Visits"
          : `Booking confirmed — pay ${doctor?.currency || "USD"} ${fee.toFixed(2)} in Visits`,
      )
      navigate("/dashboard?section=healthcare&tab=daryeel")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Booking failed")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-brand-bg">
        <div className="container-page space-y-4 py-8 sm:py-10">
          <Skeleton className="h-8 w-36 rounded-full" />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Skeleton className="h-[28rem] rounded-[1.75rem]" />
            <Skeleton className="h-[28rem] rounded-[1.75rem]" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !doctor) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/doctors">Back to doctors</Link>
        </Button>
      </div>
    )
  }

  const place = [doctor.city, doctor.country].filter(Boolean).join(", ")
  const visitTypes = [
    doctor.consultationEnabled !== false ? "In-person" : null,
    doctor.videoConsultationEnabled ? "Video" : null,
    doctor.chatConsultationEnabled ? "Chat" : null,
  ].filter(Boolean)

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-6 sm:py-8 lg:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 sm:mb-4">
          <Link to="/doctors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Doctors
          </Link>
        </Button>

        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
          {/* Profile */}
          <section className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
            <div className="relative bg-gradient-to-br from-primary/90 via-primary to-brand-dark px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-100 uppercase">
                {siteConfig.appName}
              </p>
              <h1 className="mt-2 max-w-xl font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                {doctorDisplayName(doctor)}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-blue-50/95">
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>
                  {doctor.specialty}
                  {doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ""}
                </span>
              </p>
            </div>

            <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
              <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <DoctorAvatar
                  doctor={doctor}
                  rounded="full"
                  className="h-24 w-24 ring-4 ring-white sm:h-28 sm:w-28"
                  initialsClassName="text-2xl sm:text-3xl"
                />
                <div className="flex flex-wrap gap-2">
                  {doctor.verificationStatus === "VERIFIED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : null}
                  {doctor.rating != null ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {String(doctor.rating)}
                      {doctor.reviewCount != null
                        ? ` (${doctor.reviewCount})`
                        : ""}
                    </span>
                  ) : null}
                  {place ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark ring-1 ring-blue-100">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {place}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-50 bg-brand-light/60 px-4 py-3 sm:px-5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Specialty
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-brand-dark sm:text-xl">
                  {doctor.specialty}
                  {doctor.subSpecialty ? (
                    <span className="font-medium text-primary">
                      {" "}
                      · {doctor.subSpecialty}
                    </span>
                  ) : null}
                </p>
              </div>

              {doctor.bio ? (
                <div className="mt-6">
                  <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    About
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {doctor.bio}
                  </p>
                </div>
              ) : null}

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {doctor.qualification ? (
                  <InfoTile label="Qualification" value={doctor.qualification} />
                ) : null}
                {doctor.yearsExperience ? (
                  <InfoTile
                    label="Experience"
                    value={`${doctor.yearsExperience} years`}
                  />
                ) : null}
                {doctor.clinicName ? (
                  <InfoTile label="Clinic" value={doctor.clinicName} />
                ) : null}
                {doctor.licenseNumber ? (
                  <InfoTile label="License" value={doctor.licenseNumber} />
                ) : null}
                <InfoTile
                  label="Fee"
                  value={
                    isFree
                      ? "Free"
                      : `${fee.toFixed(2)} ${doctor.currency || "USD"}`
                  }
                />
                <InfoTile
                  label="Visit types"
                  value={visitTypes.join(" · ") || "In-person"}
                />
                {doctor.languages && doctor.languages.length > 0 ? (
                  <div className="rounded-2xl border border-blue-50 bg-[#F8FAFC] px-4 py-3 sm:col-span-2">
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      <Languages className="h-3.5 w-3.5" />
                      Languages
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-brand-dark">
                      {doctor.languages.join(", ")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>

          {/* Booking — stacks under profile on mobile */}
          <aside className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-20">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-primary">
                <Calendar className="h-4.5 w-4.5 h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-brand-dark">
                  Book a visit
                </h2>
                <p className="text-xs text-muted-foreground">
                  Choose a day and time
                </p>
              </div>
            </div>

            <form onSubmit={onBook} className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Day
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {days.map((d, i) => (
                    <button
                      key={toDateInputValue(d)}
                      type="button"
                      onClick={() => setDayIndex(i)}
                      className={cn(
                        "min-w-[4.25rem] shrink-0 rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition",
                        dayIndex === i
                          ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                          : "border-blue-100 bg-brand-light/50 text-brand-dark hover:border-primary/30",
                      )}
                    >
                      <span className="block">
                        {d.toLocaleDateString(undefined, { weekday: "short" })}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">
                        {d.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <Clock3 className="h-3.5 w-3.5" />
                  Time
                </p>
                {availableSlots.length === 0 ? (
                  <p className="mb-2 text-xs text-amber-700">
                    No times left this day — pick another day.
                  </p>
                ) : null}
                <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {BOOKING_TIME_SLOTS.map((t) => {
                    const past = isSlotInPast(selectedDay, t, now)
                    const active = slot === t && !past
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={past}
                        onClick={() => setSlot(t)}
                        className={cn(
                          "rounded-lg border px-1.5 py-2.5 text-center text-[11px] font-semibold transition",
                          past && "cursor-not-allowed opacity-35",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-blue-100 bg-white text-brand-dark hover:border-primary/40",
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Input
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                {isFree
                  ? "This visit is free."
                  : `Fee ${fee.toFixed(2)} ${doctor.currency || "USD"} — pay with Zaad, eDahab, Sahal after booking.`}
              </p>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl text-sm font-semibold"
                disabled={booking || availableSlots.length === 0 || slotPast}
              >
                {booking
                  ? "Booking…"
                  : !signedIn
                    ? "Sign in to book"
                    : availableSlots.length === 0
                      ? "No times left"
                      : `Book · ${slot}`}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Support · {siteConfig.supportEmail}
              </p>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-50 bg-[#F8FAFC] px-4 py-3">
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
