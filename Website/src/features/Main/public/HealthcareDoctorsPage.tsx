import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { MapPin, Star } from "lucide-react"
import {
  doctorHospitalNameOf,
  doctorIdOf,
  doctorNameOf,
  doctorPhotoOf,
  doctorSpecialtyOf,
  useGetDoctorsQuery,
} from "@/Redex/service/healthcare/HealthcareApi"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export default function HealthcareDoctorsPage() {
  const [params] = useSearchParams()
  const hospitalId = params.get("hospitalId") || ""
  const [q, setQ] = useState(params.get("q") || "")
  const [specialty, setSpecialty] = useState(params.get("specialty") || "")
  const [city, setCity] = useState(params.get("city") || "")

  const queryArgs = useMemo(
    () => ({
      search: q.trim() || undefined,
      specialization: specialty.trim() || undefined,
      city: city.trim() || undefined,
      hospitalId: hospitalId || undefined,
      limit: 60,
    }),
    [q, specialty, city, hospitalId]
  )

  const { data: doctors = [], isLoading, isError, refetch } =
    useGetDoctorsQuery(queryArgs)

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Hospital doctors
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Search clinicians across partner hospitals and book a hospital visit.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctors…"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Specialty"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/hospitals">Hospitals</Link>
            </Button>
            <Button asChild>
              <Link to="/healthcare/book">Book appointment</Link>
            </Button>
          </div>

          {!isLoading ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {doctors.length} doctors
              {hospitalId ? " at this hospital" : ""}
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
          <div className="mt-8 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-700">Could not load doctors.</p>
            <Button className="mt-3" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && doctors.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No doctors match your search.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((d) => {
            const id = doctorIdOf(d)
            const photo = doctorPhotoOf(d)
            const hospitalName = doctorHospitalNameOf(d)
            const hospital =
              d.hospitalId || d.tenant?.tenantId || hospitalId || ""
            const rating = d.averageRating
            return (
              <article
                key={id}
                className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-brand-light">
                  {photo ? (
                    <img
                      src={photo}
                      alt={doctorNameOf(d)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold text-primary/40">
                      {doctorNameOf(d).slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h2 className="font-heading text-base font-bold text-brand-dark">
                    {doctorNameOf(d)}
                  </h2>
                  <p className="text-sm font-medium text-primary">
                    {doctorSpecialtyOf(d)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {hospitalName ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hospitalName}
                        {d.city ? ` · ${d.city}` : ""}
                      </span>
                    ) : d.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {d.city}
                      </span>
                    ) : null}
                    {rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {String(rating)}
                      </span>
                    ) : null}
                  </div>
                  <Button asChild className="mt-2 w-full" size="sm">
                    <Link
                      to={`/healthcare/book?${new URLSearchParams({
                        ...(hospital ? { hospitalId: hospital } : {}),
                        doctorId: id,
                        ...(doctorSpecialtyOf(d)
                          ? { department: doctorSpecialtyOf(d) }
                          : {}),
                      }).toString()}`}
                    >
                      Book
                    </Link>
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
