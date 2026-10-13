export type HealthNewsItem = {
  id: string
  title: string
  category: string
  readMinutes: number
  summary: string
  image: string
  publishedAt: string
  body: string[]
}

export const HEALTH_NEWS: HealthNewsItem[] = [
  {
    id: 'n1',
    title: '5 simple habits for healthier mornings in Somaliland heat',
    category: 'Wellness',
    readMinutes: 3,
    summary:
      'Hydration, light walking, and a protein-rich breakfast can stabilize energy before the day gets hot.',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    publishedAt: '2026-10-02',
    body: [
      'Hot mornings drain energy fast. Start with a full glass of water before coffee or tea, then add a second glass after you wash.',
      'A 10–15 minute walk in shade helps blood flow without overheating. Keep shoulders covered and carry a small bottle.',
      'Breakfast with protein (eggs, beans, yogurt) plus fruit keeps you fuller than sweet tea alone.',
      'Pack oral rehydration or salted nuts if you work outdoors. Log mood and water in Health Daily so patterns are easy to share with your clinician.',
      'If you feel dizzy, stop in shade, cool your neck, and drink slowly. Seek care if symptoms do not settle.',
    ],
  },
  {
    id: 'n2',
    title: 'When to book a pediatric check-up for your child',
    category: 'Family care',
    readMinutes: 4,
    summary:
      'Growth checks, vaccines, and developmental milestones are easier when tracked in one care record.',
    image:
      'https://images.unsplash.com/photo-1584515979956-d9f6e74b3c0f?w=900&q=80',
    publishedAt: '2026-09-28',
    body: [
      'Well-child visits catch growth and vaccine gaps early. Ask your clinic for the recommended schedule for your child’s age.',
      'Bring questions: feeding, sleep, speech, and play. Write them in Notes before you arrive.',
      'Keep vaccine cards and past lab results in one place — the Daryeel record helps when you change clinics.',
      'Book sooner for fever that lasts, breathing trouble, unusual rash, or if your child is not drinking.',
      'After the visit, save the summary and next appointment date so reminders reach you on time.',
    ],
  },
  {
    id: 'n3',
    title: 'Understanding blood pressure numbers at home',
    category: 'Heart health',
    readMinutes: 5,
    summary:
      'Know your resting range, measure at the same time daily, and share readings with your clinician.',
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80',
    publishedAt: '2026-09-20',
    body: [
      'Sit quietly for 5 minutes, feet flat, arm supported at heart level. Avoid talking while the cuff runs.',
      'Take two readings one minute apart and note the average. Same time each day makes trends clearer.',
      'Many adults aim near under 130/80 — your target may differ. Follow the range your clinician set for you.',
      'Salt, stress, missed medicine, and poor sleep can raise numbers for a day. Look at the week, not one spike.',
      'Seek urgent care for chest pain, severe headache, vision changes, or readings far above your usual with symptoms.',
    ],
  },
  {
    id: 'n4',
    title: 'Lab results made clear: CBC, glucose, and thyroid',
    category: 'Labs',
    readMinutes: 6,
    summary:
      'A quick guide to common tests and what your care team looks for after each result lands.',
    image:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=900&q=80',
    publishedAt: '2026-09-12',
    body: [
      'CBC checks red cells, white cells, and platelets — useful for anemia, infection clues, and follow-up after illness.',
      'Fasting glucose (or HbA1c when ordered) helps track sugar control. Ask whether you should fast before the draw.',
      'Thyroid panels (TSH, sometimes Free T4) explain fatigue, weight change, or heart-rate shifts — interpret with symptoms.',
      'Out-of-range does not always mean disease. Hydration, timing, and medicines can shift values.',
      'When results are ready in Daryeel, open the order, read the note from your clinician, and book a visit if they ask.',
    ],
  },
]

export function getNewsById(id?: string) {
  if (!id) return undefined
  return HEALTH_NEWS.find((item) => item.id === id)
}

export function formatNewsDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
