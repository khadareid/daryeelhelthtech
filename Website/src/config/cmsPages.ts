/** Canonical public pages managed in CMS (admin can edit all copy). */

export type CmsPageDef = {
  slug: string
  path: string
  label: string
  group: "Main" | "About" | "Learn" | "Legal" | "Care"
  defaults: {
    title: string
    subtitle: string
    summary: string
  }
}

/** Priority pages listed first in admin (About = Management & Staff). */
export const CMS_PAGE_CATALOG: CmsPageDef[] = [
  {
    slug: "about",
    path: "/about",
    label: "About",
    group: "About",
    defaults: {
      title: "About Us",
      subtitle:
        "Discover the story, mission, and people behind Daryeel Health",
      summary:
        "Daryeel Health connects patients, providers, hospitals, labs, pharmacies, employers and government across Somaliland and East Africa.",
    },
  },
  {
    slug: "management-staff",
    path: "/about#team",
    label: "Our Team",
    group: "About",
    defaults: {
      title: "Our Dedicated Team",
      subtitle:
        "Meet the dedicated team, board members, partners, and supporters behind Daryeel Health",
      summary:
        "Our dedicated team consists of qualified healthcare leaders, administrators, board members, partners, and volunteers committed to serving the community with professionalism, integrity, and passion.",
    },
  },
  {
    slug: "training",
    path: "/training",
    label: "Training",
    group: "Learn",
    defaults: {
      title: "Training",
      subtitle:
        "Practical digital health training for clinicians, hospital teams, and community partners.",
      summary:
        "Learn the skills that power connected care across Somaliland and East Africa.",
    },
  },
  {
    slug: "events",
    path: "/events",
    label: "Events",
    group: "Learn",
    defaults: {
      title: "Events",
      subtitle:
        "Workshops, community days, and partner sessions that bring connected healthcare to life.",
      summary: "Join us in person or online. Registration is free unless noted.",
    },
  },
  {
    slug: "insights",
    path: "/insights",
    label: "Insights",
    group: "Learn",
    defaults: {
      title: "Insights",
      subtitle:
        "Stories, guides, and updates on digital healthcare and patient safety.",
      summary: "Insights for patients and providers across East Africa.",
    },
  },
  {
    slug: "contact",
    path: "/contact",
    label: "Contact",
    group: "Main",
    defaults: {
      title: "Contact",
      subtitle:
        "Reach the Daryeel Health team for support, partnerships, training, or media.",
      summary: "We usually respond within one business day.",
    },
  },
  {
    slug: "care",
    path: "/care",
    label: "Care",
    group: "Care",
    defaults: {
      title: "Care",
      subtitle: "Find hospitals, doctors, and the care pathway that fits you.",
      summary:
        "Book hospital visits, connect with Daryeel doctors, track appointments, and keep your health journey in one place.",
    },
  },
  {
    slug: "home",
    path: "/",
    label: "Home",
    group: "Main",
    defaults: {
      title: "Healthcare, Connected Around You",
      subtitle: "Your Health. Your Care. One Connected Platform.",
      summary:
        "Daryeel Health helps people connect with hospitals and doctors, manage health information, and stay connected to better care across Somaliland and East Africa.",
    },
  },
  {
    slug: "hospitals",
    path: "/hospitals",
    label: "Hospitals",
    group: "Care",
    defaults: {
      title: "Hospitals",
      subtitle: "Browse partner hospitals and book with facility doctors.",
      summary:
        "Discover hospitals across the Daryeel network and request a visit with their clinicians.",
    },
  },
  {
    slug: "doctors",
    path: "/doctors",
    label: "Doctors",
    group: "Care",
    defaults: {
      title: "Daryeel doctors",
      subtitle:
        "Independent clinicians on the Daryeel directory — specialty, bio, and booking.",
      summary:
        "Find independent Daryeel doctors by specialty and book a local visit.",
    },
  },
  {
    slug: "privacy",
    path: "/privacy",
    label: "Privacy",
    group: "Legal",
    defaults: {
      title: "Privacy Policy",
      subtitle: "How Daryeel Health protects your personal and health information.",
      summary:
        "We are committed to privacy, consent, and responsible handling of health data.",
    },
  },
  {
    slug: "terms",
    path: "/terms",
    label: "Terms",
    group: "Legal",
    defaults: {
      title: "Terms of Use",
      subtitle: "The rules that guide use of the Daryeel Health platform.",
      summary:
        "Please read these terms carefully before using Daryeel Health services.",
    },
  },
]

export function pathForCmsSlug(slug: string): string {
  return CMS_PAGE_CATALOG.find((p) => p.slug === slug)?.path || `/${slug}`
}
