import { marketingImages } from "@/config/marketingImages"

/** Shared shape for Training / Events / Insights CMS body JSON */
export type CmsListStat = { value: string; label: string }
export type CmsListItem = {
  id?: string
  slug?: string
  title: string
  meta?: string
  description?: string
  /** Full article / programme body for the public read view */
  content?: string
  image?: string
  tag?: string
  points?: string[]
}

export type CmsListBody = {
  stats?: CmsListStat[]
  items?: CmsListItem[]
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function itemSlug(item: CmsListItem, index = 0): string {
  return item.slug || item.id || `${slugifyTitle(item.title || "item")}-${index}`
}

export function parseCmsListBody(body: unknown): CmsListBody {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {}
  const raw = body as CmsListBody
  const items = Array.isArray(raw.items)
    ? raw.items.map((item, i) => ({
        ...item,
        slug: itemSlug(item, i),
      }))
    : []
  return {
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    items,
  }
}

export function findListItem(
  body: unknown,
  slug: string
): CmsListItem | undefined {
  const { items } = parseCmsListBody(body)
  return items?.find(
    (item, i) => itemSlug(item, i) === slug || item.id === slug
  )
}

export const TRAINING_DEFAULTS: CmsListBody = {
  stats: [
    { value: "12+", label: "Programmes" },
    { value: "500+", label: "Learners trained" },
    { value: "40+", label: "Partner facilities" },
    { value: "4", label: "Core tracks" },
  ],
  items: [
    {
      slug: "clinical-digital-skills",
      title: "Clinical Digital Skills",
      meta: "2 weeks",
      tag: "Clinicians",
      description:
        "EHR basics, appointment & referral workflows, and patient privacy for clinicians.",
      content:
        "This programme equips clinicians with practical digital skills for everyday care. You will learn how to navigate electronic health records, manage appointments and referrals, document visits clearly, and apply privacy and consent principles that protect patients.\n\nSessions mix short lessons with hands-on labs using real Daryeel workflows. Graduates leave ready to use the platform confidently in clinics and hospitals.",
      image: marketingImages.trainingClassroom,
      points: ["Records", "Bookings", "Consent"],
    },
    {
      slug: "hospital-system-onboarding",
      title: "Hospital System Onboarding",
      meta: "1 week",
      tag: "Hospitals",
      description:
        "Partner hospital setup, doctor rosters, scheduling, and visit tracking.",
      content:
        "Designed for hospital administrators and operations teams joining the Daryeel network. Cover facility setup, doctor rosters, booking rules, visit confirmation, and payment status tracking.\n\nBy the end of the week, your team can run partner workflows end-to-end and support patients from request to completed visit.",
      image: marketingImages.trainingLaptop,
      points: ["Rosters", "Ops", "Payments"],
    },
    {
      slug: "community-health-facilitator",
      title: "Community Health Facilitator",
      meta: "3 days",
      tag: "Outreach",
      description:
        "Health education, family onboarding to Daryeel, and emergency awareness.",
      content:
        "A short, practical course for community volunteers and outreach workers. Learn how to introduce Daryeel to families, help them set up profiles, explain emergency cards, and guide people to nearby hospitals and doctors.\n\nFocus areas include clear communication, trust-building, and when to escalate to clinical care.",
      image: marketingImages.trainingTeam,
      points: ["Outreach", "Families", "Safety"],
    },
    {
      slug: "leadership-in-digital-health",
      title: "Leadership in Digital Health",
      meta: "4 days",
      tag: "Leadership",
      description:
        "Strategy, quality oversight, and growing a trusted care partner network.",
      content:
        "For managers and directors shaping digital health strategy. Explore quality oversight, partner network growth, workforce training plans, and how to measure adoption without losing the patient-first mission.\n\nWorkshops include peer discussion, case reviews, and a simple action plan for your facility.",
      image: marketingImages.trainingWorkshop,
      points: ["Strategy", "Quality", "Growth"],
    },
  ],
}

export const EVENTS_DEFAULTS: CmsListBody = {
  stats: [
    { value: "4", label: "Upcoming" },
    { value: "2", label: "Cities" },
    { value: "1", label: "Online" },
    { value: "Free", label: "Most sessions" },
  ],
  items: [
    {
      slug: "digital-health-open-day",
      title: "Digital Health Open Day",
      meta: "12 Dec 2026 · Hargeisa · Hybrid",
      tag: "Community",
      description:
        "Meet the Daryeel team, tour the platform, and learn how families book care and manage health records.",
      content:
        "Join us for a half-day open house in Hargeisa (also streamed online). Tour the patient and hospital experience, ask questions, and see how families book care, keep records, and stay connected to providers.\n\nWho should attend: patients, caregivers, hospital staff, and community partners. Registration is free.",
      image: marketingImages.eventsAudience,
    },
    {
      slug: "hospital-partner-workshop",
      title: "Hospital Partner Workshop",
      meta: "20 Dec 2026 · Online webinar",
      tag: "Providers",
      description:
        "Hands-on session for hospital admins on doctor rosters, bookings, and patient visit flows.",
      content:
        "A live online workshop for hospital admins already on Daryeel or preparing to join. We walk through doctor rosters, booking rules, visit tracking, and common support cases.\n\nBring your laptop — you will practice in a sandbox environment with our team on hand.",
      image: marketingImages.eventsMeetup,
    },
    {
      slug: "family-wellness-session",
      title: "Family Wellness Session",
      meta: "05 Jan 2027 · Gabiley · Community Hall",
      tag: "Patients",
      description:
        "Practical tips on emergency cards, family profiles, and staying connected to care.",
      content:
        "A community session focused on family health readiness. Learn how to set up family profiles, keep emergency cards up to date, and find doctors and hospitals nearby.\n\nOpen to families and caregivers. Light refreshments provided.",
      image: marketingImages.eventsCommunity,
    },
    {
      slug: "clinical-digital-skills-bootcamp",
      title: "Clinical Digital Skills Bootcamp",
      meta: "18 Jan 2027 · Hargeisa · Training Center",
      tag: "Training",
      description:
        "Full-day intensive for clinicians adopting telemedicine and digital documentation.",
      content:
        "An intensive one-day bootcamp for clinicians adopting telemedicine and digital documentation. Morning theory, afternoon practice, and a short skills check at the end.\n\nLimited seats — register early through the contact form.",
      image: marketingImages.eventsConference,
    },
  ],
}

export const INSIGHTS_DEFAULTS: CmsListBody = {
  stats: [
    { value: "5", label: "Articles" },
    { value: "4", label: "Topics" },
    { value: "5", label: "Min avg read" },
    { value: "New", label: "Weekly" },
  ],
  items: [
    {
      slug: "why-one-health-identity-matters",
      title: "Why one health identity matters for families in Somaliland",
      meta: "Digital Health · 5 min",
      tag: "Digital Health",
      description:
        "A single trusted digital identity helps patients move between clinics and hospitals without losing their history.",
      content:
        "When a family visits different clinics, paper notes and informal referrals make it easy to lose critical history — allergies, medications, prior visits. A shared digital health identity keeps that story with the patient.\n\nDaryeel focuses on one connected profile so clinicians see what they need, patients stay in control, and care continues across facilities. Privacy and consent sit at the centre of that design: access is intentional, not automatic.\n\nFor families, that means fewer repeated questions and safer care. For hospitals, it means cleaner workflows and better continuity.",
      image: marketingImages.insightsHealth,
    },
    {
      slug: "hospitals-reduce-no-shows",
      title: "How partner hospitals reduce no-shows with smarter booking",
      meta: "Hospitals · 4 min",
      tag: "Hospitals",
      description:
        "Connected scheduling and reminders improve attendance and free clinicians to focus on care.",
      content:
        "Missed appointments waste clinician time and delay care for other patients. Partner hospitals on Daryeel use clearer booking, confirmation, and reminder flows so families know when and where to arrive.\n\nEarly results from similar programmes show fewer no-shows when patients can see upcoming visits in one place and facilities can confirm status quickly.\n\nThe goal is simple: fill the schedule with people who can attend — and make it easy to reschedule when life gets in the way.",
      image: marketingImages.insightsDesk,
    },
    {
      slug: "privacy-consent-safe-data",
      title: "Building trust: privacy, consent, and safe health data",
      meta: "Privacy · 6 min",
      tag: "Privacy",
      description:
        "Patients deserve clear control over who can access their records — and platforms must make that easy.",
      content:
        "Trust is the foundation of digital health. Patients need to understand who can see their information, why, and how to change that. Consent should be clear language, not buried fine print.\n\nWe design Daryeel around responsible access: clinicians get what they need for care, while patients keep visibility into their journey. Security practices and audit trails support that promise.\n\nWhen privacy is visible and usable, families are more willing to keep accurate records — and care improves.",
      image: marketingImages.insightsPrivacy,
    },
    {
      slug: "gabiley-to-hargeisa-access",
      title: "From Gabiley to Hargeisa: expanding access to care",
      meta: "Community · 5 min",
      tag: "Community",
      description:
        "Outreach, training, and mobile tools help communities discover doctors and hospitals faster.",
      content:
        "Access is not only about buildings — it is about knowing where to go and how to get there. Community outreach, facilitator training, and mobile tools help families in Gabiley, Hargeisa, and beyond discover nearby care.\n\nPartner hospitals and independent doctors appear in one directory. Training programmes grow local capacity so digital tools stick.\n\nExpansion works best when technology follows people and trust, not the other way around.",
      image: marketingImages.insightsFamily,
    },
    {
      slug: "emergency-cards-every-second",
      title: "Emergency cards that work when every second counts",
      meta: "Product · 3 min",
      tag: "Product",
      description:
        "Quick access to blood type, allergies, and emergency contacts can save lives in critical moments.",
      content:
        "In an emergency, caregivers need blood type, allergies, and contacts immediately. Digital emergency cards put that information where it can be found fast — on a phone, with clear fields and family visibility.\n\nKeep cards updated after new diagnoses or medication changes. Share access with trusted family members so someone else can help if you cannot.\n\nSmall habits here make a large difference when minutes matter.",
      image: marketingImages.careDoctor,
    },
  ],
}

export function defaultsForSlug(slug: string): CmsListBody {
  if (slug === "training") return TRAINING_DEFAULTS
  if (slug === "events") return EVENTS_DEFAULTS
  if (slug === "insights") return INSIGHTS_DEFAULTS
  return { stats: [], items: [] }
}

export const LIST_PAGE_SLUGS = ["training", "events", "insights"] as const
export type ListPageSlug = (typeof LIST_PAGE_SLUGS)[number]

export function isListPageSlug(slug?: string | null): slug is ListPageSlug {
  return !!slug && (LIST_PAGE_SLUGS as readonly string[]).includes(slug)
}

export function listBasePath(kind: ListPageSlug): string {
  return `/${kind}`
}

export function listItemPath(kind: ListPageSlug, item: CmsListItem, index = 0) {
  return `${listBasePath(kind)}/${itemSlug(item, index)}`
}
