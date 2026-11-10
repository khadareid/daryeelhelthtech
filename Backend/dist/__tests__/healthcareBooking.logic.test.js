"use strict";
/**
 * Pure-logic coverage for healthcare booking guards.
 * Full HTTP/integration tests require configured DATABASE_URL + SAAS keys.
 */
describe("healthcare booking idempotency key", () => {
    function buildKey(userId, doctorId, scheduledAt, clientKey) {
        return ((clientKey && clientKey.trim()) ||
            `ht-${userId}-${doctorId}-${new Date(scheduledAt).toISOString()}`);
    }
    it("uses client key when provided", () => {
        expect(buildKey("u1", "d1", "2026-11-10T09:00:00.000Z", "req-123")).toBe("req-123");
    });
    it("derives stable key from user/doctor/time", () => {
        const a = buildKey("u1", "d1", "2026-11-10T09:00:00.000Z");
        const b = buildKey("u1", "d1", "2026-11-10T09:00:00.000Z");
        expect(a).toBe(b);
        expect(a).toContain("ht-u1-d1-");
    });
});
describe("saas status mapping", () => {
    const AppointmentStatus = {
        PENDING: "PENDING",
        ACCEPTED: "ACCEPTED",
        REJECTED: "REJECTED",
        RESCHEDULE_REQUESTED: "RESCHEDULE_REQUESTED",
        CONFIRMED: "CONFIRMED",
        CHECKED_IN: "CHECKED_IN",
        IN_PROGRESS: "IN_PROGRESS",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
        NO_SHOW: "NO_SHOW",
    };
    function mapSaasStatus(status) {
        const s = String(status || "").toUpperCase();
        if (Object.values(AppointmentStatus).includes(s))
            return s;
        if (s === "CANCELLED_BY_PATIENT" || s === "CANCELLED_BY_HOSPITAL") {
            return AppointmentStatus.CANCELLED;
        }
        if (s === "SCHEDULED")
            return AppointmentStatus.CONFIRMED;
        return AppointmentStatus.PENDING;
    }
    it("maps known statuses", () => {
        expect(mapSaasStatus("ACCEPTED")).toBe("ACCEPTED");
        expect(mapSaasStatus("CONFIRMED")).toBe("CONFIRMED");
    });
    it("maps hospital cancel variants to CANCELLED", () => {
        expect(mapSaasStatus("CANCELLED_BY_HOSPITAL")).toBe("CANCELLED");
    });
    it("defaults unknown to PENDING", () => {
        expect(mapSaasStatus("SOMETHING_ELSE")).toBe("PENDING");
    });
});
describe("consent requirement", () => {
    function requiresConsent(consentGranted, consentId) {
        return !consentGranted && !consentId;
    }
    it("blocks when neither consentGranted nor consentId", () => {
        expect(requiresConsent(false, undefined)).toBe(true);
    });
    it("allows when consentGranted", () => {
        expect(requiresConsent(true)).toBe(false);
    });
    it("allows when consentId present", () => {
        expect(requiresConsent(false, "c1")).toBe(false);
    });
});
