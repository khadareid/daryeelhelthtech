import type { DoctorItem } from '@/constants/content';

export type HospitalItem = {
  id: string;
  name: string;
  city: string;
  type: string;
  openHours: string;
  rating: number;
  departments: number;
  image: string;
  phone: string;
  address: string;
  about: string;
};

export type PharmacyItem = {
  id: string;
  name: string;
  city: string;
  openNow: boolean;
  delivery: boolean;
  distanceKm: number;
};

export type HealthNewsItem = {
  id: string;
  title: string;
  category: string;
  readMinutes: number;
  summary: string;
  image: string;
  publishedAt: string;
  body: string[];
};

export type DemoAppointment = {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  when: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
};

export type DemoPrescription = {
  id: string;
  medicine: string;
  dosage: string;
  instructions: string;
  doctor: string;
  status: 'Active' | 'Completed';
};

export type DemoLabOrder = {
  id: string;
  testName: string;
  lab: string;
  status: 'Ordered' | 'Processing' | 'Ready';
  orderedAt: string;
};

export type DemoMedicalRecord = {
  id: string;
  title: string;
  type: string;
  date: string;
  facility: string;
};

export type HealthServiceItem = {
  id: string;
  title: string;
  desc: string;
  tone: 'blue' | 'teal' | 'indigo' | 'sky';
};

export type DailyHealthDemo = {
  steps: number;
  stepsGoal: number;
  waterMl: number;
  waterGoal: number;
  sleepHours: number;
  sleepGoal: number;
  heartRate: number;
  weightKg: number;
  mood: string;
  energy: string;
};

export const DEMO_DAILY_HEALTH: DailyHealthDemo = {
  steps: 6842,
  stepsGoal: 10000,
  waterMl: 1450,
  waterGoal: 2500,
  sleepHours: 7.2,
  sleepGoal: 8,
  heartRate: 72,
  weightKg: 68.4,
  mood: 'Good',
  energy: 'Steady',
};

export const DEMO_HOSPITALS: HospitalItem[] = [
  {
    id: 'h1',
    name: 'Daryeel Central Hospital',
    city: 'Hargeisa',
    type: 'Multi-specialty hospital',
    openHours: 'Emergency 24/7 · Clinics 8AM–8PM',
    rating: 4.8,
    departments: 14,
    phone: '+252 63 400 1100',
    address: '26 June Road, Hargeisa',
    about:
      'Flagship Daryeel facility with emergency, cardiology, pediatrics, and outpatient clinics.',
    image:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80',
  },
  {
    id: 'h2',
    name: 'Gabiley Family Clinic',
    city: 'Gabiley',
    type: 'Primary care clinic',
    openHours: 'Sat–Thu 8AM–6PM',
    rating: 4.7,
    departments: 6,
    phone: '+252 63 400 2200',
    address: 'Main Market Street, Gabiley',
    about:
      'Neighborhood clinic for family medicine, vaccinations, and everyday check-ups.',
    image:
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=900&q=80',
  },
  {
    id: 'h3',
    name: 'Berbera Maternal Care Center',
    city: 'Berbera',
    type: 'Maternity & women’s health',
    openHours: 'Daily 7AM–9PM',
    rating: 4.9,
    departments: 5,
    phone: '+252 63 400 3300',
    address: 'Coastal Avenue, Berbera',
    about:
      'Focused maternity and women’s health services from antenatal care to postnatal recovery.',
    image:
      'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&q=80',
  },
  {
    id: 'h4',
    name: 'Borama Diagnostics Hub',
    city: 'Borama',
    type: 'Labs & imaging',
    openHours: 'Sat–Thu 7:30AM–7PM',
    rating: 4.6,
    departments: 4,
    phone: '+252 63 400 4400',
    address: 'University Road, Borama',
    about:
      'Labs and imaging hub for CBC, glucose, lipid panels, and rapid diagnostics.',
    image:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&q=80',
  },
];

export const DEMO_PHARMACIES: PharmacyItem[] = [
  {
    id: 'p1',
    name: 'Daryeel Pharmacy Hargeisa',
    city: 'Hargeisa',
    openNow: true,
    delivery: true,
    distanceKm: 1.2,
  },
  {
    id: 'p2',
    name: 'City Meds Gabiley',
    city: 'Gabiley',
    openNow: true,
    delivery: false,
    distanceKm: 2.4,
  },
  {
    id: 'p3',
    name: 'Coastal Care Pharmacy',
    city: 'Berbera',
    openNow: false,
    delivery: true,
    distanceKm: 3.1,
  },
];

export const DEMO_NEWS: HealthNewsItem[] = [
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
];

export const DEMO_APPOINTMENTS: DemoAppointment[] = [
  {
    id: 'a1',
    doctorName: 'Dr. Ayaan Warsame',
    specialty: 'Cardiologist',
    hospital: 'Daryeel Central Hospital',
    when: 'Tue, 7 Oct · 10:30 AM',
    status: 'Confirmed',
  },
  {
    id: 'a2',
    doctorName: 'Dr. Hodo Ali',
    specialty: 'Pediatrician',
    hospital: 'Gabiley Family Clinic',
    when: 'Fri, 10 Oct · 09:00 AM',
    status: 'Pending',
  },
  {
    id: 'a3',
    doctorName: 'Dr. Mohamed Hassan',
    specialty: 'General Physician',
    hospital: 'Daryeel Central Hospital',
    when: 'Mon, 29 Sep · 04:00 PM',
    status: 'Completed',
  },
];

export const DEMO_PRESCRIPTIONS: DemoPrescription[] = [
  {
    id: 'rx1',
    medicine: 'Amlodipine 5mg',
    dosage: '1 tablet daily',
    instructions: 'Take in the morning with water',
    doctor: 'Dr. Ayaan Warsame',
    status: 'Active',
  },
  {
    id: 'rx2',
    medicine: 'Vitamin D3 1000 IU',
    dosage: '1 capsule daily',
    instructions: 'After breakfast',
    doctor: 'Dr. Mohamed Hassan',
    status: 'Active',
  },
  {
    id: 'rx3',
    medicine: 'Amoxicillin 500mg',
    dosage: '1 capsule × 3 / day',
    instructions: 'Complete the full 5-day course',
    doctor: 'Dr. Hodo Ali',
    status: 'Completed',
  },
];

export const DEMO_LAB_ORDERS: DemoLabOrder[] = [
  {
    id: 'lab1',
    testName: 'Complete Blood Count (CBC)',
    lab: 'Borama Diagnostics Hub',
    status: 'Ready',
    orderedAt: '2026-10-01',
  },
  {
    id: 'lab2',
    testName: 'Fasting Blood Glucose',
    lab: 'Daryeel Central Hospital',
    status: 'Processing',
    orderedAt: '2026-10-04',
  },
  {
    id: 'lab3',
    testName: 'Lipid Panel',
    lab: 'Gabiley Family Clinic',
    status: 'Ordered',
    orderedAt: '2026-10-05',
  },
];

export const DEMO_MEDICAL_RECORDS: DemoMedicalRecord[] = [
  {
    id: 'mr1',
    title: 'Annual health summary 2026',
    type: 'Clinical summary',
    date: '2026-08-18',
    facility: 'Daryeel Central Hospital',
  },
  {
    id: 'mr2',
    title: 'ECG report',
    type: 'Cardiology',
    date: '2026-07-02',
    facility: 'Daryeel Central Hospital',
  },
  {
    id: 'mr3',
    title: 'Vaccination record',
    type: 'Immunization',
    date: '2026-05-14',
    facility: 'Gabiley Family Clinic',
  },
];

export const HEALTH_SERVICES: HealthServiceItem[] = [
  {
    id: 's1',
    title: 'Doctors',
    desc: 'Book trusted clinicians near you',
    tone: 'blue',
  },
  {
    id: 's2',
    title: 'Hospitals & Clinics',
    desc: 'Find care facilities across cities',
    tone: 'indigo',
  },
  {
    id: 's3',
    title: 'Health Daily',
    desc: 'Track steps, water, sleep & vitals',
    tone: 'teal',
  },
  {
    id: 's4',
    title: 'Appointments',
    desc: 'Upcoming and past visits',
    tone: 'sky',
  },
  {
    id: 's5',
    title: 'Prescriptions',
    desc: 'Active medicines and refills',
    tone: 'blue',
  },
  {
    id: 's6',
    title: 'Laboratory',
    desc: 'Orders and ready results',
    tone: 'indigo',
  },
  {
    id: 's7',
    title: 'Medical Records',
    desc: 'Summaries, ECG, vaccines',
    tone: 'teal',
  },
  {
    id: 's8',
    title: 'Pharmacies',
    desc: 'Nearby pharmacies & delivery',
    tone: 'sky',
  },
];

export const EXTRA_DOCTORS: DoctorItem[] = [
  {
    id: 'nura',
    name: 'Dr. Nura Abdi',
    specialty: 'Dermatologist',
    city: 'Hargeisa',
    hospitalId: 'h1',
    hospitalName: 'Daryeel Central Hospital',
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
    experienceYears: 7,
    rating: 4.8,
    reviews: 121,
    fee: 22,
    currency: 'USD',
    bio: 'Skin care specialist for acne, eczema, and everyday dermatology needs.',
    availableToday: true,
    tags: ['Acne', 'Eczema', 'Allergy'],
    reviewSamples: [
      {
        id: 'r6',
        author: 'Layla H.',
        rating: 5,
        comment: 'My acne plan finally worked after two visits.',
        date: '2026-09-22',
      },
    ],
  },
  {
    id: 'saed',
    name: 'Dr. Saed Omar',
    specialty: 'Orthopedic Surgeon',
    city: 'Hargeisa',
    hospitalId: 'h1',
    hospitalName: 'Daryeel Central Hospital',
    image:
      'https://images.unsplash.com/photo-1537368910025-700350fe47c0?w=600&q=80',
    experienceYears: 14,
    rating: 4.7,
    reviews: 98,
    fee: 35,
    currency: 'USD',
    bio: 'Bones and joints care with clear rehab plans after injury.',
    availableToday: false,
    tags: ['Knee pain', 'Fracture', 'Sports'],
    reviewSamples: [
      {
        id: 'r7',
        author: 'Jama O.',
        rating: 4,
        comment: 'Clear rehab steps after my knee injury.',
        date: '2026-08-01',
      },
    ],
  },
  {
    id: 'fardowsa',
    name: 'Dr. Fardowsa Ismail',
    specialty: 'Mental Health',
    city: 'Gabiley',
    hospitalId: 'h2',
    hospitalName: 'Gabiley Family Clinic',
    image:
      'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=600&q=80',
    experienceYears: 10,
    rating: 4.9,
    reviews: 156,
    fee: 20,
    currency: 'USD',
    bio: 'Supportive counseling and mental wellness for adults and teens.',
    availableToday: true,
    tags: ['Anxiety', 'Sleep', 'Stress'],
    reviewSamples: [
      {
        id: 'r8',
        author: 'Anonymous',
        rating: 5,
        comment: 'Felt heard without pressure. Very professional.',
        date: '2026-09-15',
      },
    ],
  },
];

export type OnboardingSlide = {
  key: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  highlights: string[];
  stats: { label: string; value: string }[];
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'welcome',
    badge: 'Your health home',
    title: 'Welcome to Daryeel Health',
    subtitle:
      'Book doctors, visit hospitals, track daily wellness, and keep family records in one secure app built for Somaliland.',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    highlights: ['Secure login', 'Family-friendly', 'Works offline with demo data'],
    stats: [
      { label: 'Cities', value: '4+' },
      { label: 'Doctors', value: '40+' },
      { label: 'Services', value: '8' },
    ],
  },
  {
    key: 'discover',
    badge: 'Care near you',
    title: 'Find doctors & hospitals fast',
    subtitle:
      'Browse specialties, ratings, and availability. Open a hospital to see its clinicians, hours, and departments before you book.',
    image:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    highlights: ['Specialties & ratings', 'Hospital profiles', 'Sample appointments'],
    stats: [
      { label: 'Hospitals', value: '4' },
      { label: 'Specialties', value: '7' },
      { label: 'Same-day', value: 'Yes' },
    ],
  },
  {
    key: 'daily',
    badge: 'Daily habits',
    title: 'Health Daily that stays simple',
    subtitle:
      'Follow steps, water, sleep, heart rate, and weight with clear progress bars — live from the API when signed in, sample data otherwise.',
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
    highlights: ['Steps & hydration', 'Sleep & heart rate', 'Mood check-ins'],
    stats: [
      { label: 'Goals', value: '3' },
      { label: 'Vitals', value: '4' },
      { label: 'Tips', value: 'Daily' },
    ],
  },
  {
    key: 'records',
    badge: 'One record',
    title: 'Labs, meds & visits together',
    subtitle:
      'Keep prescriptions, lab orders, medical summaries, and pharmacy options ready — so your next visit starts with context, not paperwork.',
    image:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
    highlights: ['Prescriptions', 'Lab results', 'Medical records'],
    stats: [
      { label: 'Rx', value: 'Active' },
      { label: 'Labs', value: 'Ready' },
      { label: 'History', value: 'Saved' },
    ],
  },
  {
    key: 'start',
    badge: 'Get started',
    title: 'Create your free account',
    subtitle:
      'Sign up with email or Google, then book visits, open alerts, and use the + quick actions grid anytime from the bottom bar.',
    image:
      'https://images.unsplash.com/photo-1666213288771-27e667471a0c?w=1200&q=80',
    highlights: ['Email or Google', 'Quick actions +', 'Dark / light mode'],
    stats: [
      { label: 'Setup', value: '2 min' },
      { label: 'Support', value: '24/7' },
      { label: 'Cost', value: 'Free' },
    ],
  },
];
