import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
} from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  hospitalAbout,
  hospitalCover,
  useGetPublicHospitalQuery,
  useGetPublicHospitalsQuery,
  type PublicHospital,
  type PublicHospitalDoctor,
} from '@/Redex/service/hospitals/HospitalsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const LIST_PATH = '/dashboard?section=hospitals'

export default function HospitalsSection() {
  const navigate = useNavigate()
  const location = useLocation()
  const tenantId =
    new URLSearchParams(location.search).get('hospital') || ''

  if (tenantId) {
    return (
      <HospitalDetailEmbedded
        tenantId={tenantId}
        onBack={() => navigate(LIST_PATH)}
      />
    )
  }

  return <HospitalsListEmbedded />
}

function HospitalsListEmbedded() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 9

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, refetch, isFetching } =
    useGetPublicHospitalsQuery({
      page,
      limit,
      search: search || undefined,
    })

  const hospitals = data?.data ?? []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
          Hospitals & clinics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live facilities from the Daryeel SaaS API — ratings, cities, doctors,
          and contact details.
        </p>
        {pagination ? (
          <p className="mt-2 text-sm font-semibold text-primary">
            {pagination.total} facilities · page {pagination.page} of{' '}
            {pagination.totalPages}
          </p>
        ) : null}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search hospital, city, country…"
            className="h-10 rounded-xl border-blue-100 bg-[#F8FAFC] pl-10"
          />
        </div>
      </header>

      {isLoading || isFetching ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-dark">
            Couldn’t load hospitals
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the SaaS API and try again.
          </p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital) => (
            <HospitalCard
              key={hospital.tenantId}
              hospital={hospital}
              onOpen={() =>
                navigate(
                  `${LIST_PATH}&hospital=${encodeURIComponent(hospital.tenantId)}`,
                )
              }
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && hospitals.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No hospitals match your search.
        </p>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm font-medium text-brand-dark">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function HospitalCard({
  hospital,
  onOpen,
}: {
  hospital: PublicHospital
  onOpen: () => void
}) {
  const doctors = hospital._count?.professionalProfiles
  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-2xl border border-blue-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-36 overflow-hidden bg-brand-light">
        <img
          src={hospitalCover(hospital)}
          alt={hospital.companyName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-1.5 p-3">
        <h2 className="font-heading text-base font-semibold text-brand-dark">
          {hospital.companyName}
        </h2>
        <p className="flex items-center gap-1 text-sm text-primary">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {[hospital.city, hospital.country].filter(Boolean).join(' · ') ||
              'Location TBA'}
          </span>
        </p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {hospitalAbout(hospital)}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-brand-dark">
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {Number(hospital.rating || 0).toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {hospital.industry || 'HOSPITAL'}
          </span>
          {typeof doctors === 'number' ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              {doctors} doctors
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function HospitalDetailEmbedded({
  tenantId,
  onBack,
}: {
  tenantId: string
  onBack: () => void
}) {
  const { data: hospital, isLoading, isError, refetch } =
    useGetPublicHospitalQuery(tenantId, { skip: !tenantId })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !hospital) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-blue-100 bg-white p-5">
        <h1 className="font-heading text-xl font-bold text-brand-dark">
          Hospital not found
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This facility is not available from the public hospitals API.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Button onClick={onBack}>Back to hospitals</Button>
        </div>
      </div>
    )
  }

  const doctors = hospital.doctors ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-primary"
      >
        ← Back to hospitals
      </button>

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="relative h-44 bg-brand-dark sm:h-52">
          <img
            src={hospitalCover(hospital)}
            alt={hospital.companyName}
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
              {hospital.industry || 'Health facility'}
            </p>
            <h1 className="font-heading text-2xl font-bold text-white">
              {hospital.companyName}
            </h1>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {hospitalAbout(hospital)}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="font-heading text-lg font-bold text-brand-dark">
                {Number(hospital.rating || 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="font-heading text-lg font-bold text-brand-dark">
                {hospital.totalReviews ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="font-heading text-lg font-bold text-brand-dark">
                {doctors.length}
              </p>
              <p className="text-xs text-muted-foreground">Doctors</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2 text-brand-dark">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {[hospital.address, hospital.city, hospital.country]
                .filter(Boolean)
                .join(', ') || 'Location TBA'}
            </p>
            {hospital.phone ? (
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center gap-2 text-primary"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {hospital.phone}
              </a>
            ) : null}
            {hospital.website ? (
              <a
                href={hospital.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 break-all text-primary"
              >
                <Globe className="h-4 w-4 shrink-0" />
                {hospital.website}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-heading text-lg font-semibold text-brand-dark">
          Doctors at this facility
        </h2>
        <div className="mt-3 space-y-3">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <FacilityDoctorCard
                key={doctor.professionalProfileId}
                doctor={doctor}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-blue-100 p-3 text-sm text-muted-foreground">
              No public doctors listed for this hospital yet. Browse database
              doctors from the Doctors tab.
            </p>
          )}
        </div>
        <Button asChild className="mt-4 w-full" variant="outline">
          <Link to="/dashboard?section=doctors">Browse hospital doctors</Link>
        </Button>
      </section>
    </div>
  )
}

function FacilityDoctorCard({ doctor }: { doctor: PublicHospitalDoctor }) {
  return (
    <article className="flex gap-3 rounded-xl border border-blue-50 bg-[#F8FAFC] p-3">
      <img
        src={doctorPhoto(doctor)}
        alt={doctorName(doctor)}
        className="h-14 w-14 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading font-semibold text-brand-dark">
            {doctorName(doctor)}
          </h3>
          {doctor.isVerified ? (
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              Verified
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-primary">
          {doctor.specialization || 'General Physician'}
          {doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {doctor.yearsOfExperience
            ? `${doctor.yearsOfExperience}+ yrs · `
            : ''}
          {doctor.consultationFee
            ? `${doctor.currency || 'USD'} ${doctor.consultationFee}`
            : 'Fee on request'}
        </p>
        {doctor.publicBio ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {doctor.publicBio}
          </p>
        ) : null}
        {doctor.publicPhone ? (
          <a
            href={`tel:${doctor.publicPhone}`}
            className="mt-2 inline-flex text-xs font-semibold text-primary"
          >
            Call {doctor.publicPhone}
          </a>
        ) : null}
      </div>
    </article>
  )
}
