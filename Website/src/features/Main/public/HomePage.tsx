import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Building2,
  CalendarCheck2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  Star,
} from "lucide-react"
import { HeroCarousel } from "@/components/home/HeroCarousel"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { RootState } from "@/Redex/store/store"
import {
  doctorDisplayName,
  doctorPhoto,
  useListDoctorsQuery,
} from "@/Redex/service/doctors/DoctorsApi"
import {
  hospitalDoctorsCount,
  hospitalIdOf,
  hospitalLogoOf,
  hospitalNameOf,
  hospitalRatingOf,
  useGetHospitalsQuery,
} from "@/Redex/service/healthcare/HealthcareApi"

const SERVICES = [
  {
    title: "Hospital visits",
    description:
      "Browse partner hospitals, open a facility, and book with its doctors.",
    icon: Building2,
  },
  {
    title: "Doctor bookings",
    description:
      "Find independent Daryeel doctors by specialty and book a visit.",
    icon: Stethoscope,
  },
  {
    title: "Visit tracking",
    description:
      "Confirmations, tickets, and visit status stay in your dashboard.",
    icon: ClipboardList,
  },
]

const STEPS = [
  {
    step: "01",
    title: "Search",
    description: "Pick Hospitals or Doctors from the home page.",
    icon: Search,
  },
  {
    step: "02",
    title: "View",
    description: "Open a hospital or doctor profile and check availability.",
    icon: Building2,
  },
  {
    step: "03",
    title: "Book",
    description: "Request a time. Manage the booking in your dashboard.",
    icon: CalendarCheck2,
  },
]

export default function HomePage() {
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const { data: hospitals = [], isLoading: hospitalsLoading } =
    useGetHospitalsQuery({ limit: 6 })
  const { data: doctors = [], isLoading: doctorsLoading } = useListDoctorsQuery({
    limit: 8,
  })

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace("#", "")
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [location.hash])

  /** Browse is always public — login only when booking. */
  const hospitalsHref = "/hospitals"
  const doctorsHref = "/doctors"
  const bookHospitalHref = signedIn
    ? "/dashboard?section=book"
    : "/healthcare/book"

  return (
    <div className="bg-brand-bg">
      <HeroCarousel hospitalsHref={hospitalsHref} doctorsHref={doctorsHref} />

      {/* Hospitals preview */}
      <section id="hospitals" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Hospitals
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                Partner hospitals
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open a hospital → view its doctors → book a time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={hospitalsHref}>View all hospitals</Link>
              </Button>
              <Button asChild>
                <Link to={bookHospitalHref}>Book hospital visit</Link>
              </Button>
            </div>
          </div>

          {hospitalsLoading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.slice(0, 6).map((h) => {
                const id = hospitalIdOf(h)
                const name = hospitalNameOf(h)
                const logo = hospitalLogoOf(h)
                const rating = hospitalRatingOf(h)
                const place = [h.city, h.country].filter(Boolean).join(", ")
                const bookHref = signedIn
                  ? `/dashboard?section=book&hospitalId=${encodeURIComponent(id)}`
                  : `/healthcare/book?hospitalId=${encodeURIComponent(id)}`
                return (
                  <article
                    key={id || name}
                    className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 border-b border-blue-50 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-light">
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-base font-bold text-brand-dark">
                          {name}
                        </h3>
                        {place ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {place}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <p className="text-xs text-muted-foreground">
                        {hospitalDoctorsCount(h)} doctors
                        {rating != null && !Number.isNaN(rating)
                          ? ` · ${rating.toFixed(1)} rating`
                          : ""}
                      </p>
                      <div className="mt-auto flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                          <Link to={`/hospitals/${id}`}>View</Link>
                        </Button>
                        <Button asChild className="flex-1">
                          <Link to={bookHref}>Book</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {!hospitalsLoading && hospitals.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No hospitals available yet. Check again soon.
            </p>
          ) : null}
        </div>
      </section>

      {/* Doctors preview */}
      <section
        id="doctors"
        className="scroll-mt-20 border-y border-blue-100 bg-white py-16 sm:py-20"
      >
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Doctors
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                Daryeel doctors
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Independent clinicians on Daryeel — view a profile and book a
                visit.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={doctorsHref}>View all doctors</Link>
            </Button>
          </div>

          {doctorsLoading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-brand-bg" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 8).map((d) => {
                const bookHref = signedIn
                  ? `/dashboard?section=healthcare&tab=daryeel&doctorId=${encodeURIComponent(d.id)}`
                  : `/doctors/${d.id}`
                return (
                  <div
                    key={d.id}
                    className="overflow-hidden rounded-3xl border border-blue-100 bg-brand-bg/40 shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-brand-light">
                      {doctorPhoto(d) ? (
                        <img
                          src={doctorPhoto(d)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-bold text-primary/30">
                          {doctorDisplayName(d).slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="font-heading font-bold text-brand-dark">
                          {doctorDisplayName(d)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {d.specialty}
                        </p>
                        {typeof (d as unknown as { averageRating?: number })
                          .averageRating === "number" ? (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {(
                              d as unknown as { averageRating: number }
                            ).averageRating.toFixed(1)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Link to={`/doctors/${d.id}`}>View</Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1">
                          <Link to={bookHref}>Book</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!doctorsLoading && doctors.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No doctors listed yet. Check again soon.
            </p>
          ) : null}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Services
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              Care you can book online
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hospital visits, doctor appointments, and visit tracking in one
              place.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="space-y-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-primary">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-dark">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-blue-100 bg-white py-16 sm:py-20"
      >
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              Search, view, then book
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three steps from discovery to a confirmed visit.
            </p>
          </div>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.step} className="space-y-3">
                <p className="font-heading text-sm font-semibold tracking-[0.18em] text-primary">
                  {item.step}
                </p>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-dark">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-dark to-primary px-6 py-12 text-white sm:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-blue-100 uppercase">
                  Contact
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
                  Need help booking?
                </h2>
                <p className="mt-3 max-w-xl text-blue-50/90">
                  Reach the Daryeel team for hospital or doctor booking support.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-blue-50"
                  >
                    <Link to={hospitalsHref}>Hospitals</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to={doctorsHref}>Doctors</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 text-sm text-blue-50/95">
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 transition hover:bg-white/15"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{siteConfig.supportEmail}</span>
                </a>
                <a
                  href={`tel:${siteConfig.supportPhone}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 transition hover:bg-white/15"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{siteConfig.supportPhone}</span>
                </a>
                <p className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Hargeisa · Somaliland</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
