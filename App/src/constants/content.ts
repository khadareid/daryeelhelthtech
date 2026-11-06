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
  clinicName: string;
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
  icon:
    | 'general'
    | 'cardio'
    | 'derm'
    | 'pedia'
    | 'lab'
    | 'mental'
    | 'ortho'
    | 'women';
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

/** Every 20 minutes from 8:00 AM–8:00 PM (e.g. 8:00, 8:20, 8:40…) */
function buildTimeSlots(
  startHour = 8,
  endHour = 20,
  stepMinutes = 20,
): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break;
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push(
        `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`,
      );
    }
  }
  return slots;
}

export const TIME_SLOTS = buildTimeSlots(8, 20, 20);

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
