/**
 * Server-to-server client: Healthtech API → Daryeel SaaS integration API.
 * Never expose SAAS_INTEGRATION_KEY to browsers or mobile apps.
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
    "http://localhost:5000/api/v1";
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
};

export async function saasRequest(
  path: string,
  options: RequestOptions = {}
): Promise<SaaSJson> {
  const key = integrationKey();
  if (!key) {
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
    const res = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Integration-Key": key,
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
        ...(options.correlationId
          ? { "X-Correlation-Id": options.correlationId }
          : {}),
      },
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

export const saasApi = {
  listHospitals: (query?: Record<string, any>) =>
    saasRequest("/integrations/hospitals", { query }),
  getHospital: (hospitalId: string) =>
    saasRequest(`/integrations/hospitals/${hospitalId}`),
  listDepartments: (hospitalId: string) =>
    saasRequest(`/integrations/hospitals/${hospitalId}/departments`),
  listDoctors: (hospitalId: string, query?: Record<string, any>) =>
    saasRequest(`/integrations/hospitals/${hospitalId}/doctors`, { query }),
  listAllDoctors: (query?: Record<string, any>) =>
    saasRequest("/integrations/doctors", { query }),
  getDoctor: (doctorId: string) =>
    saasRequest(`/integrations/doctors/${doctorId}`),
  getAvailability: (doctorId: string, date?: string) =>
    saasRequest(`/integrations/doctors/${doctorId}/availability`, {
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
