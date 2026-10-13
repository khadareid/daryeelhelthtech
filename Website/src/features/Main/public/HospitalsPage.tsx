import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
} from 'lucide-react'
import {
  hospitalAbout,
  hospitalCover,
  useGetPublicHospitalsQuery,
  type PublicHospital,
} from '@/Redex/service/hospitals/HospitalsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'

export default function HospitalsPage() {
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
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-6 sm:py-10 lg:py-12">
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold text-brand-dark sm:text-3xl lg:text-4xl">
            Hospitals & clinics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
            Live facilities from the Daryeel SaaS API — ratings, cities, doctors,
            and contact details.
          </p>
          {pagination ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {pagination.total} facilities · page {pagination.page} of{' '}
              {pagination.totalPages}
            </p>
          ) : null}

          <div className="relative mt-4 sm:mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hospital, city, country..."
              className="h-11 rounded-full border-blue-100 bg-brand-bg pl-11 sm:h-12"
            />
          </div>
        </div>

        {isLoading || isFetching ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-white/80 sm:h-80 sm:rounded-3xl"
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="mt-8 rounded-3xl border border-blue-100 bg-white p-6">
            <h2 className="font-heading text-lg font-semibold text-brand-dark">
              Couldn’t load hospitals
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check the SaaS API and try again.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {hospitals.map((hospital) => (
              <HospitalCard key={hospital.tenantId} hospital={hospital} />
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && hospitals.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No hospitals match your search.
          </p>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
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
    </div>
  )
}

function HospitalCard({ hospital }: { hospital: PublicHospital }) {
  const doctors = hospital._count?.professionalProfiles
  return (
    <Link
      to={`/hospitals/${hospital.tenantId}`}
      className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-40 overflow-hidden bg-brand-light">
        <img
          src={hospitalCover(hospital)}
          alt={hospital.companyName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="space-y-2 p-4">
        <h2 className="font-heading text-lg font-semibold text-brand-dark group-hover:text-primary">
          {hospital.companyName}
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-primary">
          <MapPin className="h-3.5 w-3.5" />
          {[hospital.city, hospital.country].filter(Boolean).join(' · ') ||
            'Location TBA'}
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {hospitalAbout(hospital)}
        </p>
        {hospital.phone ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {hospital.phone}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-brand-dark">
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {Number(hospital.rating || 0).toFixed(1)}
            {hospital.totalReviews
              ? ` · ${hospital.totalReviews} reviews`
              : ''}
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
    </Link>
  )
}
