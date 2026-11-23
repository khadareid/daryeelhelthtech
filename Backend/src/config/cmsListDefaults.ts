/** Default list payloads stored in CmsPage.body for Training / Events / Insights */

const img = (id: number, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const TRAINING_BODY = {
  stats: [
    { value: "12+", label: "Programmes" },
    { value: "500+", label: "Learners trained" },
    { value: "40+", label: "Partner facilities" },
    { value: "4", label: "Core tracks" },
  ],
  items: [
    {
      title: "Clinical Digital Skills",
      meta: "2 weeks",
      description:
        "EHR basics, appointment & referral workflows, and patient privacy for clinicians.",
      image: img(3184360),
      points: ["Records", "Bookings", "Consent"],
    },
    {
      title: "Hospital System Onboarding",
      meta: "1 week",
      description:
        "Partner hospital setup, doctor rosters, scheduling, and visit tracking.",
      image: img(3184465),
      points: ["Rosters", "Ops", "Payments"],
    },
    {
      title: "Community Health Facilitator",
      meta: "3 days",
      description:
        "Health education, family onboarding to Daryeel, and emergency awareness.",
      image: img(3184418),
      points: ["Outreach", "Families", "Safety"],
    },
    {
      title: "Leadership in Digital Health",
      meta: "4 days",
      description:
        "Strategy, quality oversight, and growing a trusted care partner network.",
      image: img(1181406),
      points: ["Strategy", "Quality", "Growth"],
    },
  ],
};

export const EVENTS_BODY = {
  stats: [
    { value: "4", label: "Upcoming" },
    { value: "2", label: "Cities" },
    { value: "1", label: "Online" },
    { value: "Free", label: "Most sessions" },
  ],
  items: [
    {
      title: "Digital Health Open Day",
      meta: "12 Dec 2026 · Hargeisa · Hybrid",
      tag: "Community",
      description:
        "Meet the Daryeel team, tour the platform, and learn how families book care and manage health records.",
      image: img(1181396),
    },
    {
      title: "Hospital Partner Workshop",
      meta: "20 Dec 2026 · Online webinar",
      tag: "Providers",
      description:
        "Hands-on session for hospital admins on doctor rosters, bookings, and patient visit flows.",
      image: img(1181622),
    },
    {
      title: "Family Wellness Session",
      meta: "05 Jan 2027 · Gabiley · Community Hall",
      tag: "Patients",
      description:
        "Practical tips on emergency cards, family profiles, and staying connected to care.",
      image: img(3184339),
    },
    {
      title: "Clinical Digital Skills Bootcamp",
      meta: "18 Jan 2027 · Hargeisa · Training Center",
      tag: "Training",
      description:
        "Full-day intensive for clinicians adopting telemedicine and digital documentation.",
      image: img(1181715),
    },
  ],
};

export const INSIGHTS_BODY = {
  stats: [
    { value: "5", label: "Articles" },
    { value: "4", label: "Topics" },
    { value: "5", label: "Min avg read" },
    { value: "New", label: "Weekly" },
  ],
  items: [
    {
      title: "Why one health identity matters for families in Somaliland",
      meta: "Digital Health · 5 min",
      tag: "Digital Health",
      description:
        "A single trusted digital identity helps patients move between clinics and hospitals without losing their history.",
      image: img(7579831),
    },
    {
      title: "How partner hospitals reduce no-shows with smarter booking",
      meta: "Hospitals · 4 min",
      tag: "Hospitals",
      description:
        "Connected scheduling and reminders improve attendance and free clinicians to focus on care.",
      image: img(590022),
    },
    {
      title: "Building trust: privacy, consent, and safe health data",
      meta: "Privacy · 6 min",
      tag: "Privacy",
      description:
        "Patients deserve clear control over who can access their records — and platforms must make that easy.",
      image: img(5380642),
    },
    {
      title: "From Gabiley to Hargeisa: expanding access to care",
      meta: "Community · 5 min",
      tag: "Community",
      description:
        "Outreach, training, and mobile tools help communities discover doctors and hospitals faster.",
      image: img(1128318),
    },
    {
      title: "Emergency cards that work when every second counts",
      meta: "Product · 3 min",
      tag: "Product",
      description:
        "Quick access to blood type, allergies, and emergency contacts can save lives in critical moments.",
      image: img(5452201),
    },
  ],
};

export function bodyForSlug(slug: string) {
  if (slug === "training") return TRAINING_BODY;
  if (slug === "events") return EVENTS_BODY;
  if (slug === "insights") return INSIGHTS_BODY;
  return undefined;
}
