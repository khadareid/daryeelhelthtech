import { Link } from "react-router-dom"
import {
  Award,
  BadgeCheck,
  Building2,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  HeartPulse,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import {
  useGetPublicCmsPageQuery,
  useGetPublicTeamQuery,
  type TeamMember,
} from "@/Redex/service/cms/CmsApi"

type Highlight = { title: string; description?: string }
type StatItem = { label: string; value: string }
type ValueItem = { title: string; description: string }
type PageExtra = {
  stats?: StatItem[]
  values?: ValueItem[]
  eyebrow?: string
}

const FALLBACK_HIGHLIGHTS: Highlight[] = [
  {
    title: "Qualified Professionals",
    description: "Experienced clinicians and digital health experts",
  },
  {
    title: "Committed to Service",
    description: "Patient-first care across Somaliland & East Africa",
  },
  {
    title: "Excellence in Action",
    description: "Secure, connected healthcare technology",
  },
]

const FALLBACK_STATS: StatItem[] = [
  { label: "Board Members", value: "6" },
  { label: "Executive Team", value: "4" },
  { label: "Staff Members", value: "16+" },
  { label: "Partners", value: "6+" },
  { label: "Volunteers", value: "20+" },
  { label: "Patients Reached", value: "5,000+" },
]

const FALLBACK_VALUES: ValueItem[] = [
  {
    title: "Commitment",
    description: "Dedicated to serving our community with excellence",
  },
  {
    title: "Transparency",
    description: "Open and honest in all our operations",
  },
  {
    title: "Accountability",
    description: "Taking responsibility for our actions",
  },
  {
    title: "Teamwork",
    description: "Collaborating to achieve shared goals",
  },
]

const SECTION_META: Record<
  string,
  { eyebrow: string; title: string; subtitle: string }
> = {
  BOARD: {
    eyebrow: "Governance",
    title: "Board of Directors",
    subtitle: "Visionary leaders providing strategic guidance and oversight",
  },
  EXECUTIVE: {
    eyebrow: "Leadership",
    title: "Executive Management",
    subtitle: "Meet the visionary leaders guiding Daryeel Health’s mission and growth",
  },
  DEPARTMENT: {
    eyebrow: "Department Heads",
    title: "Department Leadership",
    subtitle: "Experienced professionals leading our key departments",
  },
  STAFF: {
    eyebrow: "Our Team",
    title: "Dedicated Staff Members",
    subtitle: "Meet the hardworking team that makes Daryeel Health run every day",
  },
  PARTNER: {
    eyebrow: "Collaboration",
    title: "Our Partners",
    subtitle:
      "Working together to strengthen our community through better healthcare access",
  },
  SPONSOR: {
    eyebrow: "Supporters",
    title: "Our Sponsors",
    subtitle: "Generous supporters making our programs and services possible",
  },
  VOLUNTEER: {
    eyebrow: "Volunteers",
    title: "Our Dedicated Volunteers",
    subtitle:
      "Amazing individuals who give their time and talent to serve our community",
  },
}

const SECTION_ORDER = [
  "BOARD",
  "EXECUTIVE",
  "DEPARTMENT",
  "STAFF",
  "PARTNER",
  "SPONSOR",
  "VOLUNTEER",
] as const

const HIGHLIGHT_ICONS = [BadgeCheck, HeartHandshake, Award]

function parseExtra(body: unknown): PageExtra {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as PageExtra
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

function partnerIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("univers") || n.includes("education")) return GraduationCap
  if (n.includes("ministr") || n.includes("municipal") || n.includes("government"))
    return Building2
  if (n.includes("international") || n.includes("region") || n.includes("undp"))
    return Globe2
  return Handshake
}

function MemberCard({
  member,
  variant = "default",
}: {
  member: TeamMember
  variant?: "default" | "compact" | "partner" | "sponsor" | "volunteer"
}) {
  const isPartner = variant === "partner" || variant === "sponsor"
  const PartnerIcon = partnerIcon(member.fullName)

  return (
    <article
      className={
        variant === "default"
          ? "flex flex-col rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
          : "flex flex-col rounded-2xl border border-blue-50 bg-white p-4 shadow-sm sm:p-5"
      }
    >
      <div className="flex items-start gap-4">
        {isPartner ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-2xl ring-1 ring-blue-100 sm:h-16 sm:w-16">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt=""
                className="h-8 w-8 object-contain"
              />
            ) : (
              <PartnerIcon className="h-7 w-7 text-primary" />
            )}
          </div>
        ) : member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/15 sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-dark text-lg font-bold text-white shadow-md shadow-primary/25 sm:h-20 sm:w-20 sm:text-xl">
            {initials(member.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {variant === "sponsor" && member.department ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {member.department}
            </p>
          ) : null}
          <h3 className="font-heading text-base font-bold text-brand-dark sm:text-lg">
            {member.fullName}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-primary">
            {member.title}
          </p>
          {member.department && variant !== "sponsor" ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-muted">
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

      {member.expertise?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.expertise.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand-dark ring-1 ring-blue-100"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted-foreground">
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center gap-2 transition hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{member.email}</span>
          </a>
        ) : null}
        {member.phone ? (
          <a
            href={`tel:${member.phone}`}
            className="flex items-center gap-2 transition hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
            {member.phone}
          </a>
        ) : null}
        {variant === "volunteer" && member.yearsExperience != null ? (
          <p className="pt-1 font-semibold text-primary">
            {member.yearsExperience}+ hours volunteered
          </p>
        ) : member.education || member.yearsExperience != null ? (
          <p className="pt-1 text-[11px] font-medium text-brand-dark/70">
            {[
              member.education,
              member.yearsExperience != null
                ? `${member.yearsExperience}+ years`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {variant === "partner" ? (
          <span className="inline-flex pt-1 text-xs font-semibold text-primary">
            Learn More →
          </span>
        ) : null}
        {variant === "sponsor" ? (
          <span className="inline-flex pt-1 text-xs font-semibold text-brand-dark">
            Thank You
          </span>
        ) : null}
      </div>
    </article>
  )
}

function Section({
  category,
  members,
}: {
  category: (typeof SECTION_ORDER)[number]
  members: TeamMember[]
}) {
  const meta = SECTION_META[category]
  const featured = category === "BOARD" || category === "EXECUTIVE"
  const variant =
    category === "PARTNER"
      ? "partner"
      : category === "SPONSOR"
        ? "sponsor"
        : category === "VOLUNTEER"
          ? "volunteer"
          : category === "STAFF" || category === "DEPARTMENT"
            ? "compact"
            : "default"

  const grid =
    category === "STAFF" || category === "VOLUNTEER"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      : category === "PARTNER" || category === "SPONSOR"
        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        : featured
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"

  return (
    <section className="mt-14 sm:mt-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {meta.eyebrow}
      </p>
      <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
        {meta.title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        {meta.subtitle}
      </p>
      <div className={`mt-6 ${grid}`}>
        {members.map((m) => (
          <MemberCard key={m.id} member={m} variant={variant} />
        ))}
      </div>
      {category === "VOLUNTEER" ? (
        <div className="mt-6">
          <Button asChild>
            <Link to="/contact">Become a Volunteer</Link>
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export default function ManagementStaffPage() {
  const { data: page, isLoading: pageLoading } =
    useGetPublicCmsPageQuery("management-staff")
  const {
    data: team,
    isLoading: teamLoading,
    isError,
    refetch,
  } = useGetPublicTeamQuery()

  const loading = pageLoading || teamLoading
  const extra = parseExtra(page?.body)
  const highlights =
    page?.highlights && Array.isArray(page.highlights) && page.highlights.length
      ? page.highlights
      : FALLBACK_HIGHLIGHTS
  const stats =
    extra.stats && extra.stats.length ? extra.stats : FALLBACK_STATS
  const values =
    extra.values && extra.values.length ? extra.values : FALLBACK_VALUES

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#146AFB] to-brand-dark text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="container-page relative py-12 sm:py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/95 ring-1 ring-white/25">
            <HeartPulse className="h-3.5 w-3.5" />
            {siteConfig.appName}
          </div>
          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {page?.title || "Management & Staff"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {page?.subtitle ||
              "Meet the dedicated team, board members, partners, and supporters behind Daryeel Health"}
          </p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">
        {/* Intro — Meet Our Leadership & Team */}
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {extra.eyebrow || "Our People"}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-brand-dark sm:text-4xl">
            Meet Our Leadership & Team
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {page?.summary ||
              "Our dedicated team consists of qualified healthcare leaders, administrators, board members, partners, and volunteers committed to serving the community with professionalism, integrity, and passion."}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item, i) => {
              const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-blue-50 bg-brand-light/70 p-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-heading text-sm font-bold text-brand-dark sm:text-base">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-6 grid grid-cols-2 gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-6 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-brand-light/60 px-3 py-4 text-center">
              <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : null}

        {isError && !loading ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load live team data. Showing page content where
              available.
            </p>
            <Button className="mt-3" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!loading && team
          ? SECTION_ORDER.map((key) => {
              const members = team.groups?.[key]
              if (!members?.length) return null
              return (
                <Section key={key} category={key} members={members} />
              )
            })
          : null}

        {/* Values */}
        <section className="mt-14 sm:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Our Values
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
            What Drives Our Team
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Core values that guide our work and service to the community
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-heading text-base font-bold text-brand-dark">
                  {v.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        {page?.quote &&
        typeof page.quote === "object" &&
        "text" in page.quote ? (
          <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-brand-dark p-6 text-white shadow-lg shadow-primary/20 sm:p-10">
            <blockquote className="max-w-3xl font-heading text-lg font-semibold leading-relaxed sm:text-2xl">
              “{(page.quote as { text: string }).text}”
            </blockquote>
            {(page.quote as { author?: string }).author ? (
              <p className="mt-4 text-sm text-white/85">
                — {(page.quote as { author?: string }).author}
                {(page.quote as { role?: string }).role
                  ? `, ${(page.quote as { role?: string }).role}`
                  : ""}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* CTA */}
        <section className="mt-10 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-2xl font-bold text-brand-dark">
                {(page?.cta as { title?: string } | null)?.title ||
                  "Want to Work or Volunteer With Us?"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {(page?.cta as { description?: string } | null)?.description ||
                  "We're always looking for passionate individuals to join our team as staff, volunteers, or partners."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link
                    to={
                      (page?.cta as { primaryHref?: string } | null)
                        ?.primaryHref || "/contact"
                    }
                  >
                    {(page?.cta as { primaryLabel?: string } | null)
                      ?.primaryLabel || "Contact Us"}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-primary/20">
                  <Link
                    to={
                      (page?.cta as { secondaryHref?: string } | null)
                        ?.secondaryHref || "/doctors/apply"
                    }
                  >
                    {(page?.cta as { secondaryLabel?: string } | null)
                      ?.secondaryLabel || "Apply as Doctor"}
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/care">Explore Care</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
