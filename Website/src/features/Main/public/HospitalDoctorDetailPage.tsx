import { Link, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Languages,
  MapPin,
  Star,
  Stethoscope,
} from "lucide-react"
import { HealthcareDoctorAvatar } from "@/components/home/HealthcareDoctorAvatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"
import { toDateInputValue } from "@/lib/bookingSlots"
import { RootState } from "@/Redex/store/store"
import {
  availabilityStatusLabel,
  availabilityStatusTone,
  doctorCurrencyOf,
  doctorFeeOf,
  doctorHospitalNameOf,
  doctorNameOf,
  doctorSpecialtyOf,
  formatNextAvailable,
  hospitalNameOf,
  useGetDoctorAvailabilityQuery,
  useGetDoctorQuery,
  useGetHospitalQuery,
  type HealthcareDoctor,
} from "@/Redex/service/healthcare/HealthcareApi"

function deptLabel(d: HealthcareDoctor) {
  if (typeof d.department === "string" && d.department) return d.department
  if (d.department && typeof d.department === "object" && d.department.name) {
    return String(d.department.name)
  }
  return null
}

export default function HospitalDoctorDetailPage() {
  const { hospitalId = "", doctorId = "" } = useParams()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const {
    data: doctor,
    isLoading,
    isError,
    refetch,
  } = useGetDoctorQuery(doctorId, { skip: !doctorId })
  const { data: hospital } = useGetHospitalQuery(hospitalId, {
    skip: !hospitalId,
  })
  const today = toDateInputValue(new Date())
  const { data: availability } = useGetDoctorAvailabilityQuery(
    { doctorId, date: today },
    { skip: !doctorId }
  )
  const status = availability?.status
  const hasOpenSlots = Boolean(
    (availability?.slots || []).some((s) =>
      typeof s === "string" ? true : s?.available !== false
    )
  )
  const canBook =
    hasOpenSlots || String(status || "").toUpperCase() === "AVAILABLE"

  const bookHref = () => {
    const qs = new URLSearchParams()
    if (hospitalId) qs.set("hospitalId", hospitalId)
    if (doctorId) qs.set("doctorId", doctorId)
    return signedIn
      ? `/dashboard?section=book&${qs.toString()}`
      : `/healthcare/book?${qs.toString()}`
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-brand-bg">
        <div className="container-page space-y-4 py-8 sm:py-10">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-[28rem] rounded-[1.75rem]" />
        </div>
      </div>
    )
  }

  if (isError || !doctor) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted-foreground">Doctor profile not found.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Button asChild>
            <Link to={hospitalId ? `/hospitals/${hospitalId}` : "/hospitals"}>
              Back to hospital
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const name = doctorNameOf(doctor)
  const specialty = doctorSpecialtyOf(doctor)
  const hospitalLabel =
    hospitalNameOf(hospital) || doctorHospitalNameOf(doctor) || "Hospital"
  const place = [doctor.city, doctor.facilityName].filter(Boolean).join(" · ")
  const fee = doctorFeeOf(doctor)
  const currency = doctorCurrencyOf(doctor)
  const department = deptLabel(doctor)
  const bio = String(doctor.publicBio || "").trim()
  const languages = Array.isArray(doctor.languages) ? doctor.languages : []
  const experience =
    typeof doctor.yearsOfExperience === "number"
      ? doctor.yearsOfExperience
      : null
  const rating =
    typeof doctor.averageRating === "number" ? doctor.averageRating : null

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-6 sm:py-8 lg:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to={hospitalId ? `/hospitals/${hospitalId}` : "/hospitals"}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {hospitalLabel}
          </Link>
        </Button>

        <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-primary/90 via-primary to-brand-dark px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-100 uppercase">
              {siteConfig.appName} · Hospital doctor
            </p>
            <h1 className="mt-2 max-w-2xl font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              {name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-blue-50/95">
              <Stethoscope className="h-4 w-4 shrink-0" />
              <span>{specialty}</span>
            </p>
          </div>

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <HealthcareDoctorAvatar
                doctor={doctor}
                rounded="full"
                className="h-24 w-24 ring-4 ring-white sm:h-28 sm:w-28"
                initialsClassName="text-2xl sm:text-3xl"
              />
              <div className="flex flex-wrap gap-2">
                {status ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                      availabilityStatusTone(status) === "success"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : availabilityStatusTone(status) === "warning"
                          ? "bg-amber-50 text-amber-800 ring-amber-100"
                          : availabilityStatusTone(status) === "danger"
                            ? "bg-rose-50 text-rose-700 ring-rose-100"
                            : "bg-slate-50 text-slate-600 ring-slate-100"
                    }`}
                  >
                    {availabilityStatusLabel(status)}
                  </span>
                ) : null}
                {doctor.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : null}
                {rating != null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                    {doctor.totalReviews != null
                      ? ` (${doctor.totalReviews})`
                      : ""}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark ring-1 ring-blue-100">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {hospitalLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoTile label="Specialty" value={specialty} />
              {department ? (
                <InfoTile label="Department" value={department} />
              ) : null}
              {place ? (
                <InfoTile
                  label="Location"
                  value={place}
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
              ) : null}
              {experience != null ? (
                <InfoTile label="Experience" value={`${experience} years`} />
              ) : null}
              <InfoTile
                label="Consultation fee"
                value={fee > 0 ? `${fee.toFixed(2)} ${currency}` : "Free / TBA"}
              />
              <InfoTile
                label="Today"
                value={availabilityStatusLabel(status)}
              />
              <InfoTile
                label="Next available"
                value={formatNextAvailable(availability?.nextAvailable)}
              />
              {(availability?.workingHours || []).length > 0 ? (
                <InfoTile
                  label="Today's hours"
                  value={(availability?.workingHours || [])
                    .map((w) => `${w.start} – ${w.end}`)
                    .join(" · ")}
                />
              ) : null}
              {availability?.reason ? (
                <InfoTile label="Reason" value={String(availability.reason)} />
              ) : null}
              {doctor.facilityName ? (
                <InfoTile label="Facility" value={String(doctor.facilityName)} />
              ) : null}
              {languages.length > 0 ? (
                <div className="rounded-2xl border border-blue-50 bg-[#F8FAFC] px-4 py-3 sm:col-span-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <Languages className="h-3.5 w-3.5" />
                    Languages
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-dark">
                    {languages.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>

            {bio ? (
              <div className="mt-6">
                <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  About
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {bio}
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-blue-50 bg-brand-light/50 p-4 sm:p-5">
              <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Account / profile
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Row label="Full name" value={name} />
                <Row label="Specialty" value={specialty} />
                {department ? <Row label="Department" value={department} /> : null}
                <Row label="Hospital" value={hospitalLabel} />
                {doctor.facilityName ? (
                  <Row label="Facility" value={String(doctor.facilityName)} />
                ) : null}
                {place ? <Row label="City / place" value={place} /> : null}
                <Row
                  label="Fee"
                  value={fee > 0 ? `${fee.toFixed(2)} ${currency}` : "Free / TBA"}
                />
                {experience != null ? (
                  <Row label="Years of experience" value={String(experience)} />
                ) : null}
                {languages.length > 0 ? (
                  <Row label="Languages" value={languages.join(", ")} />
                ) : null}
                <Row
                  label="Verification"
                  value={doctor.isVerified ? "Verified" : "Listed on hospital"}
                />
                {doctor.doctorId || doctor.id || doctor.userId ? (
                  <Row
                    label="Provider ID"
                    value={String(
                      doctor.doctorId || doctor.id || doctor.userId || "",
                    )}
                  />
                ) : null}
              </dl>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {canBook ? (
                <Button asChild className="h-11 flex-1 rounded-xl">
                  <Link to={bookHref()}>Book appointment</Link>
                </Button>
              ) : (
                <Button asChild className="h-11 flex-1 rounded-xl">
                  <Link to={bookHref()}>View available times</Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="h-11 flex-1 rounded-xl border-primary/20"
              >
                <Link to={`/hospitals/${hospitalId}`}>Back to hospital</Link>
              </Button>
            </div>
            {!canBook && status ? (
              <p className="mt-2 text-center text-xs text-rose-600">
                {availabilityStatusLabel(status)}
                {availability?.nextAvailable
                  ? ` · next ${formatNextAvailable(availability.nextAvailable)}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-blue-50 bg-[#F8FAFC] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-brand-dark">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 break-all text-sm font-medium text-brand-dark">
        {value}
      </dd>
    </div>
  )
}
