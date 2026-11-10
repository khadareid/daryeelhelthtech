import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
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

export function HospitalsSection() {
  const location = useLocation()
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("")

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q")
    if (q) setSearch(q)
  }, [location.search])

  const queryArgs = useMemo(
    () => ({
      search: search.trim() || undefined,
      city: city.trim() || undefined,
      limit: 48,
    }),
    [search, city]
  )

  const { data: hospitals = [], isLoading, isError, refetch } =
    useGetHospitalsQuery(queryArgs)

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Partner hospitals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hospitals from Daryeel SaaS — choose a hospital, then book one of its
          doctors. Daryeel&apos;s own doctor directory is separate under Doctors.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/dashboard?section=book">Book hospital visit</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/20">
            <Link to="/dashboard?section=healthcare&tab=hospitals">
              My hospital bookings
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/20">
            <Link to="/dashboard?section=doctors">Daryeel doctors</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-3xl border border-blue-50 bg-white"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
          <p className="text-sm text-rose-700">Could not load hospitals.</p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && hospitals.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-center text-sm text-muted-foreground">
          No hospitals match your search.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
              className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-blue-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-light">
                  {logo ? (
                    <img src={logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-base font-bold text-brand-dark">
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

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
                <div className="mt-auto flex gap-2">
                  <Button asChild className="flex-1">
                    <Link
                      to={`/dashboard?section=book&hospitalId=${encodeURIComponent(id)}`}
                    >
                      Book doctors
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
