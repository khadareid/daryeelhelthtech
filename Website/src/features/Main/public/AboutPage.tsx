import { Link } from "react-router-dom"
import {
  BookOpen,
  Eye,
  HeartHandshake,
  HeartPulse,
  Lightbulb,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { marketingImages } from "@/config/marketingImages"
import { siteConfig } from "@/config/site"
import {
  useGetPublicCmsPageQuery,
  useGetPublicTeamQuery,
  type TeamMember,
} from "@/Redex/service/cms/CmsApi"

type AboutExtra = {
  mission?: string
  vision?: string
  philosophy?: string
  quote?: string
  values?: { title: string; description: string }[]
  story?: string[]
}

const FALLBACK_STORY = [
  "Daryeel Health is a digital health platform connecting patients, providers, hospitals, labs, pharmacies, employers and government across Somaliland and East Africa.",
  "We help families manage health information in one place, discover hospitals and doctors, book visits, and stay connected to better care — with privacy and consent at the centre.",
  "Our team of clinicians, technologists, and community partners work every day to make healthcare simpler, safer, and more reachable.",
]

const FALLBACK_VISION =
  "A Somaliland and East Africa where every family can access trusted care through one connected digital health identity — continuous, secure, and human."

const FALLBACK_MISSION =
  "To connect patients and providers with practical digital tools for records, bookings, hospitals, and doctors — so care is easier to find, easier to manage, and easier to trust."

const FALLBACK_PHILOSOPHY =
  "Business first, technology second — design for real care workflows, then use technology to serve people with clarity and dignity."

const FALLBACK_VALUES = [
  {
    title: "Patient first",
    description: "Every feature starts with safer, clearer care for families.",
  },
  {
    title: "Access for all",
    description: "Hospitals and doctors should be discoverable across communities.",
  },
  {
    title: "Privacy & trust",
    description: "Consent, security, and responsible handling of health data.",
  },
  {
    title: "Excellence",
    description: "Reliable tools clinicians and patients will actually use.",
  },
  {
    title: "Partnership",
    description: "Growing a trusted network of facilities and professionals.",
  },
  {
    title: "Innovation",
    description: "Practical digital health that fits local workflows.",
  },
]

const VALUE_ICONS = [
  HeartPulse,
  Users,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Lightbulb,
]

const SECTION_ORDER = [
  "BOARD",
  "EXECUTIVE",
  "DEPARTMENT",
  "STAFF",
  "PARTNER",
  "SPONSOR",
  "VOLUNTEER",
] as const

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  BOARD: {
    title: "Board of Directors",
    subtitle: "Strategic guidance and oversight for Daryeel Health",
  },
  EXECUTIVE: {
    title: "Executive Leadership",
    subtitle: "Leaders guiding our mission and growth",
  },
  DEPARTMENT: {
    title: "Department Leadership",
    subtitle: "Professionals leading key departments",
  },
  STAFF: {
    title: "Dedicated Staff",
    subtitle: "The team that keeps Daryeel running every day",
  },
  PARTNER: {
    title: "Our Partners",
    subtitle: "Organizations strengthening connected care",
  },
  SPONSOR: {
    title: "Our Sponsors",
    subtitle: "Supporters making programmes possible",
  },
  VOLUNTEER: {
    title: "Volunteers",
    subtitle: "People who give time and talent to serve",
  },
}

function parseExtra(body: unknown): AboutExtra {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as AboutExtra
  }
  return {}
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="flex flex-col rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/15"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-dark text-lg font-bold text-white">
            {initials(member.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-heading text-base font-bold text-brand-dark">
            {member.fullName}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-primary">
            {member.title}
          </p>
          {member.department ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-brand-muted">
              {member.department}
            </p>
          ) : null}
        </div>
      </div>
      {member.bio ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {member.bio}
        </p>
      ) : null}
      <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted-foreground">
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center gap-2 hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{member.email}</span>
          </a>
        ) : null}
        {member.phone ? (
          <a
            href={`tel:${member.phone}`}
            className="flex items-center gap-2 hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            {member.phone}
          </a>
        ) : null}
      </div>
    </article>
  )
}

export default function AboutPage() {
  const { data: aboutPage } = useGetPublicCmsPageQuery("about")
  const { data: teamPage } = useGetPublicCmsPageQuery("management-staff")
  const { data: team, isLoading: teamLoading } = useGetPublicTeamQuery()

  const extra = parseExtra(aboutPage?.body)
  const story =
    extra.story?.length
      ? extra.story
      : aboutPage?.summary
        ? [aboutPage.summary, ...FALLBACK_STORY.slice(1)]
        : FALLBACK_STORY
  const vision = extra.vision || FALLBACK_VISION
  const mission = extra.mission || FALLBACK_MISSION
  const philosophy = extra.philosophy || FALLBACK_PHILOSOPHY
  const values =
    extra.values?.length ? extra.values : FALLBACK_VALUES
  const quote =
    extra.quote ||
    (aboutPage?.quote &&
    typeof aboutPage.quote === "object" &&
    "text" in aboutPage.quote
      ? String((aboutPage.quote as { text: string }).text)
      : siteConfig.tagline)

  const heroImage =
    aboutPage?.heroImageUrl || marketingImages.careHero

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      {/* Hero — Gabiley-style About Us */}
      <section className="relative overflow-hidden text-white">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/92 via-primary/85 to-brand-dark/90" />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            {siteConfig.appName}
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {aboutPage?.title || "About Us"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {aboutPage?.subtitle ||
              "Discover the story, mission, and people behind Daryeel Health"}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <a href="#team">Meet our team</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container-page py-12 sm:py-16">
        {/* Story block */}
        <section className="grid items-center gap-8 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Our story
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              {siteConfig.appName}
            </h2>
            <p className="mt-2 text-sm font-medium text-primary">
              {siteConfig.tagline} · {siteConfig.location}
            </p>
            <div className="mt-5 space-y-4">
              {story.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className="relative min-h-[240px] lg:min-h-full">
            <img
              src={marketingImages.careDoctor}
              alt="Daryeel Health care"
              className="h-full w-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </section>

        {/* Philosophy quote */}
        <section className="mt-10 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-dark">
                Our Philosophy
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {philosophy}
              </p>
              <p className="mt-4 font-heading text-base font-semibold italic text-primary sm:text-lg">
                “{quote}”
              </p>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
            Vision & Mission
          </h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold text-brand-dark">
                Our Vision
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {vision}
              </p>
            </article>
            <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold text-brand-dark">
                Our Mission
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {mission}
              </p>
            </article>
          </div>
        </section>

        {/* Core values */}
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
            Our Core Values
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The principles that guide everything we build and every partnership
            we grow.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length]
              return (
                <article
                  key={v.title}
                  className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-heading text-base font-bold text-brand-dark">
                    {v.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Team — below About, Gabiley-style */}
        <section id="team" className="scroll-mt-24 mt-16 border-t border-blue-100 pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Management & Staff
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-brand-dark sm:text-4xl">
            {teamPage?.title || "Our Dedicated Team"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {teamPage?.summary ||
              teamPage?.subtitle ||
              "Passionate professionals committed to connected healthcare across Somaliland and East Africa."}
          </p>

          {teamLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-3xl bg-white"
                />
              ))}
            </div>
          ) : null}

          {!teamLoading && team
            ? SECTION_ORDER.map((key) => {
                const members = team.groups?.[key]
                if (!members?.length) return null
                const meta = SECTION_META[key]
                return (
                  <div key={key} className="mt-12">
                    <h3 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
                      {meta.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meta.subtitle}
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((m) => (
                        <TeamMemberCard key={m.id} member={m} />
                      ))}
                    </div>
                  </div>
                )
              })
            : null}

          {!teamLoading && !team?.members?.length ? (
            <p className="mt-8 text-sm text-muted-foreground">
              Team profiles will appear here once published in CMS.
            </p>
          ) : null}
        </section>

        {/* CTA */}
        <section className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-brand-dark p-6 text-white sm:p-10">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Become part of connected care
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Whether you are a patient, hospital, doctor, or partner — we welcome
            you to {siteConfig.appName}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/care">Explore Care</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/contact">Get in touch</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <a href="#team">View team again</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
