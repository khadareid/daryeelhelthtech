import { env } from '@/config/env';
import type { DoctorItem } from '@/constants/content';
import { clearCsrfToken, ensureCsrfToken } from '@/lib/csrf';
import type {
  HospitalsPagination,
  PublicHospital,
} from '@/types/hospital';

export type ApiSuccess<T> = {
  isSuccess: true;
  message?: string;
  result?: T;
  user?: T;
  data?: T;
};

export type AuthUser = {
  userid: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  picture?: string | null;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type AppointmentItem = {
  appointmentid: string;
  appointmentCode?: string;
  scheduledAt: string;
  status: string;
  doctorName?: string | null;
  patientName?: string | null;
  facilityName?: string | null;
  reason?: string | null;
};

export type VitalItem = {
  vitalsignid?: string;
  type?: string;
  value?: number | string;
  unit?: string | null;
  recordedAt?: string;
  heartRate?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  temperature?: number | null;
  weight?: number | null;
};

export type UserProfile = AuthUser & {
  profile?: {
    city?: string | null;
    bloodType?: string | null;
    height?: number | null;
    weight?: number | null;
    healthId?: string | null;
  } | null;
  appointments?: AppointmentItem[];
  medications?: Array<{
    medicationid?: string;
    name?: string;
    dosage?: string | null;
    instructions?: string | null;
  }>;
  vitalSigns?: VitalItem[];
  dailyHealthLogs?: Array<{
    dailyhealthlogid?: string;
    date?: string;
    mood?: string | null;
    steps?: number | null;
    waterIntakeMl?: number | null;
    sleepHours?: number | null;
  }>;
  prescriptions?: Array<{
    prescriptionid?: string;
    issuedAt?: string;
    status?: string;
  }>;
  _count?: {
    appointments?: number;
    prescriptions?: number;
    labOrders?: number;
    notifications?: number;
  };
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  skipCsrf?: boolean;
};

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isCsrfError(status: number, data: { message?: string } | null) {
  return status === 403 && typeof data?.message === 'string' && /csrf/i.test(data.message);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, skipCsrf = false } = options;

  const run = async (forceCsrf = false) => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
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
  const data = await apiRequest<ApiSuccess<AuthResult>>('/user/login', {
    method: 'POST',
    body: { email, password },
  });
  const result = data.result;
  if (!result?.accessToken || !result.user) {
    throw new Error(data.message || 'Login failed');
  }
  return result;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const data = await apiRequest<ApiSuccess<AuthResult>>('/user/register', {
    method: 'POST',
    body: input,
  });
  const result = data.result;
  if (!result?.accessToken || !result.user) {
    throw new Error(data.message || 'Registration failed');
  }
  return result;
}

export async function getProfileRequest(userId: string, token: string) {
  const data = await apiRequest<ApiSuccess<UserProfile>>(`/user/profile/${userId}`, {
    method: 'GET',
    token,
    skipCsrf: true,
  });
  const profile = data.user ?? data.result ?? data.data;
  if (!profile) throw new Error('Profile not found');
  return profile;
}

export async function getDoctorsRequest(token?: string | null) {
  try {
    const data = await apiRequest<ApiSuccess<DoctorItem[]>>('/user/doctors', {
      method: 'GET',
      token,
      skipCsrf: true,
    });
    const list = data.result ?? data.data ?? [];
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      ...item,
      fee: Number(item.fee ?? 15),
      rating: Number(item.rating ?? 4.8),
      reviews: Number(item.reviews ?? 0),
      experienceYears: Number(item.experienceYears ?? 0),
      tags: item.tags ?? [],
      bio: item.bio || 'Trusted clinician on Daryeel Health.',
      availableToday: item.availableToday !== false,
      image:
        item.image ||
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
    }));
  } catch {
    return [];
  }
}

export async function getTodayHealthLog(token: string) {
  try {
    return await apiRequest<ApiSuccess<Record<string, unknown>>>('/daily-health-log/today', {
      method: 'GET',
      token,
      skipCsrf: true,
    });
  } catch {
    return null;
  }
}

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Create or update today's daily health log (steps/water/sleep sync). */
export async function upsertTodayHealthLog(
  token: string,
  fields: Record<string, unknown>,
) {
  const date = todayDateKey();
  const body = { ...fields, source: fields.source || 'DEVICE' };
  try {
    return await apiRequest<ApiSuccess<Record<string, unknown>>>(
      `/daily-health-log/${date}`,
      { method: 'PUT', body, token },
    );
  } catch {
    return apiRequest<ApiSuccess<Record<string, unknown>>>('/daily-health-log', {
      method: 'POST',
      body: { date, ...body },
      token,
    });
  }
}

export async function changeRoleRequest(
  input: { role: string; reason?: string },
  token: string,
) {
  const data = await apiRequest<
    ApiSuccess<{
      accessToken?: string;
      refreshToken?: string;
      applicationPending?: boolean;
    }> & { user?: AuthUser; message?: string }
  >('/user/profile/me/role', {
    method: 'PATCH',
    body: input,
    token,
  });
  return {
    user: data.user,
    message: data.message,
    applicationPending: Boolean(data.result?.applicationPending),
    accessToken: data.result?.accessToken,
    refreshToken: data.result?.refreshToken,
  };
}

type HospitalsListResponse = {
  isSuccess: boolean;
  data?: PublicHospital[];
  result?: PublicHospital[];
  pagination?: HospitalsPagination;
  message?: string;
};

type HospitalDetailResponse = {
  isSuccess: boolean;
  data?: PublicHospital;
  result?: PublicHospital;
  message?: string;
};

/** Public SaaS hospitals — no auth/CSRF (GET only). */
async function saasPublicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${env.saasApiUrl}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });
  const data = await parseJson(res);
  if (!res.ok || data?.isSuccess === false) {
    throw new Error(
      (typeof data?.message === 'string' && data.message) ||
        `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export type BookAppointmentInput = {
  doctorId?: string;
  doctorName: string;
  specialty?: string;
  facilityName?: string;
  facilityId?: string;
  scheduledAt: string;
  duration?: number;
  reason?: string;
  notes?: string;
  visitType?: string;
};

export type BookHealthcareInput = BookAppointmentInput & {
  tenantId?: string;
  hospitalId?: string;
  consentGranted: boolean;
  type?: string;
  idempotencyKey?: string;
  consultationFee?: number | string;
  currency?: string;
};

/** Hospital booking via Healthtech → SaaS integration (authoritative). */
export async function createHealthcareAppointmentRequest(
  input: BookHealthcareInput,
  token: string,
) {
  const data = await apiRequest<ApiSuccess<AppointmentItem>>(
    '/healthcare/appointments',
    {
      method: 'POST',
      body: {
        ...input,
        tenantId: input.tenantId || input.facilityId || input.hospitalId,
        hospitalId: input.hospitalId || input.facilityId,
        consentGranted: input.consentGranted !== false,
      },
      token,
    },
  );
  const result = data.result ?? data.data;
  if (!result) {
    throw new Error(
      data.message ||
        "We couldn't complete your appointment request. It was not confirmed.",
    );
  }
  return result;
}

export async function createAppointmentRequest(
  input: BookAppointmentInput,
  token: string,
) {
  // Prefer integrated hospital booking when a facility/hospital id is present
  if (input.facilityId || (input as BookHealthcareInput).hospitalId) {
    return createHealthcareAppointmentRequest(
      { ...input, consentGranted: true },
      token,
    );
  }
  const data = await apiRequest<ApiSuccess<AppointmentItem>>('/appointments', {
    method: 'POST',
    body: input,
    token,
  });
  const result = data.result ?? data.data;
  if (!result) throw new Error(data.message || 'Booking failed');
  return result;
}

export async function listAppointmentsRequest(token: string) {
  try {
    const healthcare = await apiRequest<ApiSuccess<AppointmentItem[]>>(
      '/healthcare/appointments',
      { method: 'GET', token, skipCsrf: true },
    );
    const ht = healthcare.result ?? healthcare.data ?? [];
    if (Array.isArray(ht) && ht.length > 0) return ht;
  } catch {
    /* fall through to local appointments */
  }
  const data = await apiRequest<ApiSuccess<AppointmentItem[]>>('/appointments', {
    method: 'GET',
    token,
    skipCsrf: true,
  });
  const list = data.result ?? data.data ?? [];
  return Array.isArray(list) ? list : [];
}

export async function listOpdTicketsRequest(token: string) {
  const data = await apiRequest<ApiSuccess<AppointmentItem[]>>(
    '/healthcare/opd-tickets',
    { method: 'GET', token, skipCsrf: true },
  );
  const list = data.result ?? data.data ?? [];
  return Array.isArray(list) ? list : [];
}

export async function getDoctorAvailabilityRequest(
  doctorId: string,
  date: string,
  token?: string | null,
) {
  const data = await apiRequest<
    ApiSuccess<{ windows: unknown[]; slots: string[] }>
  >(
    `/healthcare/doctors/${encodeURIComponent(doctorId)}/availability?date=${encodeURIComponent(date)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  return data.result ?? data.data ?? { windows: [], slots: [] };
}

export type ChatMessage = {
  messageid: string;
  senderId: string;
  recipientId?: string | null;
  recipientType?: string | null;
  subject?: string | null;
  body: string;
  createdAt: string;
  sender?: { userid?: string; fullName?: string };
};

export async function getChatThreadRequest(peerId: string, token: string) {
  const data = await apiRequest<ApiSuccess<ChatMessage[]>>(
    `/messages/thread/${encodeURIComponent(peerId)}`,
    { method: 'GET', token, skipCsrf: true },
  );
  const list = data.result ?? data.data ?? [];
  return Array.isArray(list) ? list : [];
}

export async function sendChatMessageRequest(
  input: {
    recipientId: string;
    recipientType?: string;
    subject?: string;
    body: string;
  },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<ChatMessage>>('/messages', {
    method: 'POST',
    body: input,
    token,
  });
  const result = data.result ?? data.data;
  if (!result) throw new Error(data.message || 'Send failed');
  return result;
}

export type NewsFeedItem = {
  newspostid: string;
  title: string;
  content: string;
  category: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  isOfficial?: boolean;
  commentCount?: number;
  reactionCount?: number;
  author?: {
    fullName?: string;
    verifiedProfessional?: boolean;
  };
};

export async function getNewsFeedRequest(params?: {
  page?: number;
  limit?: number;
  token?: string | null;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const data = await apiRequest<{
    isSuccess: boolean;
    data?: NewsFeedItem[];
    pagination?: unknown;
  }>(`/news?page=${page}&limit=${limit}`, {
    method: 'GET',
    token: params?.token,
    skipCsrf: true,
  });
  return Array.isArray(data.data) ? data.data : [];
}

export async function getNewsPostRequest(id: string, token?: string | null) {
  const data = await apiRequest<ApiSuccess<any>>(`/news/${encodeURIComponent(id)}`, {
    method: 'GET',
    token,
    skipCsrf: true,
  });
  return data.result ?? data.data;
}

export async function createNewsPostRequest(
  input: { title: string; content: string; category?: string; status?: string },
  token: string,
) {
  const data = await apiRequest<ApiSuccess<NewsFeedItem>>('/news', {
    method: 'POST',
    body: { ...input, status: input.status || 'PUBLISHED' },
    token,
  });
  return data.result ?? data.data;
}

export async function reactNewsRequest(id: string, token: string) {
  return apiRequest(`/news/${id}/reactions`, {
    method: 'POST',
    body: { reactionType: 'LIKE' },
    token,
  });
}

export async function commentNewsRequest(
  id: string,
  content: string,
  token: string,
) {
  return apiRequest(`/news/${id}/comments`, {
    method: 'POST',
    body: { content },
    token,
  });
}

export async function submitProfessionalApplicationRequest(
  input: Record<string, unknown>,
  token: string,
) {
  return apiRequest('/professional-applications', {
    method: 'POST',
    body: input,
    token,
  });
}

/**
 * GET /company/public-hospitals?page=1&limit=9&search=
 * Matches SaaS getPublicHospitals controller.
 */
export async function getPublicHospitalsRequest(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(50, Math.max(1, params?.limit ?? 9));
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params?.search?.trim()) query.set('search', params.search.trim());

  const data = await saasPublicGet<HospitalsListResponse>(
    `/company/public-hospitals?${query.toString()}`,
  );

  const list = data.data ?? data.result ?? [];
  return {
    hospitals: Array.isArray(list) ? list : [],
    pagination: data.pagination ?? {
      total: Array.isArray(list) ? list.length : 0,
      page,
      limit,
      totalPages: 1,
    },
  };
}

/**
 * GET /company/public-hospitals/:tenantId
 * Matches SaaS getPublicHospital controller (hospital + doctors).
 */
export async function getPublicHospitalRequest(tenantId: string) {
  const data = await saasPublicGet<HospitalDetailResponse>(
    `/company/public-hospitals/${encodeURIComponent(tenantId)}`,
  );
  const hospital = data.data ?? data.result;
  if (!hospital) throw new Error(data.message || 'Hospital not found');
  return hospital;
}
