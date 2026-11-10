import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  MapPin,
  Star,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { RootState } from "@/Redex/store/store"
import {
  doctorDisplayName,
  doctorPhoto,
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
    () => firstAvailableSlot(days[0]) || BOOKING_TIME_SLOTS[0]
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
    [selectedDay, now]
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
          : `Booking confirmed — pay ${doctor?.currency || "USD"} ${fee.toFixed(2)} in Visits`
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
      <div className="container-page space-y-4 py-10">
        <Skeleton className="h-8 w-40 rounded-full" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
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

  return (
    <div className="bg-[#F0F4FA]">
      <div className="container-page py-8 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/doctors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Doctors
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={doctorPhoto(doctor)} />
                <AvatarFallback>
                  {doctorDisplayName(doctor).slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    {doctorDisplayName(doctor)}
                  </h1>
                  {doctor.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  ) : null}
                </div>
                <p className="mt-1 text-muted-foreground">{doctor.specialty}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {(doctor.city || doctor.country) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[doctor.city, doctor.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {doctor.rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {String(doctor.rating)} ({doctor.reviewCount ?? 0})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-50 bg-brand-light/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Specialty (takhassus)
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-brand-dark">
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
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  About
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {doctor.bio}
                </p>
              </div>
            ) : null}

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {doctor.qualification ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Qualification
                  </dt>
                  <dd className="text-sm text-brand-dark">
                    {doctor.qualification}
                  </dd>
                </div>
              ) : null}
              {doctor.yearsExperience ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Experience
                  </dt>
                  <dd className="text-sm text-brand-dark">
                    {doctor.yearsExperience} years
                  </dd>
                </div>
              ) : null}
              {doctor.clinicName ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Clinic
                  </dt>
                  <dd className="text-sm text-brand-dark">{doctor.clinicName}</dd>
                </div>
              ) : null}
              {doctor.licenseNumber ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    License
                  </dt>
                  <dd className="text-sm text-brand-dark">
                    {doctor.licenseNumber}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Fee
                </dt>
                <dd className="text-sm font-semibold text-brand-dark">
                  {isFree
                    ? "Free"
                    : `${fee.toFixed(2)} ${doctor.currency || "USD"}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Visit types
                </dt>
                <dd className="text-sm text-brand-dark">
                  {[
                    doctor.consultationEnabled !== false ? "In-person" : null,
                    doctor.videoConsultationEnabled ? "Video" : null,
                    doctor.chatConsultationEnabled ? "Chat" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "In-person"}
                </dd>
              </div>
              {doctor.languages && doctor.languages.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Languages
                  </dt>
                  <dd className="text-sm text-brand-dark">
                    {doctor.languages.join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <aside className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-brand-dark">
                Book a visit
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a day and time (every 20 min, e.g. 8:00 · 8:20 · 8:40).
            </p>
            <form onSubmit={onBook} className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Day
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((d, i) => (
                    <button
                      key={toDateInputValue(d)}
                      type="button"
                      onClick={() => setDayIndex(i)}
                      className={cn(
                        "min-w-[68px] shrink-0 rounded-xl border px-2 py-2 text-center text-xs font-semibold",
                        dayIndex === i
                          ? "border-primary bg-primary text-white"
                          : "border-blue-100 bg-brand-light/50 text-brand-dark"
                      )}
                    >
                      <span className="block">
                        {d.toLocaleDateString(undefined, { weekday: "short" })}
                      </span>
                      <span className="block text-[11px] opacity-80">
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time
                </p>
                {availableSlots.length === 0 ? (
                  <p className="mb-2 text-xs text-amber-700">
                    No times left this day — pick another day.
                  </p>
                ) : null}
                <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
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
                          "rounded-lg border px-1.5 py-2 text-center text-[11px] font-semibold",
                          past && "cursor-not-allowed opacity-35",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-blue-100 bg-white text-brand-dark hover:border-primary/40"
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
              />
              <p className="text-xs text-muted-foreground">
                {isFree
                  ? "This visit is free."
                  : `Fee ${fee.toFixed(2)} ${doctor.currency || "USD"} — pay with Zaad, eDahab, Sahal after booking.`}
              </p>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  booking || availableSlots.length === 0 || slotPast
                }
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
