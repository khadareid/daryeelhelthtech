/**
 * Homepage visuals.
 *
 * Hero uses 5 rotating Pexels doctor photos (https://www.pexels.com/search/doctor/).
 * To change a slide: edit `heroSlides` below (src / title / subtitle / bullets).
 *
 * Optional local overrides live in Website/public/images/home-*.jpg
 */

const pexels = (id: number, w = 1600, h = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`

/** 5 rotating hero slides — images + matching information. */
export const heroSlides = [
  {
    id: "care",
    src: pexels(5452293, 1800, 1200),
    fallback: pexels(7578804, 1800, 1200),
    alt: "Doctor consulting a patient",
    eyebrow: "Daryeel Health",
    title: "Your Health. Your Care. Your Daryeel.",
    subtitle:
      "Find trusted hospitals and doctors, book care, and manage your health journey — all from one connected platform.",
    bullets: [
      "Partner hospitals (SaaS)",
      "Daryeel doctor directory",
      "Book after you choose",
    ],
  },
  {
    id: "doctors",
    src: pexels(5234504, 1800, 1200),
    fallback: pexels(5452201, 1800, 1200),
    alt: "Doctor with stethoscope",
    eyebrow: "Find doctors",
    title: "Trusted doctors, ready when you are.",
    subtitle:
      "Browse independent Daryeel clinicians by specialty, view profiles, and book a visit that fits your schedule.",
    bullets: [
      "Specialty search",
      "Verified clinician profiles",
      "Book in a few taps",
    ],
  },
  {
    id: "hospitals",
    src: pexels(6097763, 1800, 1200),
    fallback: pexels(236380, 1800, 1200),
    alt: "Physician reviewing medical documents",
    eyebrow: "Find hospitals",
    title: "Hospitals & departments in one place.",
    subtitle:
      "Open a partner hospital, explore departments and doctors, then book a hospital visit through Daryeel.",
    bullets: [
      "Hospital directory",
      "Departments & doctors",
      "Book hospital visits",
    ],
  },
  {
    id: "booking",
    src: pexels(7579831, 1800, 1200),
    fallback: pexels(4173251, 1800, 1200),
    alt: "Healthcare professional with digital tools",
    eyebrow: "Book care",
    title: "Hospitals & doctors, one place to book.",
    subtitle:
      "Choose a partner hospital and its doctors, or book an independent Daryeel doctor — then manage visits in your dashboard.",
    bullets: [
      "View hospitals → see doctors",
      "Browse Daryeel doctors",
      "Track visits in dashboard",
    ],
  },
  {
    id: "network",
    src: pexels(19131212, 1800, 1200),
    fallback: pexels(4989139, 1800, 1200),
    alt: "Smiling doctor reading documents",
    eyebrow: "Connected care",
    title: "One platform for your healthcare journey.",
    subtitle:
      "Discover care, connect with providers, receive treatment, and keep your health information organized with Daryeel.",
    bullets: [
      "Discover → Connect → Book",
      "Receive care",
      "Manage your health",
    ],
  },
] as const

/** Local slots you can replace later in public/images/. */
export const changeableHomeImages = {
  hero: "/images/home-hero.jpg",
  findCare: "/images/home-find-care.jpg",
  hospitals: "/images/home-hospitals.jpg",
  doctors: "/images/home-doctors.jpg",
  records: "/images/home-records.jpg",
  providers: "/images/home-providers.jpg",
  cta: "/images/home-cta.jpg",
} as const

export const homepageImages = {
  ...changeableHomeImages,

  heroFallback: heroSlides[0].src,
  findCareFallback: pexels(4989139, 1400, 1100),
  hospitalsFallback: pexels(236380, 1400, 1000),
  doctorsFallback: pexels(5452201, 1400, 1100),
  recordsFallback: pexels(7578809, 1200, 1600),
  providersFallback: pexels(4173251, 1600, 1000),
  ctaFallback: pexels(4173251, 1800, 1000),

  booking: pexels(7579831, 1200, 1600),
  telemedicine: pexels(7579832, 1400, 1000),
  laboratory: pexels(3825527, 1400, 1000),
  pharmacy: pexels(3683074, 1400, 1000),
  motherBaby: pexels(1128318, 1400, 1000),
  wellness: pexels(4498362, 1200, 1400),
  digitalHealth: pexels(7578809, 1200, 1600),

  doctorsLocal: [
    "/images/doctor-ayaan.jpg",
    "/images/doctor-hodo.jpg",
    "/images/doctor-mohamed.jpg",
    "/images/doctor-yusuf.jpg",
  ],

  banner: "/doctor-banner.jpg",
} as const

export type HomepageImageKey = keyof typeof homepageImages
