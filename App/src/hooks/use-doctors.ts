import { useCallback, useEffect, useState } from 'react';

import type { DoctorItem } from '@/constants/content';
import { useAuth } from '@/context/auth-context';
import { getDoctorsRequest } from '@/lib/api';

function normalizeDoctor(raw: Partial<DoctorItem> & { id: string }): DoctorItem {
  return {
    id: String(raw.id),
    userId: raw.userId,
    name: raw.name || 'Doctor',
    specialty: raw.specialty || 'General Physician',
    city: raw.city || 'Somaliland',
    hospitalId: raw.hospitalId || 'h1',
    hospitalName: raw.hospitalName || 'Daryeel Care Network',
    image:
      raw.image ||
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
    experienceYears: Number(raw.experienceYears || 0),
    rating: Number(raw.rating || 0),
    reviews: Number(raw.reviews || 0),
    fee: Number(raw.fee || 0),
    currency: raw.currency || 'USD',
    bio: raw.bio || 'Trusted clinician on Daryeel Health.',
    availableToday: raw.availableToday !== false,
    tags: raw.tags?.length ? raw.tags : ['Consultation'],
    reviewSamples: raw.reviewSamples,
  };
}

export function useDoctors() {
  const { accessToken } = useAuth();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const remote = await getDoctorsRequest(accessToken);
    setDoctors(remote.map(normalizeDoctor));
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { doctors, loading, refresh };
}
