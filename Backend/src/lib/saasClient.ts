/**
 * Server-to-server client: Healthtech API → Daryeel SaaS integration API.
 * Never expose HEALTHTECH_INTEGRATION_KEY / SAAS_INTEGRATION_KEY to browsers.
 */

export type SaaSJson = {
  isSuccess?: boolean;
  message?: string;
  data?: any;
  result?: any;
  created?: boolean;
  pagination?: any;
  stats?: any;
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
  constructor(message = "Hospital system is temporarily unavailable") {
    super(message);
    this.name = "SaaSUnavailableError";
  }
}

export async function saasRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | undefined | null>;
    idempotencyKey?: string;
    correlationId?: string;
    timeoutMs?: number;
  } = {}
): Promise<SaaSJson> {
  const key = integrationKey();
  if (!key) {
    throw Object.assign(
      new Error("SAAS_INTEGRATION_KEY is not configured on the Healthtech API"),
      { status: 503 }
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
      const err: any = new Error(
        json.message || `Hospital system error (${res.status})`
      );
      err.status = res.status >= 500 ? 503 : res.status;
      err.saas = json;
      throw err;
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
      "We couldn't complete your appointment request right now. Your request was not confirmed. Please try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const saasApi = {
  listHospitals: (query?: Record<string, string | number | undefined>) =>
    saasRequest("/integrations/hospitals", { query }),
  getHospital: (hospitalId: string) =>
    saasRequest(`/integrations/hospitals/${hospitalId}`),
  listDoctors: (
    hospitalId: string,
    query?: Record<string, string | number | undefined>
  ) =>
    saasRequest(`/integrations/hospitals/${hospitalId}/doctors`, { query }),
  getDoctor: (doctorId: string) =>
    saasRequest(`/integrations/doctors/${doctorId}`),
  getAvailability: (doctorId: string, date?: string) =>
    saasRequest(`/integrations/doctors/${doctorId}/availability`, {
      query: { date },
    }),
  createAppointment: (body: unknown, idempotencyKey: string) =>
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
  getOpdTicket: (id: string) => saasRequest(`/integrations/opd-tickets/${id}`),
  getVisit: (id: string) => saasRequest(`/integrations/visits/${id}`),
};
