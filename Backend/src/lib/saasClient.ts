/**
 * Server-to-server client: Healthtech API → Daryeel SaaS.
 * Discovery (hospitals) uses public SaaS routes.
 * Booking / mutations require SAAS_INTEGRATION_KEY.
 */

export type SaaSJson = {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  code?: string;
  data?: any;
  result?: any;
  pagination?: any;
  created?: boolean;
  [key: string]: any;
};

function saasBaseUrl() {
  const raw =
    process.env.SAAS_API_URL ||
    process.env.DARYEEL_SAAS_API_URL ||
    "https://daryeelsaashealthtech-api-seven.vercel.app/api/v1";
  return raw.replace(/\/$/, "");
}

function integrationKey() {
  return (
    process.env.SAAS_INTEGRATION_KEY ||
    process.env.HEALTHTECH_INTEGRATION_KEY ||
    ""
  ).trim();
}

export class SaaSUnavailableError extends Error {
  status = 503;
  code = "SAAS_UNAVAILABLE";
  constructor(message = "Hospital system is temporarily unavailable") {
    super(message);
    this.name = "SaaSUnavailableError";
  }
}

export class SaasHttpError extends Error {
  status: number;
  code?: string;
  saas?: SaaSJson;
  constructor(message: string, status: number, code?: string, saas?: SaaSJson) {
    super(message);
    this.name = "SaasHttpError";
    this.status = status;
    this.code = code;
    this.saas = saas;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  idempotencyKey?: string;
  correlationId?: string;
  timeoutMs?: number;
  /** When true (default), require SAAS_INTEGRATION_KEY. Public discovery sets false. */
  requireAuth?: boolean;
};

export async function saasRequest(
  path: string,
  options: RequestOptions = {}
): Promise<SaaSJson> {
  const requireAuth = options.requireAuth !== false;
  const key = integrationKey();
  if (requireAuth && !key) {
    throw new SaasHttpError(
      "Hospital integration is not configured",
      503,
      "SAAS_UNAVAILABLE"
    );
  }

  const url = new URL(
    `${saasBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  );
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 20_000
  );

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (key) {
      headers.Authorization = `Bearer ${key}`;
      headers["X-Integration-Key"] = key;
    }
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    if (options.correlationId) {
      headers["X-Correlation-Id"] = options.correlationId;
    }

    const res = await fetch(url.toString(), {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let json: SaaSJson = {};
    try {
      json = (await res.json()) as SaaSJson;
    } catch {
      json = { isSuccess: false, message: `SaaS returned HTTP ${res.status}` };
    }

    if (!res.ok) {
      const status = res.status >= 500 ? 503 : res.status;
      throw new SaasHttpError(
        json.message || `Hospital system error (${res.status})`,
        status,
        json.code || (status === 503 ? "SAAS_UNAVAILABLE" : "BOOKING_FAILED"),
        json
      );
    }

    return json;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new SaaSUnavailableError(
        "We couldn't reach the hospital system in time. Your request was not confirmed."
      );
    }
    if (error?.status) throw error;
    throw new SaaSUnavailableError(
      "We couldn't complete your request right now. Please try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Public discovery — no integration key (matches SaaS /company/public-* routes). */
async function saasPublicRequest(
  path: string,
  options: Omit<RequestOptions, "requireAuth"> = {}
) {
  return saasRequest(path, { ...options, requireAuth: false });
}

export const saasApi = {
  /** Uses SaaS public hospital directory (no integration key). */
  listHospitals: (query?: Record<string, any>) =>
    saasPublicRequest("/company/public-hospitals", { query }),

  /** Uses SaaS public hospital detail (no integration key). */
  getHospital: (hospitalId: string) =>
    saasPublicRequest(`/company/public-hospitals/${hospitalId}`),

  listDepartments: async (hospitalId: string) => {
    try {
      return await saasRequest(
        `/integrations/hospitals/${hospitalId}/departments`
      );
    } catch (error: any) {
      // Fall back to public hospital detail (facilities act as departments)
      if ([401, 403, 404, 503].includes(error?.status) || !integrationKey()) {
        const hospital = await saasPublicRequest(
          `/company/public-hospitals/${hospitalId}`
        );
        const data = (hospital.data ?? hospital.result ?? {}) as any;
        const facilities = Array.isArray(data?.facilities) ? data.facilities : [];
        const departments = facilities.map((f: any) => ({
          departmentId: f.facilityId,
          name: f.name,
          type: "FACILITY",
          hospitalId,
          city: f.city || null,
          isMain: Boolean(f.isMain),
        }));
        return {
          isSuccess: true,
          data: departments,
          result: departments,
        };
      }
      throw error;
    }
  },

  listDoctors: async (hospitalId: string, query?: Record<string, any>) => {
    try {
      return await saasRequest(
        `/integrations/hospitals/${hospitalId}/doctors`,
        { query }
      );
    } catch (error: any) {
      // Public hospital detail includes doctors — normalize shape
      if ([401, 403, 404, 503].includes(error?.status) || !integrationKey()) {
        const hospital = await saasPublicRequest(
          `/company/public-hospitals/${hospitalId}`
        );
        const data = (hospital.data ?? hospital.result ?? {}) as any;
        const doctors = Array.isArray(data?.doctors) ? data.doctors : [];
        return {
          isSuccess: true,
          data: doctors,
          result: doctors,
          pagination: {
            total: doctors.length,
            page: 1,
            limit: doctors.length || 20,
            totalPages: 1,
          },
        };
      }
      throw error;
    }
  },

  listAllDoctors: (query?: Record<string, any>) =>
    saasRequest("/integrations/doctors", { query }),

  getDoctor: (doctorId: string) =>
    saasRequest(`/integrations/doctors/${doctorId}`),

  getAvailability: (doctorId: string, date?: string) =>
    saasPublicRequest(`/company/public-doctors/${doctorId}/availability`, {
      query: { date },
    }),

  createAppointment: (body: unknown, idempotencyKey?: string) =>
    saasRequest("/integrations/appointments", {
      method: "POST",
      body,
      idempotencyKey,
    }),

  listAppointments: (healthtechUserId: string) =>
    saasRequest("/integrations/appointments", {
      query: { healthtechUserId },
    }),

  getAppointment: (id: string) =>
    saasRequest(`/integrations/appointments/${id}`),

  cancelAppointment: (id: string, body: unknown) =>
    saasRequest(`/integrations/appointments/${id}/cancel`, {
      method: "POST",
      body,
    }),

  requestReschedule: (id: string, body: unknown) =>
    saasRequest(`/integrations/appointments/${id}/reschedule`, {
      method: "POST",
      body,
    }),

  respondReschedule: (id: string, body: unknown) =>
    saasRequest(`/integrations/appointments/${id}/reschedule/respond`, {
      method: "POST",
      body,
    }),

  submitReview: (id: string, body: unknown) =>
    saasRequest(`/integrations/appointments/${id}/reviews`, {
      method: "POST",
      body,
    }),

  getOpdTicket: (id: string) =>
    saasRequest(`/integrations/opd-tickets/${id}`),

  getVisit: (id: string) => saasRequest(`/integrations/visits/${id}`),
};
