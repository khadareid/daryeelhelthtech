import { Link } from 'react-router-dom'
import { BadgeCheck, Building2, MapPin } from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  useGetPublicCareTeamQuery,
} from '@/Redex/service/hospitals/HospitalsApi'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

export default function DoctorsPage() {
  const { data: doctors = [], isLoading, isError, refetch } =
    useGetPublicCareTeamQuery()

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Clinicians you can trust
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Real doctors from Daryeel hospitals — same care-team data as the
            mobile app.
          </p>
          <div className="mt-5">
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/hospitals">Browse hospitals</Link>
            </Button>
          </div>
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
              Couldn’t load clinicians
            </h2>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <Link
                key={doctor.professionalProfileId}
                to={`/doctors/${doctor.professionalProfileId}`}
                className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
                    <p className="mt-1 text-sm text-sky-100">
                      {doctor.specialization || 'General Physician'}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-blue-100/90">
                      <MapPin className="h-3 w-3" />
                      {doctor.city || 'Somaliland'}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-100/90">
                      <Building2 className="h-3 w-3" />
                      {doctor.hospitalName}
                    </p>
                    {doctor.consultationFee ? (
                      <p className="mt-2 text-xs font-medium text-amber-200">
                        {doctor.currency || 'USD'} {doctor.consultationFee}
                        {doctor.yearsOfExperience
                          ? ` · ${doctor.yearsOfExperience}+ yrs`
                          : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && doctors.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No public clinicians listed yet.
          </p>
        ) : null}
      </div>
    </div>
  )
}
