"use strict";
/**
 * Server-to-server client: Healthtech API → Daryeel SaaS.
 * Discovery (hospitals) uses public SaaS routes.
 * Booking / mutations require SAAS_INTEGRATION_KEY.
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
exports.saasApi = exports.SaasHttpError = exports.SaaSUnavailableError = exports.DEFAULT_SAAS_INTEGRATION_KEY = void 0;
exports.saasRequest = saasRequest;
const DEFAULT_SAAS_HOST = "https://daryeelsaashealthtech-api-seven.vercel.app/api/v1";
function isLocalSaasUrl(url) {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}
/**
 * Normalize SaaS API base so `/api/v1` is always present exactly once.
 * Fixes common Vercel env mistakes:
 * - host only / duplicated /api/v1
 * - production SAAS_API_URL accidentally set to localhost
 */
function saasBaseUrl() {
    let raw = (process.env.SAAS_API_URL ||
        process.env.DARYEEL_SAAS_API_URL ||
        DEFAULT_SAAS_HOST)
        .trim()
        .replace(/\/$/, "");
    // Production must never call localhost SaaS
    if (!raw ||
        (process.env.NODE_ENV === "production" && isLocalSaasUrl(raw)) ||
        (process.env.VERCEL === "1" && isLocalSaasUrl(raw))) {
        raw = DEFAULT_SAAS_HOST;
    }
    // Host-only → append /api/v1
    if (!/\/api\/v1$/i.test(raw)) {
        raw = `${raw.replace(/\/api\/v1$/i, "")}/api/v1`.replace(/([^:]\/)\/+/g, "$1");
    }
    // Collapse accidental /api/v1/api/v1
    raw = raw.replace(/\/api\/v1(\/api\/v1)+/gi, "/api/v1");
    return raw.replace(/\/$/, "");
}
/**
 * Shared Healthtech ↔ SaaS bootstrap key.
 * Override in production with SAAS_INTEGRATION_KEY / HEALTHTECH_INTEGRATION_KEY
 * (same value on both Vercel projects).
 */
exports.DEFAULT_SAAS_INTEGRATION_KEY = "daryeel-healthtech-saas-shared-2026";
function integrationKey() {
    const raw = (process.env.SAAS_INTEGRATION_KEY ||
        process.env.HEALTHTECH_INTEGRATION_KEY ||
        "").trim();
    if (!raw ||
        raw === "replace-with-shared-integration-key" ||
        raw === "replace-me") {
        return exports.DEFAULT_SAAS_INTEGRATION_KEY;
    }
    return raw;
}
function integrationKeyCandidates() {
    const primary = integrationKey();
    const keys = [primary];
    if (primary !== exports.DEFAULT_SAAS_INTEGRATION_KEY) {
        keys.push(exports.DEFAULT_SAAS_INTEGRATION_KEY);
    }
    return keys;
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
function saasRequestOnce(path, options, key) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            const headers = {
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
            const res = yield fetch(url.toString(), {
                method: options.method || "GET",
                headers,
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
                throw new SaasHttpError(json.message || `Hospital system error (${res.status})`, status, json.code ||
                    (status === 401
                        ? "INVALID_INTEGRATION_KEY"
                        : status === 503
                            ? "SAAS_UNAVAILABLE"
                            : "BOOKING_FAILED"), json);
            }
            return json;
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.name) === "AbortError") {
                throw new SaaSUnavailableError("We couldn't reach the hospital system in time. Your request was not confirmed.");
            }
            if (error === null || error === void 0 ? void 0 : error.status)
                throw error;
            throw new SaaSUnavailableError(`We couldn't reach the hospital system (${saasBaseUrl()}). Please try again.`);
        }
        finally {
            clearTimeout(timeout);
        }
    });
}
function saasRequest(path_1) {
    return __awaiter(this, arguments, void 0, function* (path, options = {}) {
        const requireAuth = options.requireAuth !== false;
        if (!requireAuth) {
            return saasRequestOnce(path, options, "");
        }
        const keys = integrationKeyCandidates();
        let lastError;
        for (let i = 0; i < keys.length; i++) {
            try {
                return yield saasRequestOnce(path, options, keys[i]);
            }
            catch (error) {
                lastError = error;
                // Retry with bootstrap key when env key is rejected
                if ((error === null || error === void 0 ? void 0 : error.status) === 401 && i < keys.length - 1)
                    continue;
                throw error;
            }
        }
        throw (lastError ||
            new SaasHttpError("Hospital integration is not configured", 503, "SAAS_UNAVAILABLE"));
    });
}
/** Public discovery — no integration key (matches SaaS /company/public-* routes). */
function saasPublicRequest(path_1) {
    return __awaiter(this, arguments, void 0, function* (path, options = {}) {
        return saasRequest(path, Object.assign(Object.assign({}, options), { requireAuth: false }));
    });
}
exports.saasApi = {
    /** Uses SaaS public hospital directory (no integration key). */
    listHospitals: (query) => saasPublicRequest("/company/public-hospitals", { query }),
    /** Uses SaaS public hospital detail (no integration key). */
    getHospital: (hospitalId) => saasPublicRequest(`/company/public-hospitals/${hospitalId}`),
    listDepartments: (hospitalId) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            return yield saasRequest(`/integrations/hospitals/${hospitalId}/departments`);
        }
        catch (error) {
            // Fall back to public hospital detail (facilities act as departments)
            if ([401, 403, 404, 503].includes(error === null || error === void 0 ? void 0 : error.status) || !integrationKey()) {
                const hospital = yield saasPublicRequest(`/company/public-hospitals/${hospitalId}`);
                const data = ((_b = (_a = hospital.data) !== null && _a !== void 0 ? _a : hospital.result) !== null && _b !== void 0 ? _b : {});
                const facilities = Array.isArray(data === null || data === void 0 ? void 0 : data.facilities) ? data.facilities : [];
                const departments = facilities.map((f) => ({
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
    }),
    listDoctors: (hospitalId, query) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            return yield saasRequest(`/integrations/hospitals/${hospitalId}/doctors`, { query });
        }
        catch (error) {
            // Public hospital detail includes doctors — normalize shape
            if ([401, 403, 404, 503].includes(error === null || error === void 0 ? void 0 : error.status) || !integrationKey()) {
                const hospital = yield saasPublicRequest(`/company/public-hospitals/${hospitalId}`);
                const data = ((_b = (_a = hospital.data) !== null && _a !== void 0 ? _a : hospital.result) !== null && _b !== void 0 ? _b : {});
                const doctors = Array.isArray(data === null || data === void 0 ? void 0 : data.doctors) ? data.doctors : [];
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
    }),
    listAllDoctors: (query) => saasRequest("/integrations/doctors", { query }),
    getDoctor: (doctorId) => saasRequest(`/integrations/doctors/${doctorId}`),
    getAvailability: (doctorId, date) => saasPublicRequest(`/company/public-doctors/${doctorId}/availability`, {
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
