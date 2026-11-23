import { useEffect, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  Quote,
  Search,
  Stethoscope,
  Star,
  Users,
} from "lucide-react"
import { HeroCarousel } from "@/components/home/HeroCarousel"
import { ImageCard } from "@/components/marketing/PageHero"
import { Button } from "@/components/ui/button"
import {
  defaultsForSlug,
  listItemPath,
  parseCmsListBody,
  type CmsListItem,
  type ListPageSlug,
} from "@/config/cmsListDefaults"
import { marketingImages } from "@/config/marketingImages"
import { siteConfig } from "@/config/site"
import {
  useGetPublicCmsPageQuery,
  useGetPublicTeamQuery,
  type TeamMember,
} from "@/Redex/service/cms/CmsApi"
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

const EXPLORE = [
  {
    title: "About",
    text: "Story, mission, vision, values — and our team below the page.",
    href: "/about",
    image: marketingImages.careHero,
    icon: Users,
  },
  {
    title: "Care",
    text: "Hospital visits, doctor bookings, and visit tracking in one path.",
    href: "/care",
    image: marketingImages.careHospital,
    icon: HeartPulse,
  },
  {
    title: "Training",
    text: "Practical digital health programmes for clinicians and partners.",
    href: "/training",
    image: marketingImages.trainingClassroom,
    icon: GraduationCap,
  },
  {
    title: "Events",
    text: "Workshops, open days, and partner sessions — in person or online.",
    href: "/events",
    image: marketingImages.eventsAudience,
    icon: CalendarCheck2,
  },
  {
    title: "Insights",
    text: "Guides and stories on digital health, privacy, and connected care.",
    href: "/insights",
    image: marketingImages.insightsHealth,
    icon: Newspaper,
  },
]

const TESTIMONIALS = [
  {
    quote:
      "Booking a hospital visit for my family is clearer now — we see doctors and times in one place.",
    name: "Amina Yusuf",
    role: "Patient · Hargeisa",
  },
  {
    quote:
      "Our clinic onboarded to Daryeel and the roster and booking flow finally matches how we work.",
    name: "Dr. Hassan Ali",
    role: "Clinician · Partner hospital",
  },
  {
    quote:
      "Training helped our team use digital records with confidence and protect patient privacy.",
    name: "Sahra Mohamed",
    role: "Hospital operations",
  },
  {
    quote:
      "Emergency cards and family profiles give us peace of mind when minutes matter.",
    name: "Abdiqani Farah",
    role: "Parent · Gabiley",
  },
]

const TEAM_PREVIEW_LIMIT = 6
const LIST_PREVIEW_LIMIT = 5

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function useCmsListPreview(kind: ListPageSlug) {
  const { data: cms, isLoading } = useGetPublicCmsPageQuery(kind)
  const items = useMemo(() => {
    const parsed = parseCmsListBody(cms?.body)
    const source =
      parsed.items?.length ? parsed.items : defaultsForSlug(kind).items || []
    return source.slice(0, LIST_PREVIEW_LIMIT)
  }, [cms?.body, kind])
  return { items, isLoading, title: cms?.title }
}

function HomeTeamCard({ member }: { member: TeamMember }) {
  return (
    <Link
      to="/about#team"
      className="group flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-light">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary to-brand-dark text-3xl font-bold text-white">
            {initials(member.fullName)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/55 via-transparent to-transparent" />
        <span className="absolute bottom-2 right-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-primary opacity-0 shadow-sm transition group-hover:opacity-100">
          View
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-heading text-sm font-bold text-brand-dark sm:text-base">
          {member.fullName}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-primary sm:text-sm">
          {member.title}
        </p>
        {member.department ? (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {member.department}
          </p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          View profile <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

function HomeListPreview({
  kind,
  eyebrow,
  title,
  subtitle,
  viewAllLabel,
  items,
  loading,
}: {
  kind: ListPageSlug
  eyebrow: string
  title: string
  subtitle: string
  viewAllLabel: string
  items: CmsListItem[]
  loading: boolean
}) {
  return (
    <section id={kind} className="scroll-mt-20 py-10 sm:py-14">
      <div className="container-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/${kind}`}>{viewAllLabel}</Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Nothing published yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {items.map((item, index) => (
              <ImageCard
                key={item.slug || item.title}
                image={item.image || marketingImages.trainingClassroom}
                title={item.title}
                meta={item.tag || item.meta}
                description={
                  item.description
                    ? item.description.length > 110
                      ? `${item.description.slice(0, 110)}…`
                      : item.description
                    : undefined
                }
                href={listItemPath(kind, item, index)}
                footer={
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function HomePage() {
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const { data: hospitals = [], isLoading: hospitalsLoading } =
    useGetHospitalsQuery({ limit: 6 })
  const { data: doctors = [], isLoading: doctorsLoading } = useListDoctorsQuery({
    limit: 8,
  })
  const { data: team, isLoading: teamLoading } = useGetPublicTeamQuery()
  const training = useCmsListPreview("training")
  const events = useCmsListPreview("events")
  const insights = useCmsListPreview("insights")

  const boardMembers = useMemo(
    () => (team?.groups?.BOARD || []).slice(0, TEAM_PREVIEW_LIMIT),
    [team]
  )
  const managementStaff = useMemo(() => {
    const groups = team?.groups
    if (!groups) return []
    return [
      ...(groups.EXECUTIVE || []),
      ...(groups.DEPARTMENT || []),
      ...(groups.STAFF || []),
    ].slice(0, TEAM_PREVIEW_LIMIT)
  }, [team])

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
    <div className="overflow-x-hidden bg-brand-bg">
      <HeroCarousel hospitalsHref={hospitalsHref} doctorsHref={doctorsHref} />

      {/* Hospitals — Explore-style cards (same as Doctors) */}
      <section id="hospitals" className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Hospitals
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                Partner hospitals
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Partner facilities you can view and book — same card style as
                Daryeel doctors.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={hospitalsHref}>View all</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={bookHospitalHref}>Book</Link>
              </Button>
            </div>
          </div>

          {hospitalsLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No hospitals available yet.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {hospitals.slice(0, 5).map((h) => {
                const id = hospitalIdOf(h)
                const name = hospitalNameOf(h)
                const logo = hospitalLogoOf(h)
                const rating = hospitalRatingOf(h)
                const place = [h.city, h.country].filter(Boolean).join(", ")
                const doctorsCount = hospitalDoctorsCount(h)
                return (
                  <Link
                    key={id || name}
                    to={`/hospitals/${id}`}
                    className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-brand-light">
                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-brand-dark/10 text-3xl font-bold text-primary/40">
                          {name.slice(0, 1)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
                      <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-primary">
                        <Building2 className="h-4 w-4" />
                      </span>
                      {rating != null && !Number.isNaN(rating) ? (
                        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-heading text-base font-bold text-brand-dark">
                        {name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {place
                          ? `${place} · ${doctorsCount} doctors`
                          : `${doctorsCount} doctors`}{" "}
                        — view facility and book a visit.
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Doctors — Explore-style cards (like About) */}
      <section
        id="doctors"
        className="scroll-mt-20 border-y border-blue-100 bg-white py-10 sm:py-14"
      >
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Doctors
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                Daryeel doctors
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Independent clinicians you can view and book — same card style
                as Explore.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={doctorsHref}>View all</Link>
            </Button>
          </div>

          {doctorsLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl bg-brand-bg"
                />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No doctors listed yet.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {doctors.slice(0, 5).map((d) => {
                const photo = doctorPhoto(d)
                const name = doctorDisplayName(d)
                const rating = (d as unknown as { averageRating?: number })
                  .averageRating
                return (
                  <Link
                    key={d.id}
                    to={`/doctors/${d.id}`}
                    className="group overflow-hidden rounded-2xl border border-blue-100 bg-brand-bg/40 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-brand-light">
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-brand-dark/10 text-3xl font-bold text-primary/40">
                          {name.slice(0, 1)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
                      <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-primary">
                        <Stethoscope className="h-4 w-4" />
                      </span>
                      {typeof rating === "number" ? (
                        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-heading text-base font-bold text-brand-dark">
                        {name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {d.specialty || "Daryeel clinician"} — view profile and
                        book a visit.
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore — About, Care, Training, Events, Insights */}
      <section id="explore" className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Explore Daryeel
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              About, Care, Training, Events & Insights
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The same stories and programmes from our main pages — start here,
              then open the full view.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {EXPLORE.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="p-3.5">
                  <h3 className="font-heading text-base font-bold text-brand-dark">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 border-y border-blue-100 bg-white py-10 sm:py-14">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Services
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              Care you can book online
            </h2>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="space-y-2 rounded-2xl border border-blue-50 bg-brand-bg/40 p-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-primary">
                  <service.icon className="h-4 w-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-brand-dark">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              Search, view, then book
            </h2>
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
              >
                <p className="font-heading text-xs font-semibold tracking-[0.16em] text-primary">
                  {item.step}
                </p>
                <div className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-2 font-heading text-base font-bold text-brand-dark">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="scroll-mt-20 border-y border-blue-100 bg-white py-10 sm:py-14"
      >
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Testimonials
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              What people say about Daryeel
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Voices from patients, clinicians, and partners across Somaliland.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="flex flex-col rounded-2xl border border-blue-100 bg-brand-bg/50 p-4 shadow-sm"
              >
                <Quote className="h-5 w-5 text-primary/70" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-dark">
                  “{t.quote}”
                </p>
                <footer className="mt-4 border-t border-blue-100 pt-3">
                  <p className="font-heading text-sm font-bold text-brand-dark">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Team — Board + Management & Staff */}
      <section
        id="team"
        className="scroll-mt-20 border-y border-blue-100 bg-white py-10 sm:py-14"
      >
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                About · Team
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                Board of Directors & Management Staff
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Meet the people guiding Daryeel Health — tap View profile for
                the full About team.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/about#team">
                View all team <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {teamLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl bg-brand-bg"
                />
              ))}
            </div>
          ) : (
            <>
              {boardMembers.length ? (
                <div className="mt-10">
                  <h3 className="font-heading text-xl font-bold text-brand-dark">
                    Board of Directors
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Strategic guidance and oversight
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {boardMembers.map((m) => (
                      <HomeTeamCard key={m.id} member={m} />
                    ))}
                  </div>
                </div>
              ) : null}

              {managementStaff.length ? (
                <div className="mt-12">
                  <h3 className="font-heading text-xl font-bold text-brand-dark">
                    Management & Staff
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Leadership and the team keeping Daryeel running
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {managementStaff.map((m) => (
                      <HomeTeamCard key={m.id} member={m} />
                    ))}
                  </div>
                </div>
              ) : null}

              {!boardMembers.length && !managementStaff.length ? (
                <p className="mt-8 text-sm text-muted-foreground">
                  Team profiles will appear here once published in CMS.{" "}
                  <Link
                    to="/about#team"
                    className="font-semibold text-primary hover:underline"
                  >
                    Open About team
                  </Link>
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <HomeListPreview
        kind="training"
        eyebrow="Training"
        title={training.title || "Latest training programmes"}
        subtitle="Practical digital health programmes — open any card to view details."
        viewAllLabel="All training"
        items={training.items}
        loading={training.isLoading}
      />

      <div className="border-y border-blue-100 bg-white">
        <HomeListPreview
          kind="events"
          eyebrow="Events"
          title={events.title || "Upcoming & recent events"}
          subtitle="Workshops, open days, and partner sessions — view any event."
          viewAllLabel="All events"
          items={events.items}
          loading={events.isLoading}
        />
      </div>

      <HomeListPreview
        kind="insights"
        eyebrow="Insights"
        title={insights.title || "Latest insights"}
        subtitle="Guides and stories on digital health — read the full article."
        viewAllLabel="All insights"
        items={insights.items}
        loading={insights.isLoading}
      />

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-page">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-primary px-5 py-10 text-white sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-100 uppercase">
                  Contact
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
                  Need help booking?
                </h2>
                <p className="mt-2 max-w-xl text-sm text-blue-50/90">
                  Reach the Daryeel team for hospital or doctor booking support.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    asChild
                    className="bg-white text-primary hover:bg-blue-50"
                  >
                    <Link to={hospitalsHref}>Hospitals</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to={doctorsHref}>Doctors</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/contact">Contact page</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-blue-50/95">
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 transition hover:bg-white/15"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{siteConfig.supportEmail}</span>
                </a>
                <a
                  href={`tel:${siteConfig.supportPhone}`}
                  className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 transition hover:bg-white/15"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{siteConfig.supportPhone}</span>
                </a>
                <p className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{siteConfig.location}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
