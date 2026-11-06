import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { BadgeCheck, MapPin, Star } from "lucide-react"
import {
  doctorDisplayName,
  doctorPhoto,
  useListDoctorsQuery,
} from "@/Redex/service/doctors/DoctorsApi"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export default function DoctorsPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get("q") || "")
  const { data: doctors = [], isLoading, isError, refetch } = useListDoctorsQuery({
    limit: 60,
    search: q || undefined,
  })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return doctors
    return doctors.filter((d) => {
      const hay = [
        doctorDisplayName(d),
        d.specialty,
        d.subSpecialty,
        d.clinicName,
        d.city,
        d.country,
      ]
        .filter(Boolean)
        .join(" ")
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
            Verified clinicians on Daryeel — open a profile to see specialty
            (takhassus), bio, and book a visit.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctors, specialty, city…"
              className="h-10 min-w-[220px] flex-1 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <Button asChild className="shrink-0">
              <Link to="/doctors/apply">Apply as doctor</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/SignUp">Create account</Link>
            </Button>
          </div>
          {!isLoading ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {filtered.length} clinicians
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

        {!isLoading && !isError && filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">No doctors match your search.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/doctors/apply">Apply as a doctor</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((d) => (
            <Link
              key={d.id}
              to={`/doctors/${d.id}`}
              className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-brand-light">
                {doctorPhoto(d) ? (
                  <img
                    src={doctorPhoto(d)}
                    alt={doctorDisplayName(d)}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-primary/40">
                    {doctorDisplayName(d).slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-base font-bold text-brand-dark">
                    {doctorDisplayName(d)}
                  </h2>
                  {d.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </div>
                <p className="text-sm font-medium text-primary">
                  {d.specialty}
                  {d.subSpecialty ? ` · ${d.subSpecialty}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {(d.city || d.country) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[d.city, d.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {d.rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {String(d.rating)}
                    </span>
                  ) : null}
                  <span>
                    {Number(d.consultationFee || 0) <= 0
                      ? "Free"
                      : `$${Number(d.consultationFee).toFixed(0)}`}
                  </span>
                </div>
                <p className="pt-1 text-xs font-semibold text-brand-dark group-hover:text-primary">
                  View profile & book →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
