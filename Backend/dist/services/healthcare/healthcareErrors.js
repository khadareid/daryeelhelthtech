"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareError = exports.HealthcareErrorCodes = void 0;
exports.sendHealthcareError = sendHealthcareError;
exports.sendHealthcareSuccess = sendHealthcareSuccess;
exports.HealthcareErrorCodes = {
    HOSPITAL_NOT_FOUND: "HOSPITAL_NOT_FOUND",
    DOCTOR_NOT_FOUND: "DOCTOR_NOT_FOUND",
    SLOT_NOT_AVAILABLE: "SLOT_NOT_AVAILABLE",
    BOOKING_ALREADY_EXISTS: "BOOKING_ALREADY_EXISTS",
    CONSENT_REQUIRED: "CONSENT_REQUIRED",
    INVALID_INTEGRATION_KEY: "INVALID_INTEGRATION_KEY",
    SAAS_UNAVAILABLE: "SAAS_UNAVAILABLE",
    BOOKING_FAILED: "BOOKING_FAILED",
    APPOINTMENT_NOT_FOUND: "APPOINTMENT_NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
};
class HealthcareError extends Error {
    constructor(message, status = 400, code = exports.HealthcareErrorCodes.VALIDATION_ERROR) {
        super(message);
        this.name = "HealthcareError";
        this.status = status;
        this.code = code;
    }
}
exports.HealthcareError = HealthcareError;
function sendHealthcareError(res, error, fallback) {
    if (error instanceof HealthcareError) {
        return res.status(error.status).json({
            success: false,
            isSuccess: false,
            message: error.message,
            code: error.code,
        });
    }
    const status = (error === null || error === void 0 ? void 0 : error.status) || 500;
    const code = (error === null || error === void 0 ? void 0 : error.code) ||
        (status === 503
            ? exports.HealthcareErrorCodes.SAAS_UNAVAILABLE
            : exports.HealthcareErrorCodes.BOOKING_FAILED);
    // Never leak Prisma / internal details
    const message = status >= 500 && process.env.NODE_ENV === "production"
        ? fallback
        : (error === null || error === void 0 ? void 0 : error.message) || fallback;
    return res.status(status >= 500 ? (status === 503 ? 503 : 500) : status).json({
        success: false,
        isSuccess: false,
        message,
        code,
    });
}
function sendHealthcareSuccess(res, data, message = "OK", status = 200, extra = {}) {
    return res.status(status).json(Object.assign({ success: true, isSuccess: true, message,
        data, result: data }, extra));
}
