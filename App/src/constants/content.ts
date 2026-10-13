export type DoctorReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export type DoctorItem = {
  id: string;
  userId?: string;
  name: string;
  specialty: string;
  city: string;
  hospitalId: string;
  hospitalName: string;
  image: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  fee: number;
  currency: string;
  bio: string;
  availableToday: boolean;
  tags: string[];
  reviewSamples?: DoctorReview[];
};

export type CategoryItem = {
  id: string;
  label: string;
  icon: 'general' | 'cardio' | 'derm' | 'pedia' | 'lab' | 'mental' | 'ortho' | 'women';
};

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', icon: 'general' },
  { id: 'general', label: 'General', icon: 'general' },
  { id: 'cardio', label: 'Cardiology', icon: 'cardio' },
  { id: 'derm', label: 'Dermatology', icon: 'derm' },
  { id: 'pedia', label: 'Pediatrics', icon: 'pedia' },
  { id: 'ortho', label: 'Orthopedics', icon: 'ortho' },
  { id: 'mental', label: 'Mental Health', icon: 'mental' },
  { id: 'women', label: 'Women’s Health', icon: 'women' },
];

export const FALLBACK_DOCTORS: DoctorItem[] = [
  {
    id: 'ayaan',
    name: 'Dr. Ayaan Warsame',
    specialty: 'Cardiologist',
    city: 'Hargeisa',
    hospitalId: 'h1',
    hospitalName: 'Daryeel Central Hospital',
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
    experienceYears: 12,
    rating: 4.9,
    reviews: 214,
    fee: 25,
    currency: 'USD',
    bio: 'Heart specialist focused on clear, calm care for families across Somaliland. Patients trust her for blood pressure, chest pain, and ECG follow-ups.',
    availableToday: true,
    tags: ['Chest pain', 'Blood pressure', 'ECG'],
    reviewSamples: [
      {
        id: 'r1',
        author: 'Fadumo K.',
        rating: 5,
        comment: 'Clear explanation and very calm during my ECG visit.',
        date: '2026-09-12',
      },
      {
        id: 'r2',
        author: 'Ahmed S.',
        rating: 5,
        comment: 'Helped me manage blood pressure with a simple plan.',
        date: '2026-08-28',
      },
    ],
  },
  {
    id: 'mohamed',
    name: 'Dr. Mohamed Hassan',
    specialty: 'General Physician',
    city: 'Gabiley',
    hospitalId: 'h2',
    hospitalName: 'Gabiley Family Clinic',
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
    experienceYears: 9,
    rating: 4.8,
    reviews: 168,
    fee: 15,
    currency: 'USD',
    bio: 'Primary care doctor helping patients with everyday health and long-term conditions. Ideal for check-ups, fever, and diabetes follow-up.',
    availableToday: true,
    tags: ['Fever', 'Check-up', 'Diabetes'],
    reviewSamples: [
      {
        id: 'r3',
        author: 'Hodan M.',
        rating: 5,
        comment: 'Fast booking and practical advice for my family.',
        date: '2026-09-30',
      },
    ],
  },
  {
    id: 'hodo',
    name: 'Dr. Hodo Ali',
    specialty: 'Pediatrician',
    city: 'Hargeisa',
    hospitalId: 'h1',
    hospitalName: 'Daryeel Central Hospital',
    image:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
    experienceYears: 8,
    rating: 4.9,
    reviews: 192,
    fee: 20,
    currency: 'USD',
    bio: 'Gentle pediatric care for infants, children, and growing teens. Vaccines, growth checks, and common childhood illnesses.',
    availableToday: false,
    tags: ['Child care', 'Vaccines', 'Growth'],
    reviewSamples: [
      {
        id: 'r4',
        author: 'Sahra A.',
        rating: 5,
        comment: 'My daughter felt safe immediately. Highly recommend.',
        date: '2026-09-05',
      },
    ],
  },
  {
    id: 'yusuf',
    name: 'Dr. Yusuf Ibrahim',
    specialty: 'Midwife Consultant',
    city: 'Berbera',
    hospitalId: 'h3',
    hospitalName: 'Berbera Maternal Care Center',
    image:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80',
    experienceYears: 11,
    rating: 4.7,
    reviews: 143,
    fee: 18,
    currency: 'USD',
    bio: 'Maternity support from antenatal visits through postnatal recovery, with clear guidance for new mothers.',
    availableToday: true,
    tags: ['Pregnancy', 'Delivery', 'Postnatal'],
    reviewSamples: [
      {
        id: 'r5',
        author: 'Nasteho B.',
        rating: 4,
        comment: 'Supportive antenatal visits and easy follow-up.',
        date: '2026-08-18',
      },
    ],
  },
];

export const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export function specialtyMatchesCategory(
  specialty: string,
  categoryId: string,
): boolean {
  if (categoryId === 'all') return true;
  const s = specialty.toLowerCase();
  switch (categoryId) {
    case 'general':
      return /general|physician|primary/.test(s);
    case 'cardio':
      return /cardio|heart/.test(s);
    case 'derm':
      return /derma|skin/.test(s);
    case 'pedia':
      return /pedia|child/.test(s);
    case 'ortho':
      return /ortho|bone|joint/.test(s);
    case 'mental':
      return /mental|psych|counsel/.test(s);
    case 'women':
      return /midwife|matern|gyn|women|obstet/.test(s);
    case 'lab':
      return /lab|diagnost/.test(s);
    default:
      return true;
  }
}
