export type EnumOption = { value: string; label: string };

export function enumLabel(value?: string | null, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  const key = String(value).trim();
  if (ENUM_LABELS[key]) return ENUM_LABELS[key];
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function optionsFrom(map: Record<string, string>): EnumOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  SPOUSE: 'Spouse',
  HUSBAND: 'Husband',
  WIFE: 'Wife',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  BROTHER: 'Brother',
  SISTER: 'Sister',
  CHILD: 'Child',
  PARENT: 'Parent',
  GRANDPARENT: 'Grandparent',
  FRIEND: 'Friend',
  GUARDIAN: 'Guardian',
  CAREGIVER: 'Caregiver',
  FAMILY: 'Family',
  OTHER: 'Other',
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
  UNKNOWN: 'Unknown',
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  RESCHEDULE_REQUESTED: 'Reschedule requested',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
};

export const ALLERGY_SEVERITY_LABELS: Record<string, string> = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
  LIFE_THREATENING: 'Life-threatening',
  UNKNOWN: 'Unknown',
};

export const ALLERGY_TYPE_LABELS: Record<string, string> = {
  FOOD: 'Food',
  DRUG: 'Drug / medicine',
  ENVIRONMENT: 'Environment',
  INSECT: 'Insect',
  OTHER: 'Other',
};

export const RECORD_TYPE_LABELS: Record<string, string> = {
  VISIT: 'Visit',
  CONSULTATION: 'Consultation',
  PROCEDURE: 'Procedure',
  NOTE: 'Clinical note',
  LAB: 'Lab',
  IMAGING: 'Imaging',
  OTHER: 'Other',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REPORT: 'Report',
  IMAGING: 'Imaging',
  PRESCRIPTION: 'Prescription scan',
  ID: 'ID / insurance',
  LAB: 'Lab report',
  OTHER: 'Other',
};

export const LAB_STATUS_LABELS: Record<string, string> = {
  FINAL: 'Final',
  PRELIMINARY: 'Preliminary',
  PENDING: 'Pending',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'Member',
};

const ENUM_LABELS: Record<string, string> = {
  ...RELATIONSHIP_LABELS,
  ...GENDER_LABELS,
  ...BLOOD_TYPE_LABELS,
  ...APPOINTMENT_STATUS_LABELS,
  ...PAYMENT_STATUS_LABELS,
  ...ALLERGY_SEVERITY_LABELS,
  ...ALLERGY_TYPE_LABELS,
  ...RECORD_TYPE_LABELS,
  ...DOCUMENT_TYPE_LABELS,
  ...LAB_STATUS_LABELS,
  ...ROLE_LABELS,
};

export const RELATIONSHIP_OPTIONS = optionsFrom(RELATIONSHIP_LABELS);
export const GENDER_OPTIONS = optionsFrom(GENDER_LABELS);
export const BLOOD_TYPE_OPTIONS = optionsFrom(BLOOD_TYPE_LABELS);
export const APPOINTMENT_STATUS_OPTIONS = optionsFrom(APPOINTMENT_STATUS_LABELS);
export const ALLERGY_SEVERITY_OPTIONS = optionsFrom(ALLERGY_SEVERITY_LABELS);
export const ALLERGY_TYPE_OPTIONS = optionsFrom(ALLERGY_TYPE_LABELS);
export const RECORD_TYPE_OPTIONS = optionsFrom(RECORD_TYPE_LABELS);
export const DOCUMENT_TYPE_OPTIONS = optionsFrom(DOCUMENT_TYPE_LABELS);
export const LAB_STATUS_OPTIONS = optionsFrom(LAB_STATUS_LABELS);
