import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, MapPin, Star, Stethoscope } from "lucide-react"
import {
  hospitalDoctorsCount,
  hospitalIdOf,
  hospitalLogoOf,
  hospitalNameOf,
  hospitalRatingOf,
  useGetHospitalsQuery,
} from "@/Redex/service/healthcare/HealthcareApi"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export default function HospitalsPage() {
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("")
  const [department, setDepartment] = useState("")
  const [availableToday, setAvailableToday] = useState(false)

  const queryArgs = useMemo(
    () => ({
      search: search.trim() || undefined,
      city: city.trim() || undefined,
      department: department.trim() || undefined,
      availableToday: availableToday || undefined,
      limit: 48,
    }),
    [search, city, department, availableToday]
  )

  const { data: hospitals = [], isLoading, isError, refetch } =
    useGetHospitalsQuery(queryArgs)

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Hospitals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Discover partner hospitals, browse departments and doctors, then book
            a visit — all through Daryeel Healthtech.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospitals…"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department / specialty"
              className="h-10 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <label className="flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm text-brand-dark">
              <input
                type="checkbox"
                checked={availableToday}
                onChange={(e) => setAvailableToday(e.target.checked)}
                className="h-4 w-4 rounded border-blue-200"
              />
              Available today
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/doctors">Daryeel doctors</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/healthcare/book">Book hospital visit</Link>
            </Button>
          </div>

          {!isLoading ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {hospitals.length} hospitals
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="mt-8 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-700">Could not load hospitals.</p>
            <Button className="mt-3" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && hospitals.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hospitals match your filters.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((h) => {
            const id = hospitalIdOf(h)
            const name = hospitalNameOf(h)
            const logo = hospitalLogoOf(h)
            const rating = hospitalRatingOf(h)
            const doctorsCount = hospitalDoctorsCount(h)
            const location = [h.city, h.country].filter(Boolean).join(", ")

            return (
              <article
                key={id || name}
                className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-center gap-4 border-b border-blue-50 p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-light">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg font-bold text-brand-dark">
                      {name}
                    </h2>
                    {location ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      {doctorsCount} doctors
                    </span>
                    {rating != null && !Number.isNaN(rating) ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  {h.publicDescription || h.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {String(h.publicDescription || h.description)}
                    </p>
                  ) : null}
                  <div className="mt-auto flex gap-2 pt-2">
                    <Button asChild className="flex-1">
                      <Link to={`/hospitals/${id}`}>View doctors &amp; book</Link>
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
