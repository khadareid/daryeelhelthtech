/**
 * Homepage visuals — 5 hero slides + 5 top feature photos.
 * Inspired by clear image storytelling (Gabiley-style).
 */

const pexels = (id: number, w = 1600, h = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`

/** 5 rotating hero slides — image + clear message each. */
export const heroSlides = [
  {
    id: "care",
    src: pexels(5452293, 1920, 1080),
    fallback: pexels(7578804, 1920, 1080),
    alt: "Doctor consulting a patient",
    eyebrow: "Daryeel Health · Connected care",
    title: "Your Health. Your Care. One Platform.",
    subtitle:
      "Find hospitals and doctors, book visits, and manage your health journey across Somaliland and East Africa.",
    bullets: ["Hospitals", "Doctors", "Bookings", "Records"],
  },
  {
    id: "hospitals",
    src: pexels(236380, 1920, 1080),
    fallback: pexels(263402, 1920, 1080),
    alt: "Modern hospital building",
    eyebrow: "Partner hospitals",
    title: "Hospitals you can trust, in one place.",
    subtitle:
      "Browse partner facilities, open departments and doctors, then book a hospital visit through Daryeel.",
    bullets: ["Directory", "Departments", "Hospital booking"],
  },
  {
    id: "doctors",
    src: pexels(5452201, 1920, 1080),
    fallback: pexels(5234504, 1920, 1080),
    alt: "Clinician ready to care",
    eyebrow: "Daryeel doctors",
    title: "Find clinicians by specialty.",
    subtitle:
      "Independent Daryeel doctors with clear profiles — view, choose, and book when you are ready.",
    bullets: ["Specialties", "Verified profiles", "Easy booking"],
  },
  {
    id: "family",
    src: pexels(1128318, 1920, 1080),
    fallback: pexels(4226119, 1920, 1080),
    alt: "Family health and care",
    eyebrow: "Families & records",
    title: "Keep your family’s care connected.",
    subtitle:
      "Health records, emergency cards, and visit history stay with you — so care continues wherever you go.",
    bullets: ["Family profiles", "Emergency cards", "Visit history"],
  },
  {
    id: "network",
    src: pexels(7579831, 1920, 1080),
    fallback: pexels(4173251, 1920, 1080),
    alt: "Digital healthcare tools",
    eyebrow: "Digital health",
    title: "Technology that serves real care.",
    subtitle:
      "Practical tools for patients, hospitals, and doctors — built for local workflows, privacy, and trust.",
    bullets: ["Secure", "Simple", "Connected"],
  },
] as const

/** 5 image cards under the hero (was 2 — now full story strip). */
export const topFeatureImages = [
  {
    id: "hospitals",
    src: pexels(236380, 900, 700),
    title: "Hospitals",
    text: "Partner facilities & departments",
    href: "/hospitals",
  },
  {
    id: "doctors",
    src: pexels(5452201, 900, 700),
    title: "Doctors",
    text: "Specialists ready to book",
    href: "/doctors",
  },
  {
    id: "care",
    src: pexels(5452293, 900, 700),
    title: "Care",
    text: "Pathways that fit your needs",
    href: "/care",
  },
  {
    id: "training",
    src: pexels(3184292, 900, 700),
    title: "Training",
    text: "Skills for connected care",
    href: "/training",
  },
  {
    id: "about",
    src: pexels(3184418, 900, 700),
    title: "About",
    text: "Mission, vision & our team",
    href: "/about",
  },
] as const

export const homepageImages = {
  story: pexels(7578804, 1400, 1000),
  storySide: pexels(5452293, 1200, 1400),
  pillars: [
    pexels(236380, 800, 600),
    pexels(5452201, 800, 600),
    pexels(7579831, 800, 600),
  ],
  cta: pexels(4173251, 1800, 1000),
  telemedicine: pexels(7579832, 1400, 1000),
  laboratory: pexels(3825527, 1400, 1000),
  pharmacy: pexels(3683074, 1400, 1000),
  wellness: pexels(4498362, 1200, 1400),
} as const
