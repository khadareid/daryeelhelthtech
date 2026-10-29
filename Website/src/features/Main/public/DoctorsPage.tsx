import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Building2, MapPin, Star } from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  saasDoctorId,
  useGetPublicCareTeamQuery,
} from '@/Redex/service/hospitals/HospitalsApi'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

export default function DoctorsPage() {
  const [q, setQ] = useState('')
  const { data: doctors = [], isLoading, isError, refetch } =
    useGetPublicCareTeamQuery({ all: true })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return doctors
    return doctors.filter((d) => {
      const hay = [
        doctorName(d),
        d.specialization,
        d.hospitalName,
        d.city,
        d.country,
        d.facilityName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [doctors, q])

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Doctors
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Live clinicians from Daryeel SaaS hospitals — book a visit and the
            hospital sees your request instantly.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctors, specialty, hospital, city…"
              className="h-10 min-w-[220px] flex-1 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/hospitals">Browse hospitals</Link>
            </Button>
          </div>
          {!isLoading ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {filtered.length} clinicians from SaaS hospitals
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="mt-8 rounded-3xl border border-blue-100 bg-white p-6">
            <h2 className="font-heading text-lg font-semibold text-brand-dark">
              Couldn&apos;t load hospital doctors
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check the SaaS public hospitals API and try again.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((doctor) => {
              const id = saasDoctorId(doctor)
              const href = `/doctors/${encodeURIComponent(id)}?hospital=${encodeURIComponent(doctor.hospitalId)}`
              return (
                <Link
                  key={`${doctor.hospitalId}-${id}`}
                  to={href}
                  className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-brand-light">
                    <img
                      src={doctorPhoto(doctor)}
                      alt={doctorName(doctor)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent p-4 pt-16 text-white">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-heading font-semibold leading-snug">
                          {doctorName(doctor)}
                        </h2>
                        {doctor.isVerified ? (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-white/85">
                        {doctor.specialization || 'Doctor'}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
                        <Building2 className="h-3 w-3" />
                        {doctor.hospitalName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="h-3 w-3" />
                        {[doctor.city, doctor.country].filter(Boolean).join(' · ') ||
                          'Location TBA'}
                        {typeof doctor.averageRating === 'number' &&
                        doctor.averageRating > 0 ? (
                          <>
                            <Star className="ml-1 h-3 w-3 fill-amber-300 text-amber-300" />
                            {doctor.averageRating.toFixed(1)}
                          </>
                        ) : null}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-sky-200">
                        Book appointment →
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}

        {!isLoading && !isError && filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No SaaS hospital doctors match your search. Open Hospitals to browse
            facilities.
          </p>
        ) : null}
      </div>
    </div>
  )
}
