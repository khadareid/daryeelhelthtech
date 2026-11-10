"use strict";
/**
 * Server-to-server client: Healthtech API → Daryeel SaaS integration API.
 * Never expose SAAS_INTEGRATION_KEY to browsers or mobile apps.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saasApi = exports.SaasHttpError = exports.SaaSUnavailableError = void 0;
exports.saasRequest = saasRequest;
function saasBaseUrl() {
    const raw = process.env.SAAS_API_URL ||
        process.env.DARYEEL_SAAS_API_URL ||
        "https://daryeelsaashealthtech-api-seven.vercel.app/api/v1";
    return raw.replace(/\/$/, "");
}
function integrationKey() {
    return (process.env.SAAS_INTEGRATION_KEY ||
        process.env.HEALTHTECH_INTEGRATION_KEY ||
        "").trim();
}
class SaaSUnavailableError extends Error {
    constructor(message = "Hospital system is temporarily unavailable") {
        super(message);
        this.status = 503;
        this.code = "SAAS_UNAVAILABLE";
        this.name = "SaaSUnavailableError";
    }
}
exports.SaaSUnavailableError = SaaSUnavailableError;
class SaasHttpError extends Error {
    constructor(message, status, code, saas) {
        super(message);
        this.name = "SaasHttpError";
        this.status = status;
        this.code = code;
        this.saas = saas;
    }
}
exports.SaasHttpError = SaasHttpError;
function saasRequest(path_1) {
    return __awaiter(this, arguments, void 0, function* (path, options = {}) {
        var _a;
        const key = integrationKey();
        if (!key) {
            throw new SaasHttpError("Hospital integration is not configured", 503, "SAAS_UNAVAILABLE");
        }
        const url = new URL(`${saasBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
        if (options.query) {
            for (const [k, v] of Object.entries(options.query)) {
                if (v !== undefined && v !== null && v !== "") {
                    url.searchParams.set(k, String(v));
                }
            }
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), (_a = options.timeoutMs) !== null && _a !== void 0 ? _a : 20000);
        try {
            const res = yield fetch(url.toString(), {
                method: options.method || "GET",
                headers: Object.assign(Object.assign({ "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Integration-Key": key }, (options.idempotencyKey
                    ? { "Idempotency-Key": options.idempotencyKey }
                    : {})), (options.correlationId
                    ? { "X-Correlation-Id": options.correlationId }
                    : {})),
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });
            let json = {};
            try {
                json = (yield res.json());
            }
            catch (_b) {
                json = { isSuccess: false, message: `SaaS returned HTTP ${res.status}` };
            }
            if (!res.ok) {
                const status = res.status >= 500 ? 503 : res.status;
                throw new SaasHttpError(json.message || `Hospital system error (${res.status})`, status, json.code || (status === 503 ? "SAAS_UNAVAILABLE" : "BOOKING_FAILED"), json);
            }
            return json;
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.name) === "AbortError") {
                throw new SaaSUnavailableError("We couldn't reach the hospital system in time. Your request was not confirmed.");
            }
            if (error === null || error === void 0 ? void 0 : error.status)
                throw error;
            throw new SaaSUnavailableError("We couldn't complete your request right now. Please try again.");
        }
        finally {
            clearTimeout(timeout);
        }
    });
}
exports.saasApi = {
    listHospitals: (query) => saasRequest("/integrations/hospitals", { query }),
    getHospital: (hospitalId) => saasRequest(`/integrations/hospitals/${hospitalId}`),
    listDepartments: (hospitalId) => saasRequest(`/integrations/hospitals/${hospitalId}/departments`),
    listDoctors: (hospitalId, query) => saasRequest(`/integrations/hospitals/${hospitalId}/doctors`, { query }),
    listAllDoctors: (query) => saasRequest("/integrations/doctors", { query }),
    getDoctor: (doctorId) => saasRequest(`/integrations/doctors/${doctorId}`),
    getAvailability: (doctorId, date) => saasRequest(`/integrations/doctors/${doctorId}/availability`, {
        query: { date },
    }),
    createAppointment: (body, idempotencyKey) => saasRequest("/integrations/appointments", {
        method: "POST",
        body,
        idempotencyKey,
    }),
    listAppointments: (healthtechUserId) => saasRequest("/integrations/appointments", {
        query: { healthtechUserId },
    }),
    getAppointment: (id) => saasRequest(`/integrations/appointments/${id}`),
    cancelAppointment: (id, body) => saasRequest(`/integrations/appointments/${id}/cancel`, {
        method: "POST",
        body,
    }),
    requestReschedule: (id, body) => saasRequest(`/integrations/appointments/${id}/reschedule`, {
        method: "POST",
        body,
    }),
    respondReschedule: (id, body) => saasRequest(`/integrations/appointments/${id}/reschedule/respond`, {
        method: "POST",
        body,
    }),
    submitReview: (id, body) => saasRequest(`/integrations/appointments/${id}/reviews`, {
        method: "POST",
        body,
    }),
    getOpdTicket: (id) => saasRequest(`/integrations/opd-tickets/${id}`),
    getVisit: (id) => saasRequest(`/integrations/visits/${id}`),
};
