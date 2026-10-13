export type PublicHospital = {
  tenantId: string;
  companyName: string;
  username?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  publicLogoUrl?: string | null;
  publicCoverUrl?: string | null;
  publicDescription?: string | null;
  description?: string | null;
  industry?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  isHealthFacility?: boolean;
  createdAt?: string;
  _count?: {
    professionalProfiles?: number;
  };
  doctors?: PublicHospitalDoctor[];
};

export type PublicHospitalDoctor = {
  professionalProfileId: string;
  specialization?: string | null;
  subSpecialty?: string | null;
  publicBio?: string | null;
  publicPhotoUrl?: string | null;
  yearsOfExperience?: number | null;
  languages?: string[] | null;
  publicPhone?: string | null;
  website?: string | null;
  consultationFee?: string | null;
  currency?: string | null;
  isVerified?: boolean;
  department?: { name?: string | null } | null;
  user?: { name?: string | null; picture?: string | null } | null;
};

export type HospitalsPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function hospitalCover(h: PublicHospital) {
  return (
    h.publicCoverUrl ||
    h.publicLogoUrl ||
    h.logoUrl ||
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80'
  );
}

export function hospitalLogo(h: PublicHospital) {
  return (
    h.publicLogoUrl ||
    h.logoUrl ||
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&q=80'
  );
}

export function hospitalAbout(h: PublicHospital) {
  return (
    h.publicDescription ||
    h.description ||
    'Healthcare facility on the Daryeel network.'
  );
}
