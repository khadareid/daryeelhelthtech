import { env } from '@/config/env';
import type { DoctorItem } from '@/constants/content';
import { clearCsrfToken, ensureCsrfToken } from '@/lib/csrf';

export type ApiSuccess<T> = {
  isSuccess: true;
  message?: string;
  result?: T;
  user?: T;
  data?: T;
};

export type Paginated<T> = {
  items: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type AuthUser = {
  userid: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: string;
  healthId?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  picture?: string | null;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  district?: string | null;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type MedicalProfile = {
  id: string;
  userId: string;
  bloodType?: string | null;
  smokingStatus?: string | null;
  alcoholUse?: string | null;
  exerciseFrequency?: string | null;
  dietType?: string | null;
  notes?: string | null;
};

export type EmergencyCard = {
  id: string;
  userId: string;
  cardNumber: string;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergiesSummary?: string | null;
  conditionsSummary?: string | null;
  medicationsSummary?: string | null;
  doctorNotes?: string | null;
  qrCode?: string | null;
  isActive?: boolean;
};

export type AppointmentItem = {
  id: string;
  appointmentCode?: string;
  scheduledAt: string;
  duration?: number;
  status: string;
  reason?: string | null;
  notes?: string | null;
  doctorId?: string | null;
  consultationFee?: number | string | null;
  currency?: string | null;
  paymentRequired?: boolean;
  paymentStatus?: string | null;
  source?: string | null;
  doctorName?: string | null;
  facilityName?: string | null;
  specialty?: string | null;
  department?: string | null;
  externalHospitalId?: string | null;
  externalDoctorId?: string | null;
  externalAppointmentId?: string | null;
  externalTicketId?: string | null;
  externalTicketNumber?: string | null;
  proposedScheduledAt?: string | null;
  proposedMessage?: string | null;
  doctor?: {
    id?: string;
    fullName?: string | null;
    specialty?: string | null;
    clinicName?: string | null;
    profileImage?: string | null;
  } | null;
  user?: {
    userid?: string;
    fullName?: string | null;
  } | null;
};

export type PaymentItem = {
  id: string;
  amount: number | string;
  currency?: string;
  status: string;
  method?: string | null;
  provider?: string | null;
  paymentReference?: string | null;
  appointmentId?: string | null;
  createdAt?: string;
  appointment?: {
    id?: string;
    appointmentCode?: string;
    scheduledAt?: string;
    reason?: string | null;
    doctor?: { fullName?: string | null } | null;
  } | null;
};

export type VitalItem = {
  id: string;
  temperature?: number | null;
  bloodPressureSys?: number | null;
  bloodPressureDia?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  source?: string | null;
  recordedAt?: string;
};

export type MedicationItem = {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  isActive?: boolean;
  prescribedBy?: string | null;
  reason?: string | null;
  notes?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type AllergyItem = {
  id: string;
  allergen: string;
  type?: string | null;
  severity?: string | null;
  reaction?: string | null;
  isActive?: boolean;
  notes?: string | null;
  diagnosedAt?: string | null;
};

export type PrescriptionItem = {
  id: string;
  prescriptionNumber?: string;
  issuedAt?: string;
  status?: string;
  notes?: string | null;
  doctor?: { fullName?: string | null } | null;
  items?: Array<{
    id: string;
    medicineName: string;
    dosage?: string | null;
    frequency?: string | null;
    instructions?: string | null;
  }>;
};

export type MedicalRecordItem = {
  id: string;
  recordType: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  doctorName?: string | null;
  facilityName?: string | null;
  recordDate: string;
  notes?: string | null;
};

export type FamilyMemberItem = {
  id: string;
  fullName: string;
  relationship: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  isDependent?: boolean;
  isEmergencyContact?: boolean;
  notes?: string | null;
};

export type EmergencyContactItem = {
  id: string;
  fullName: string;
  phone: string;
  relationship: string;
  alternatePhone?: string | null;
  isPrimary?: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  channel?: string;
  isRead: boolean;
  readAt?: string | null;
  data?: unknown;
  createdAt: string;
};

export type DailyHealthLog = {
  id?: string;
  date?: string;
  mood?: string | null;
  sleepQuality?: string | null;
  stressLevel?: string | null;
  energyLevel?: string | null;
  activityLevel?: string | null;
  painLevel?: string | null;
  notes?: string | null;
  steps?: number | null;
  distanceKm?: number | null;
  activeMinutes?: number | null;
  caloriesBurned?: number | null;
  heartRateAvg?: number | null;
  weightKg?: number | null;
  oxygenSaturation?: number | null;
  waterIntakeMl?: number | null;
  waterGoalMl?: number | null;
  sleepHours?: number | null;
  stepsGoal?: number | null;
  sleepGoalHours?: number | null;
  source?: string | null;
};

export type UserProfile = AuthUser & {
  medicalProfile?: MedicalProfile | null;
  emergencyCard?: EmergencyCard | null;
  doctor?: {
    id: string;
    specialty?: string | null;
    verificationStatus?: string | null;
  } | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  language?: string;
  timezone?: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  skipCsrf?: boolean;
  headers?: Record<string, string>;
};

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isCsrfError(status: number, data: { message?: string } | null) {
  return (
    status === 403 &&
    typeof data?.message === 'string' &&
    /csrf/i.test(data.message)
  );
}

function unwrap<T>(data: ApiSuccess<T> | null | undefined): T | undefined {
  if (!data) return undefined;
  return (data.result ?? data.data ?? data.user) as T | undefined;
}

function unwrapItems<T>(
  data: ApiSuccess<Paginated<T> | T[]> | null | undefined,
): T[] {
  const payload = unwrap(data);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    skipCsrf = false,
    headers: extraHeaders,
  } = options;

  const run = async (forceCsrf = false) => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(extraHeaders || {}),
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!skipCsrf && method !== 'GET') {
      const csrf = await ensureCsrfToken(forceCsrf);
      headers['x-csrf-token'] = csrf;
    }

    const res = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await parseJson(res);
    return { res, data };
  };

  let { res, data } = await run(false);

  if (isCsrfError(res.status, data)) {
    clearCsrfToken();
    ({ res, data } = await run(true));
  }

  if (!res.ok || data?.isSuccess === false) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await ensureCsrfToken(true);
    return true;
  } catch {
    return false;
  }
}

export async function loginRequest(email: string, password: string) {
  const data = await apiRequest<ApiSuccess<AuthResult>>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  const result = unwrap(data) ?? (data as unknown as AuthResult);
  const user = (result as AuthResult).user ?? (data as { user?: AuthUser }).user;
  const accessToken =
    (result as AuthResult).accessToken ??
    (data as { accessToken?: string }).accessToken;
  const refreshToken =
    (result as AuthResult).refreshToken ??
    (data as { refreshToken?: string }).refreshToken;
  if (!accessToken || !user) {
    throw new Error(data.message || 'Login failed');
  }
  return {
    user,
    accessToken,
    refreshToken: refreshToken || '',
  } satisfies AuthResult;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const data = await apiRequest<ApiSuccess<AuthResult>>('/auth/register', {
    method: 'POST',
    body: input,
  });
  const result = unwrap(data) ?? (data as unknown as AuthResult);
  const user = (result as AuthResult).user ?? (data as { user?: AuthUser }).user;
  const accessToken =
    (result as AuthResult).accessToken ??
    (data as { accessToken?: string }).accessToken;
  const refreshToken =
    (result as AuthResult).refreshToken ??
    (data as { refreshToken?: string }).refreshToken;
  if (!accessToken || !user) {
    throw new Error(data.message || 'Registration failed');
  }
  return {
    user,
    accessToken,
    refreshToken: refreshToken || '',
  } satisfies AuthResult;
}

export async function refreshTokensRequest(refreshToken: string) {
  const data = await apiRequest<
    ApiSuccess<{ accessToken: string; refreshToken: string }>
  >('/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  const result = unwrap(data);
  if (!result?.accessToken) throw new Error(data.message || 'Refresh failed');
  return result;
}

export async function getMeRequest(token: string) {
  const data = await apiRequest<ApiSuccess<UserProfile>>('/users/me', {
    method: 'GET',
    token,
    skipCsrf: true,
  });
  const profile = unwrap(data);
  if (!profile) throw new Error('Profile not found');
  return profile;
}

/** @deprecated use getMeRequest */
export async function getProfileRequest(_userId: string, token: string) {
  return getMeRequest(token);
}

export type UpdateMeInput = {
  fullName?: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  picture?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  language?: string | null;
  timezone?: string | null;
};

export async function updateMeRequest(input: UpdateMeInput, token: string) {
  const data = await apiRequest<ApiSuccess<AuthUser>>('/users/me', {
    method: 'PUT',
    body: input,
    token,
  });
  const user = unwrap(data);
  if (!user) throw new Error(data.message || 'Update failed');
  return user;
}

export async function changeMyPasswordRequest(
  input: { currentPassword: string; newPassword: string },
  token: string,
) {
  return apiRequest<ApiSuccess<{ ok?: boolean }>>('/users/me/password', {
    method: 'PUT',
    body: input,
    token,
  });
}

export async function upsertMedicalProfileRequest(
  input: Partial<MedicalProfile> & { bloodType?: string | null },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<MedicalProfile>>('/medical-profile', {
    method: 'PUT',
    body: input,
    token,
  });
  const row = unwrap(data);
  if (!row) throw new Error(data.message || 'Could not save medical profile');
  return row;
}

const DEFAULT_DOCTOR_IMAGE =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80';

type ApiDoctor = {
  id: string;
  userId?: string;
  fullName?: string;
  specialty?: string;
  subSpecialty?: string | null;
  city?: string | null;
  clinicName?: string | null;
  profileImage?: string | null;
  yearsExperience?: number | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  consultationFee?: number | string | null;
  currency?: string | null;
  bio?: string | null;
  isAvailable?: boolean;
  isOnline?: boolean;
  languages?: string[];
  user?: {
    userid?: string;
    picture?: string | null;
    avatarUrl?: string | null;
  } | null;
  doctorReviews?: Array<{
    id: string;
    rating: number;
    review?: string | null;
    createdAt?: string;
    isAnonymous?: boolean;
  }>;
};

function mapDoctor(raw: ApiDoctor): DoctorItem {
  const fee = Number(raw.consultationFee ?? 0);
  const rating = Number(raw.rating ?? 0);
  return {
    id: String(raw.id),
    userId: raw.userId || raw.user?.userid,
    name: raw.fullName || 'Doctor',
    specialty: raw.specialty || 'General Physician',
    city: raw.city || 'Somaliland',
    clinicName: raw.clinicName || 'Daryeel Care Network',
    image:
      raw.profileImage ||
      raw.user?.avatarUrl ||
      raw.user?.picture ||
      DEFAULT_DOCTOR_IMAGE,
    experienceYears: Number(raw.yearsExperience ?? 0),
    rating: Number.isFinite(rating) ? rating : 0,
    reviews: Number(raw.reviewCount ?? 0),
    fee: Number.isFinite(fee) ? fee : 0,
    currency: raw.currency || 'USD',
    bio: raw.bio || 'Trusted clinician on Daryeel Health.',
    availableToday: raw.isAvailable !== false,
    tags: raw.subSpecialty
      ? [raw.subSpecialty]
      : raw.languages?.length
        ? raw.languages.slice(0, 3)
        : ['Consultation'],
    reviewSamples: (raw.doctorReviews || []).map((r) => ({
      id: r.id,
      author: r.isAnonymous ? 'Anonymous' : 'Patient',
      rating: r.rating,
      comment: r.review || '',
      date: r.createdAt
        ? new Date(r.createdAt).toISOString().slice(0, 10)
        : '',
    })),
  };
}

export async function getDoctorsRequest(
  token?: string | null,
  params?: { q?: string; specialty?: string; page?: number; limit?: number },
) {
  try {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit ?? 50));
    else query.set('limit', '50');
    const qs = query.toString();
    const data = await apiRequest<ApiSuccess<Paginated<ApiDoctor>>>(
      `/doctors${qs ? `?${qs}` : ''}`,
      { method: 'GET', token, skipCsrf: true },
    );
    return unwrapItems(data).map(mapDoctor);
  } catch {
    return [];
  }
}

export async function getDoctorRequest(id: string, token?: string | null) {
  const data = await apiRequest<ApiSuccess<ApiDoctor>>(
    `/doctors/${encodeURIComponent(id)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  const doctor = unwrap(data);
  if (!doctor) throw new Error('Doctor not found');
  return mapDoctor(doctor);
}

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getTodayHealthLog(token: string) {
  try {
    const date = todayDateKey();
    const data = await apiRequest<ApiSuccess<Paginated<DailyHealthLog>>>(
      `/daily-health-logs?from=${date}&to=${date}&limit=1`,
      { method: 'GET', token, skipCsrf: true },
    );
    const items = unwrapItems(data);
    return {
      isSuccess: true as const,
      result: items[0] ?? null,
    };
  } catch {
    return null;
  }
}

export async function listDailyHealthLogsRequest(
  token: string,
  params?: { from?: string; to?: string; page?: number; limit?: number },
) {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const data = await apiRequest<ApiSuccess<Paginated<DailyHealthLog>>>(
    `/daily-health-logs${qs ? `?${qs}` : ''}`,
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

/** Create or update today's daily health log (steps/water/sleep sync). */
export async function upsertTodayHealthLog(
  token: string,
  fields: Record<string, unknown>,
) {
  const date = todayDateKey();
  const body = {
    date,
    ...fields,
    source: fields.source || 'MANUAL',
  };
  return apiRequest<ApiSuccess<DailyHealthLog>>('/daily-health-logs', {
    method: 'POST',
    body,
    token,
  });
}

export type BookAppointmentInput = {
  doctorId: string;
  scheduledAt: string;
  duration?: number;
  reason?: string;
  notes?: string;
  consultationFee?: number | string;
  currency?: string;
  paymentRequired?: boolean;
};

export async function createAppointmentRequest(
  input: BookAppointmentInput,
  token: string,
) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>('/appointments', {
    method: 'POST',
    body: input,
    token,
  });
  const result = unwrap(data);
  if (!result) throw new Error(data.message || 'Booking failed');
  return result;
}

export async function listAppointmentsRequest(
  token: string,
  opts?: { as?: 'doctor'; status?: string },
) {
  const params = new URLSearchParams();
  if (opts?.as) params.set('as', opts.as);
  if (opts?.status) params.set('status', opts.status);
  const qs = params.toString();
  const data = await apiRequest<ApiSuccess<Paginated<AppointmentItem>>>(
    `/appointments${qs ? `?${qs}` : ''}`,
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function updateAppointmentRequest(
  id: string,
  body: {
    status?: string;
    cancellationReason?: string;
    paymentStatus?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    `/appointments/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
  return unwrap(data);
}

export async function listPaymentsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<PaymentItem>>>(
    '/payments',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createPaymentRequest(
  input: {
    appointmentId?: string;
    amount?: number;
    currency?: string;
    method?: string;
    status?: string;
    provider?: string;
    transactionId?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<PaymentItem>>('/payments', {
    method: 'POST',
    body: input,
    token,
  });
  const result = unwrap(data);
  if (!result) throw new Error(data.message || 'Payment failed');
  return result;
}

export async function updatePaymentRequest(
  id: string,
  body: {
    status?: string;
    method?: string;
    provider?: string;
    transactionId?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<PaymentItem>>(
    `/payments/${encodeURIComponent(id)}`,
    { method: 'PATCH', body, token },
  );
  const result = unwrap(data);
  if (!result) throw new Error(data.message || 'Payment update failed');
  return result;
}

/** Same as website: pay pending invoice or create PAID payment for a booking. */
export async function payBookingInvoiceRequest(
  input: {
    appointmentId: string;
    paymentId?: string;
    amount: number;
    currency?: string;
    method: string;
    provider: string;
    transactionId?: string;
  },
  token: string,
) {
  if (input.paymentId) {
    return updatePaymentRequest(
      input.paymentId,
      {
        status: 'PAID',
        method: input.method,
        provider: input.provider,
        transactionId: input.transactionId,
      },
      token,
    );
  }
  return createPaymentRequest(
    {
      appointmentId: input.appointmentId,
      amount: input.amount,
      currency: input.currency || 'USD',
      method: input.method,
      status: 'PAID',
      provider: input.provider,
      transactionId: input.transactionId,
    },
    token,
  );
}

export async function cancelAppointmentRequest(id: string, token: string) {
  return updateAppointmentRequest(id, { status: 'CANCELLED' }, token);
}

export type DoctorMe = {
  id: string;
  fullName: string;
  specialty: string;
  verificationStatus?: string;
};

export async function getMyDoctorRequest(token: string) {
  try {
    const data = await apiRequest<ApiSuccess<DoctorMe | null>>('/doctor/me', {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    return unwrap(data) ?? null;
  } catch {
    return null;
  }
}

export async function listMedicationsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<MedicationItem>>>(
    '/medications',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createMedicationRequest(
  input: {
    name: string;
    dosage?: string;
    frequency?: string;
    notes?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<MedicationItem>>('/medications', {
    method: 'POST',
    body: input,
    token,
  });
  return unwrap(data);
}

export async function listAllergiesRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<AllergyItem>>>(
    '/allergies',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createAllergyRequest(
  input: {
    allergen: string;
    severity?: string;
    reaction?: string;
    type?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<AllergyItem>>('/allergies', {
    method: 'POST',
    body: input,
    token,
  });
  return unwrap(data);
}

export async function listVitalSignsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<VitalItem>>>(
    '/vital-signs',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createVitalSignRequest(
  input: Partial<VitalItem>,
  token: string,
) {
  const data = await apiRequest<ApiSuccess<VitalItem>>('/vital-signs', {
    method: 'POST',
    body: input,
    token,
  });
  return unwrap(data);
}

export async function listPrescriptionsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<PrescriptionItem>>>(
    '/prescriptions',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function listMedicalRecordsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<MedicalRecordItem>>>(
    '/medical-records',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createMedicalRecordRequest(
  input: {
    title: string;
    recordType?: string;
    diagnosis?: string;
    doctorName?: string;
    facilityName?: string;
    notes?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<MedicalRecordItem>>(
    '/medical-records',
    {
      method: 'POST',
      body: {
        ...input,
        recordType: input.recordType || 'VISIT',
        recordDate: new Date().toISOString(),
      },
      token,
    },
  );
  return unwrap(data);
}

export type LabResultItem = {
  id: string;
  testName: string;
  resultValue?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  status?: string | null;
  labName?: string | null;
  resultDate: string;
};

export async function listLabResultsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<LabResultItem>>>(
    '/lab-results',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createLabResultRequest(
  input: {
    testName: string;
    resultValue?: string;
    unit?: string;
    referenceRange?: string;
    labName?: string;
    status?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<LabResultItem>>('/lab-results', {
    method: 'POST',
    body: {
      ...input,
      status: input.status || 'FINAL',
      resultDate: new Date().toISOString(),
    },
    token,
  });
  return unwrap(data);
}

export type MedicalDocumentItem = {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  description?: string | null;
  documentDate?: string | null;
};

export async function listMedicalDocumentsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<MedicalDocumentItem>>>(
    '/medical-documents',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createMedicalDocumentRequest(
  input: {
    title: string;
    documentType?: string;
    fileUrl: string;
    description?: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<MedicalDocumentItem>>(
    '/medical-documents',
    {
      method: 'POST',
      body: {
        ...input,
        documentType: input.documentType || 'REPORT',
        documentDate: new Date().toISOString(),
      },
      token,
    },
  );
  return unwrap(data);
}

export async function listEmergencyContactsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<EmergencyContactItem>>>(
    '/emergency-contacts',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createEmergencyContactRequest(
  input: {
    fullName: string;
    phone: string;
    relationship: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<EmergencyContactItem>>(
    '/emergency-contacts',
    { method: 'POST', body: input, token },
  );
  return unwrap(data);
}

export async function getEmergencyCardRequest(token: string) {
  const data = await apiRequest<ApiSuccess<EmergencyCard | null>>(
    '/emergency-card',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrap(data) ?? null;
}

export async function upsertEmergencyCardRequest(
  input: Partial<EmergencyCard>,
  token: string,
) {
  const data = await apiRequest<ApiSuccess<EmergencyCard>>('/emergency-card', {
    method: 'PUT',
    body: input,
    token,
  });
  return unwrap(data);
}

export async function listFamilyMembersRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<FamilyMemberItem>>>(
    '/family-members',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function createFamilyMemberRequest(
  input: {
    fullName: string;
    relationship: string;
    phone?: string;
    gender?: string;
    isEmergencyContact?: boolean;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<FamilyMemberItem>>(
    '/family-members',
    { method: 'POST', body: input, token },
  );
  return unwrap(data);
}

export async function listNotificationsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<Paginated<NotificationItem>>>(
    '/notifications',
    { method: 'GET', token, skipCsrf: true },
  );
  return unwrapItems(data);
}

export async function markNotificationReadRequest(id: string, token: string) {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    body: {},
    token,
  });
}

export async function markAllNotificationsReadRequest(token: string) {
  return apiRequest('/notifications/read-all', {
    method: 'POST',
    body: {},
    token,
  });
}

/* ------------------------------------------------------------------ */
/* Healthcare booking (Healthtech /api/v1/healthcare — never call SaaS) */
/* ------------------------------------------------------------------ */

const HEALTHCARE = '/healthcare';

export type HealthcareHospital = {
  tenantId?: string;
  id?: string;
  companyName?: string | null;
  name?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  publicLogoUrl?: string | null;
  description?: string | null;
  publicDescription?: string | null;
  averageRating?: number | string | null;
  rating?: number | string | null;
  totalReviews?: number | null;
  facilities?: Array<{
    facilityId?: string;
    name?: string;
    city?: string | null;
    isMain?: boolean;
  }>;
  doctors?: HealthcareDoctor[];
  _count?: {
    professionalProfiles?: number;
    facilities?: number;
  };
};

export type HealthcareDepartment = {
  departmentId?: string;
  id?: string;
  name?: string;
  type?: string | null;
  hospitalId?: string;
  city?: string | null;
  isMain?: boolean;
};

export type HealthcareDoctor = {
  doctorId?: string;
  userId?: string;
  id?: string;
  professionalProfileId?: string;
  name?: string | null;
  specialization?: string | null;
  specialty?: string | null;
  yearsOfExperience?: number | null;
  languages?: string[] | null;
  publicBio?: string | null;
  bio?: string | null;
  publicPhotoUrl?: string | null;
  picture?: string | null;
  consultationFee?: number | string | null;
  currency?: string | null;
  averageRating?: number | string | null;
  totalReviews?: number | null;
  facilityId?: string | null;
  facilityName?: string | null;
  hospitalId?: string | null;
  hospitalName?: string | null;
  tenantId?: string | null;
  department?: { name?: string | null } | null;
  user?: {
    userId?: string;
    name?: string | null;
    picture?: string | null;
  } | null;
};

export type HealthcareAvailability = {
  windows?: Array<{
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    slotMinutes?: number;
    isAvailable?: boolean;
  }>;
  slots?: Array<string | { start?: string; time?: string; label?: string }>;
  usingDefault?: boolean;
  available?: boolean;
};

export type HealthcareOpdTicket = {
  ticketId?: string | null;
  ticketNumber?: string | null;
  appointmentId?: string;
  externalAppointmentId?: string | null;
  hospital?: string | null;
  doctor?: string | null;
  department?: string | null;
  scheduledAt?: string;
  status?: string;
};

export type CreateHealthcareAppointmentInput = {
  hospitalId: string;
  doctorId: string;
  scheduledAt: string;
  tenantId?: string;
  facilityId?: string | null;
  departmentId?: string | null;
  department?: string | null;
  duration?: number;
  reason?: string;
  notes?: string;
  type?: string;
  consentGranted?: boolean;
  consentId?: string;
  consultationFee?: number | string | null;
  currency?: string;
  doctorName?: string;
  facilityName?: string;
  specialty?: string;
  idempotencyKey?: string;
};

function makeIdempotencyKey() {
  return `ht-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function healthcareQs(
  params?: Record<string, string | number | undefined | null>,
) {
  const query = new URLSearchParams();
  if (!params) return '';
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export function healthcareHospitalId(h: HealthcareHospital) {
  return String(h.tenantId || h.id || '');
}

export function healthcareHospitalName(h: HealthcareHospital) {
  return h.companyName || h.name || 'Hospital';
}

export function healthcareDoctorId(d: HealthcareDoctor) {
  return String(
    d.doctorId || d.userId || d.user?.userId || d.id || d.professionalProfileId || '',
  );
}

export function healthcareDoctorName(d: HealthcareDoctor) {
  return d.user?.name || d.name || 'Doctor';
}

export function isHealthcareAppointment(item: AppointmentItem) {
  return (
    String(item.source || '').toUpperCase() === 'HEALTHTECH' ||
    Boolean(item.externalHospitalId || item.facilityName)
  );
}

export async function listHealthcareHospitals(
  token?: string | null,
  params?: {
    search?: string;
    city?: string;
    department?: string;
    page?: number;
    limit?: number;
  },
) {
  try {
    const data = await apiRequest<
      ApiSuccess<HealthcareHospital[] | Paginated<HealthcareHospital>>
    >(`${HEALTHCARE}/hospitals${healthcareQs(params)}`, {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    return unwrapItems(data);
  } catch {
    return [] as HealthcareHospital[];
  }
}

export async function getHealthcareHospital(
  hospitalId: string,
  token?: string | null,
) {
  const data = await apiRequest<ApiSuccess<HealthcareHospital>>(
    `${HEALTHCARE}/hospitals/${encodeURIComponent(hospitalId)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  const hospital = unwrap(data);
  if (!hospital) throw new Error(data.message || 'Hospital not found');
  return hospital;
}

export async function listHealthcareDepartments(
  hospitalId: string,
  token?: string | null,
) {
  try {
    const data = await apiRequest<
      ApiSuccess<HealthcareDepartment[] | Paginated<HealthcareDepartment>>
    >(
      `${HEALTHCARE}/hospitals/${encodeURIComponent(hospitalId)}/departments`,
      { method: 'GET', token, skipCsrf: true },
    );
    return unwrapItems(data);
  } catch {
    return [] as HealthcareDepartment[];
  }
}

export async function listHealthcareDoctors(
  token?: string | null,
  params?: {
    hospitalId?: string;
    search?: string;
    specialty?: string;
    specialization?: string;
    department?: string;
    city?: string;
    page?: number;
    limit?: number;
  },
) {
  try {
    const hospitalId = params?.hospitalId;
    const path = hospitalId
      ? `${HEALTHCARE}/hospitals/${encodeURIComponent(hospitalId)}/doctors`
      : `${HEALTHCARE}/doctors`;
    const { hospitalId: _omit, ...rest } = params || {};
    const data = await apiRequest<
      ApiSuccess<HealthcareDoctor[] | Paginated<HealthcareDoctor>>
    >(`${path}${healthcareQs(rest)}`, {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    return unwrapItems(data);
  } catch {
    return [] as HealthcareDoctor[];
  }
}

export async function getHealthcareDoctor(
  doctorId: string,
  token?: string | null,
) {
  const data = await apiRequest<ApiSuccess<HealthcareDoctor>>(
    `${HEALTHCARE}/doctors/${encodeURIComponent(doctorId)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  const doctor = unwrap(data);
  if (!doctor) throw new Error(data.message || 'Doctor not found');
  return doctor;
}

export async function getHealthcareAvailability(
  doctorId: string,
  date: string,
  token?: string | null,
) {
  const data = await apiRequest<ApiSuccess<HealthcareAvailability>>(
    `${HEALTHCARE}/doctors/${encodeURIComponent(doctorId)}/availability${healthcareQs({ date })}`,
    { method: 'GET', token, skipCsrf: true },
  );
  return (
    unwrap(data) ??
    ({ slots: [], windows: [] } satisfies HealthcareAvailability)
  );
}

export async function createHealthcareAppointment(
  input: CreateHealthcareAppointmentInput,
  token: string,
) {
  const idempotencyKey = input.idempotencyKey || makeIdempotencyKey();
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    `${HEALTHCARE}/appointments`,
    {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: {
        ...input,
        tenantId: input.tenantId || input.hospitalId,
        consentGranted: input.consentGranted ?? true,
        idempotencyKey,
      },
    },
  );
  const result = unwrap(data);
  if (!result) throw new Error(data.message || 'Booking failed');
  return result;
}

export async function listHealthcareAppointments(
  token: string,
  params?: { status?: string },
) {
  try {
    const data = await apiRequest<
      ApiSuccess<AppointmentItem[] | Paginated<AppointmentItem>>
    >(`${HEALTHCARE}/appointments${healthcareQs(params)}`, {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    return unwrapItems(data);
  } catch {
    return [] as AppointmentItem[];
  }
}

export async function getHealthcareAppointment(id: string, token: string) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    `${HEALTHCARE}/appointments/${encodeURIComponent(id)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  const row = unwrap(data);
  if (!row) throw new Error(data.message || 'Appointment not found');
  return row;
}

export async function cancelHealthcareAppointment(
  id: string,
  token: string,
  reason?: string,
) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    `${HEALTHCARE}/appointments/${encodeURIComponent(id)}/cancel`,
    {
      method: 'POST',
      token,
      body: reason ? { reason } : {},
    },
  );
  return unwrap(data);
}

export async function requestHealthcareReschedule(
  id: string,
  token: string,
  input: { proposedScheduledAt: string; message?: string },
) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    `${HEALTHCARE}/appointments/${encodeURIComponent(id)}/reschedule`,
    {
      method: 'POST',
      token,
      body: {
        proposedScheduledAt: input.proposedScheduledAt,
        scheduledAt: input.proposedScheduledAt,
        message: input.message,
      },
    },
  );
  const row = unwrap(data);
  if (!row) throw new Error(data.message || 'Reschedule failed');
  return row;
}

export async function listHealthcareOpdTickets(token: string) {
  try {
    const data = await apiRequest<
      ApiSuccess<HealthcareOpdTicket[] | Paginated<HealthcareOpdTicket>>
    >(`${HEALTHCARE}/opd-tickets`, {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    return unwrapItems(data);
  } catch {
    return [] as HealthcareOpdTicket[];
  }
}
