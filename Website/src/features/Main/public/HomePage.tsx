import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Activity,
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Phone,
  Pill,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { RootState } from "@/Redex/store/store"
import {
  doctorName,
  doctorPhoto,
  hospitalCover,
  useGetPublicCareTeamQuery,
  useGetPublicHospitalsQuery,
} from "@/Redex/service/hospitals/HospitalsApi"
import { useGetPublicCmsQuery } from "@/Redex/service/admin/AdminApi"

const SERVICES = [
  {
    icon: Stethoscope,
    title: "General Medicine",
    desc: "Primary care, check-ups, and long-term condition support.",
  },
  {
    icon: Baby,
    title: "Maternity & Midwifery",
    desc: "Antenatal, delivery, and postnatal care with certified midwives.",
  },
  {
    icon: FlaskConical,
    title: "Laboratory",
    desc: "Clear diagnostics with quick turnaround for common tests.",
  },
  {
    icon: Pill,
    title: "Pharmacy",
    desc: "Prescriptions, refill reminders, and on-site medication support.",
  },
  {
    icon: Activity,
    title: "Health Tracking",
    desc: "Log mood, sleep, steps, and water from your personal dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Emergency Support",
    desc: "Reach the care line quickly when you need help right away.",
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    desc: "Sign up with your name, email, and password in under a minute.",
  },
  {
    icon: Calendar,
    title: "Book your visit",
    desc: "Pick the care you need and a time that works for your family.",
  },
  {
    icon: ClipboardList,
    title: "Track your health",
    desc: "Keep appointments, records, and daily logs in one place.",
  },
]

const STORIES = [
  {
    name: "Fadumo A.",
    role: "Patient",
    image: "/images/patient-fadumo.jpg",
    text: "Booking was simple, and I could see my results without waiting around.",
  },
  {
    name: "Ahmed M.",
    role: "Father of two",
    image: "/images/patient-ahmed.jpg",
    text: "The pediatric visits feel calm and clear. My children are more comfortable now.",
  },
  {
    name: "Khadra Y.",
    role: "New mother",
    image: "/images/patient-khadra.jpg",
    text: "The midwifery support stayed with me through every step of pregnancy.",
  },
]

export default function HomePage() {
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const { data: careTeam = [], isLoading: careLoading } =
    useGetPublicCareTeamQuery()
  const { data: hospitalsData, isLoading: hospitalsLoading } =
    useGetPublicHospitalsQuery({ page: 1, limit: 9 })
  const hospitals = hospitalsData?.data ?? []
  const { data: cmsRow } = useGetPublicCmsQuery("homepage")
  const cms = (cmsRow?.data || {}) as {
    brand?: string
    headline?: string
    subheadline?: string
    heroImageUrl?: string
    ctaPrimary?: { label?: string; href?: string }
    ctaSecondary?: { label?: string; href?: string }
    servicesTitle?: string
    services?: { title: string; desc: string }[]
  }

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace("#", "")
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [location.hash])

  const brand = cms.brand || siteConfig.appName
  const headline = cms.headline || "Better care, closer to home."
  const subheadline =
    cms.subheadline ||
    "Book visits, meet trusted clinicians, and keep your health record in one simple place — built for families across Somaliland."
  const heroSrc = cms.heroImageUrl || "/images/hero-care.jpg"
  const primaryCta = {
    label:
      cms.ctaPrimary?.label ||
      (signedIn ? "Open dashboard" : "Create free account"),
    href:
      cms.ctaPrimary?.href || (signedIn ? "/dashboard" : "/SignUp"),
  }
  const secondaryCta = {
    label: cms.ctaSecondary?.label || "Meet the care team",
    href: cms.ctaSecondary?.href || "/doctors",
  }
  const cmsServices = Array.isArray(cms.services) ? cms.services : []

  return (
    <div className="bg-brand-bg">
      {/* Hero — brand + one message + CTAs over a full-bleed photo */}
      <section className="relative min-h-[78vh] overflow-hidden text-white">
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/92 via-brand-dark/75 to-primary/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,106,251,0.35),transparent_45%)]" />

        <div className="container-page relative flex min-h-[78vh] flex-col justify-center py-16 sm:py-20">
          <p className="font-heading text-sm font-semibold tracking-[0.22em] text-blue-100 uppercase">
            {brand}
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-blue-50/90 sm:text-lg">
            {subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 bg-white px-6 text-primary hover:bg-blue-50"
            >
              <Link to={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white"
            >
              <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-50/90">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-200" />
              Free registration
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-200" />
              Secure records
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-200" />
              24/7 support line
            </span>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Services
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              {cms.servicesTitle || "Care for every stage of life"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first check-ups to maternity, labs, pharmacy, and daily health
              tracking — one clear platform.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {(cmsServices.length > 0
              ? cmsServices.map((s) => ({
                  icon: Stethoscope,
                  title: s.title,
                  desc: s.desc,
                }))
              : SERVICES
            ).map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-brand-dark">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-blue-100 bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              Three clear steps
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start today. No paperwork pile. No confusing clinic apps.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }, index) => (
              <div key={title} className="text-center md:text-left">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 md:mx-0">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-heading text-xl font-semibold text-brand-dark">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hospitals" className="scroll-mt-20 border-y border-blue-100 bg-white py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Hospitals
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                Facilities on Daryeel
              </h2>
              <p className="mt-3 text-muted-foreground">
                Live hospitals from the SaaS network — open a facility to see its
                clinicians.
              </p>
            </div>
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/hospitals">
                View all hospitals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hospitalsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))
              : hospitals.slice(0, 6).map((hospital) => (
                  <Link
                    key={hospital.tenantId}
                    to={`/hospitals/${hospital.tenantId}`}
                    className="group overflow-hidden rounded-3xl border border-blue-100 bg-brand-bg transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <img
                      src={hospitalCover(hospital)}
                      alt={hospital.companyName}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="space-y-1 p-4">
                      <h3 className="font-heading text-lg font-semibold text-brand-dark group-hover:text-primary">
                        {hospital.companyName}
                      </h3>
                      <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {[hospital.city, hospital.country]
                          .filter(Boolean)
                          .join(", ") || "Somaliland"}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        ★ {Number(hospital.rating || 0).toFixed(1)}
                        {typeof hospital._count?.professionalProfiles ===
                        "number"
                          ? ` · ${hospital._count.professionalProfiles} doctors`
                          : ""}
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      <section id="team" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Care team
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                Clinicians you can trust
              </h2>
              <p className="mt-3 text-muted-foreground">
                Real clinicians from Daryeel hospitals — specialty, hospital, and
                visit fees from the live API.
              </p>
            </div>
            <Button asChild variant="outline" className="border-primary/20">
              <Link to="/doctors">
                See all clinicians
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {careLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse rounded-3xl bg-brand-light"
                  />
                ))
              : careTeam.slice(0, 8).map((doctor) => (
                  <Link
                    key={doctor.professionalProfileId || doctor.doctorId}
                    to={`/doctors/${encodeURIComponent(
                      doctor.doctorId ||
                        doctor.user?.userId ||
                        doctor.professionalProfileId,
                    )}?hospital=${encodeURIComponent(doctor.hospitalId)}`}
                    className="group"
                  >
                    <article className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brand-light">
                      <img
                        src={doctorPhoto(doctor)}
                        alt={doctorName(doctor)}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/35 to-transparent p-4 pt-16 text-white">
                        <h3 className="font-heading text-base font-semibold">
                          {doctorName(doctor)}
                        </h3>
                        <p className="text-sm text-blue-100">
                          {doctor.specialization || "General Physician"}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-100/90">
                          <MapPin className="h-3 w-3" />
                          {doctor.city || "Somaliland"} · {doctor.hospitalName}
                        </p>
                        {doctor.consultationFee ? (
                          <p className="mt-1 text-xs text-amber-200">
                            {doctor.currency || "USD"} {doctor.consultationFee}
                            {doctor.yearsOfExperience
                              ? ` · ${doctor.yearsOfExperience}+ yrs`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </Link>
                ))}
          </div>

          {!careLoading && careTeam.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No public clinicians published yet. Browse{" "}
              <Link to="/hospitals" className="font-medium text-primary">
                hospitals
              </Link>{" "}
              to explore facilities.
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Patient stories
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              Families feel the difference
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sample stories that reflect the tone of care we aim for.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STORIES.map((story) => (
              <blockquote key={story.name} className="flex flex-col">
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="flex-1 text-base leading-relaxed text-brand-text">
                  “{story.text}”
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <img
                    src={story.image}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-light"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">
                      {story.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{story.role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-dark via-[#0d4cb8] to-primary px-6 py-12 text-white sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-wide text-blue-100 uppercase">
                  Ready when you are
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
                  Put your health first with {siteConfig.appName}
                </h2>
                <p className="mt-4 max-w-xl text-blue-50/90">
                  Create an account, open your dashboard, and keep appointments,
                  care notes, and daily health logs together.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 bg-white text-primary hover:bg-blue-50"
                  >
                    <Link to={signedIn ? "/dashboard" : "/SignUp"}>
                      {signedIn ? "Go to dashboard" : "Get started"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 border-white/40 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  >
                    <a href="tel:+25261000000">
                      <Phone className="mr-2 h-4 w-4" />
                      Call support
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 text-sm text-blue-50">
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-200" />
                  Gabiley & Hargeisa, Somaliland
                </p>
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-200" />
                  +252 61 000 000
                </p>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                >
                  <HeartPulse className="h-4 w-4 text-blue-200" />
                  {siteConfig.supportEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
