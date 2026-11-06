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
  Pill,
  ShieldCheck,
  Star,
  Stethoscope,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { RootState } from "@/Redex/store/store"
import {
  doctorDisplayName,
  doctorPhoto,
  useListDoctorsQuery,
} from "@/Redex/service/doctors/DoctorsApi"

const SERVICES = [
  {
    icon: Stethoscope,
    title: "Find doctors",
    desc: "Browse verified clinicians and book visits in minutes.",
  },
  {
    icon: HeartPulse,
    title: "Health records",
    desc: "Allergies, meds, vitals, labs, and prescriptions in one place.",
  },
  {
    icon: FlaskConical,
    title: "Daily wellness",
    desc: "Log mood, sleep, steps, and water from your dashboard.",
  },
  {
    icon: Pill,
    title: "Medications",
    desc: "Track what you take and keep prescriptions handy.",
  },
  {
    icon: Baby,
    title: "Family care",
    desc: "Add family members and manage care for dependents.",
  },
  {
    icon: ShieldCheck,
    title: "Emergency card",
    desc: "Critical allergies and contacts ready when it matters.",
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
    desc: "Pick a doctor and a time that works for your family.",
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
    role: "Member",
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
    text: "Having my emergency card and allergies ready gave me peace of mind.",
  },
]

export default function HomePage() {
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const { data: doctors = [], isLoading: careLoading } = useListDoctorsQuery({
    limit: 8,
  })

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace("#", "")
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [location.hash])

  return (
    <div className="bg-brand-bg">
      <section className="relative min-h-[78vh] overflow-hidden text-white">
        <img
          src="/images/hero-care.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/92 via-brand-dark/75 to-primary/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,106,251,0.35),transparent_45%)]" />

        <div className="container-page relative flex min-h-[78vh] flex-col justify-center py-16 sm:py-20">
          <p className="font-heading text-sm font-semibold tracking-[0.22em] text-blue-100 uppercase">
            {siteConfig.appName}
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Better care, closer to home.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-blue-50/90 sm:text-lg">
            Book visits, meet trusted clinicians, and keep your health record in
            one simple place — built for families across Somaliland.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 bg-white px-6 text-primary hover:bg-blue-50"
            >
              <Link to={signedIn ? "/dashboard" : "/SignUp"}>
                {signedIn ? "Open dashboard" : "Create free account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/doctors">Meet the care team</Link>
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
              Care for every stage of life
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first check-ups to daily health tracking — one clear platform.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
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

      <section id="doctors" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Care team
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                Doctors on Daryeel
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/doctors">View all</Link>
            </Button>
          </div>

          {careLoading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 4).map((d) => (
                <Link
                  key={d.id}
                  to={`/doctors/${d.id}`}
                  className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:border-primary/30"
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
                  <div className="p-4">
                    <p className="font-heading font-bold text-brand-dark">
                      {doctorDisplayName(d)}
                    </p>
                    <p className="text-sm text-muted-foreground">{d.specialty}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Stories
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark">
              Families trust Daryeel
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STORIES.map((s) => (
              <blockquote
                key={s.name}
                className="rounded-3xl border border-blue-100 bg-brand-bg/60 p-6"
              >
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-4 text-sm leading-relaxed text-brand-dark">
                  “{s.text}”
                </p>
                <footer className="mt-4 text-sm font-semibold text-brand-dark">
                  {s.name}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {s.role}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 py-20">
        <div className="container-page">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-dark to-primary px-6 py-12 text-white sm:px-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
                  Ready when you are
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
                  Start your health journey today
                </h2>
                <p className="mt-3 text-blue-50/90">
                  Create an account, book a doctor, and keep your records close.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-blue-50"
                >
                  <Link to={signedIn ? "/dashboard" : "/SignUp"}>
                    {signedIn ? "Go to dashboard" : "Get started"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={`tel:${siteConfig.supportPhone}`}>
                    <Activity className="mr-2 h-4 w-4" />
                    Call support
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
