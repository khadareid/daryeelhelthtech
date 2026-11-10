"use strict";
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
exports.saasWebhook = exports.revokeConsent = exports.listConsents = exports.listHealthcareActivity = exports.listMyOpdTickets = exports.respondHealthcareReschedule = exports.requestHealthcareAppointmentReschedule = exports.cancelHealthcareAppointment = exports.getHealthcareAppointment = exports.listHealthcareAppointments = exports.createHealthcareAppointment = exports.getHealthcareAvailability = exports.getHealthcareDoctor = exports.listHealthcareDoctors = exports.listHealthcareHospitalDoctors = exports.listHealthcareDepartments = exports.getHealthcareHospital = exports.listHealthcareHospitals = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const healthcareBooking_service_1 = require("../services/healthcare/healthcareBooking.service");
const saasIntegration_service_1 = require("../services/healthcare/saasIntegration.service");
const healthcareErrors_1 = require("../services/healthcare/healthcareErrors");
function getUserId(req) {
    const user = req.user;
    return (user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null;
}
/** GET /healthcare/hospitals */
const listHealthcareHospitals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const result = yield saasIntegration_service_1.SaasIntegrationService.searchHospitals({
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            city: typeof req.query.city === "string" ? req.query.city : undefined,
            department: typeof req.query.department === "string" ? req.query.department : undefined,
            availableToday: typeof req.query.availableToday === "string"
                ? req.query.availableToday
                : undefined,
            availableThisWeek: typeof req.query.availableThisWeek === "string"
                ? req.query.availableThisWeek
                : undefined,
            page: typeof req.query.page === "string" ? req.query.page : undefined,
            limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_b = (_a = result.data) !== null && _a !== void 0 ? _a : result.result) !== null && _b !== void 0 ? _b : [], "Hospitals loaded", 200, { pagination: result.pagination });
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "We couldn't load hospitals right now.");
    }
});
exports.listHealthcareHospitals = listHealthcareHospitals;
/** GET /healthcare/hospitals/:hospitalId */
const getHealthcareHospital = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield saasIntegration_service_1.SaasIntegrationService.getHospital(String(req.params.hospitalId));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_a = result.data) !== null && _a !== void 0 ? _a : result.result, "Hospital loaded");
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Hospital not found", 404, healthcareErrors_1.HealthcareErrorCodes.HOSPITAL_NOT_FOUND), "Hospital not found");
        }
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Hospital unavailable");
    }
});
exports.getHealthcareHospital = getHealthcareHospital;
/** GET /healthcare/hospitals/:hospitalId/departments */
const listHealthcareDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const result = yield saasIntegration_service_1.SaasIntegrationService.listDepartments(String(req.params.hospitalId));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_b = (_a = result.data) !== null && _a !== void 0 ? _a : result.result) !== null && _b !== void 0 ? _b : [], "Departments loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Departments unavailable");
    }
});
exports.listHealthcareDepartments = listHealthcareDepartments;
/** GET /healthcare/hospitals/:hospitalId/doctors */
const listHealthcareHospitalDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const result = yield saasIntegration_service_1.SaasIntegrationService.listHospitalDoctors(String(req.params.hospitalId), {
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            specialization: typeof req.query.specialization === "string"
                ? req.query.specialization
                : typeof req.query.specialty === "string"
                    ? req.query.specialty
                    : undefined,
            department: typeof req.query.department === "string"
                ? req.query.department
                : undefined,
            page: typeof req.query.page === "string" ? req.query.page : undefined,
            limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_b = (_a = result.data) !== null && _a !== void 0 ? _a : result.result) !== null && _b !== void 0 ? _b : [], "Doctors loaded", 200, { pagination: result.pagination });
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Doctors unavailable");
    }
});
exports.listHealthcareHospitalDoctors = listHealthcareHospitalDoctors;
/** GET /healthcare/doctors â€” cross-hospital search */
const listHealthcareDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const hospitalId = typeof req.query.hospitalId === "string" ? req.query.hospitalId : undefined;
        const query = {
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            specialization: typeof req.query.specialization === "string"
                ? req.query.specialization
                : typeof req.query.specialty === "string"
                    ? req.query.specialty
                    : undefined,
            department: typeof req.query.department === "string" ? req.query.department : undefined,
            city: typeof req.query.city === "string" ? req.query.city : undefined,
            hospitalId,
            page: typeof req.query.page === "string" ? req.query.page : undefined,
            limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        };
        const result = hospitalId
            ? yield saasIntegration_service_1.SaasIntegrationService.listHospitalDoctors(hospitalId, query)
            : yield saasIntegration_service_1.SaasIntegrationService.searchDoctors(query);
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_b = (_a = result.data) !== null && _a !== void 0 ? _a : result.result) !== null && _b !== void 0 ? _b : [], "Doctors loaded", 200, { pagination: result.pagination });
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Doctors unavailable");
    }
});
exports.listHealthcareDoctors = listHealthcareDoctors;
const getHealthcareDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield saasIntegration_service_1.SaasIntegrationService.getDoctor(String(req.params.doctorId));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_a = result.data) !== null && _a !== void 0 ? _a : result.result, "Doctor loaded");
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Doctor not found", 404, healthcareErrors_1.HealthcareErrorCodes.DOCTOR_NOT_FOUND), "Doctor not found");
        }
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Doctor unavailable");
    }
});
exports.getHealthcareDoctor = getHealthcareDoctor;
const getHealthcareAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const result = yield saasIntegration_service_1.SaasIntegrationService.getDoctorAvailability(String(req.params.doctorId), date);
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, (_a = result.data) !== null && _a !== void 0 ? _a : result.result, "Availability loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Availability unavailable");
    }
});
exports.getHealthcareAvailability = getHealthcareAvailability;
const createHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const { appointment, created } = yield (0, healthcareBooking_service_1.createHealthcareBooking)({
            userId,
            tenantId: body.tenantId,
            hospitalId: body.hospitalId,
            doctorId: body.doctorId,
            facilityId: body.facilityId,
            departmentId: body.departmentId,
            department: body.department,
            scheduledAt: body.scheduledAt,
            duration: body.duration,
            reason: body.reason,
            notes: body.notes,
            type: body.type,
            consentId: body.consentId,
            consentGranted: body.consentGranted,
            consultationFee: body.consultationFee,
            currency: body.currency,
            doctorName: body.doctorName,
            facilityName: body.facilityName,
            specialty: body.specialty,
            idempotencyKey: body.idempotencyKey,
            externalRequestId: body.externalRequestId,
        });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, appointment, created
            ? "Appointment requested successfully"
            : "Existing appointment request", created ? 201 : 200, { created });
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to create appointment request");
    }
});
exports.createHealthcareAppointment = createHealthcareAppointment;
const listHealthcareAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const rows = yield (0, healthcareBooking_service_1.listHealthcareBookings)(userId);
        const status = typeof req.query.status === "string"
            ? req.query.status.toUpperCase()
            : undefined;
        const filtered = status
            ? rows.filter((r) => r.status === status)
            : rows;
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, filtered, "Appointments loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to list appointments");
    }
});
exports.listHealthcareAppointments = listHealthcareAppointments;
const getHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const row = yield (0, healthcareBooking_service_1.getHealthcareBooking)(userId, String(req.params.id));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, row, "Appointment loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to load appointment");
    }
});
exports.getHealthcareAppointment = getHealthcareAppointment;
const cancelHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const updated = yield (0, healthcareBooking_service_1.cancelHealthcareBooking)(userId, String(req.params.id), (_a = req.body) === null || _a === void 0 ? void 0 : _a.reason);
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, updated, "Appointment cancelled");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to cancel appointment");
    }
});
exports.cancelHealthcareAppointment = cancelHealthcareAppointment;
const requestHealthcareAppointmentReschedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const proposed = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.proposedScheduledAt) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.scheduledAt);
        if (!proposed) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("proposedScheduledAt is required", 400, healthcareErrors_1.HealthcareErrorCodes.VALIDATION_ERROR), "proposedScheduledAt is required");
        }
        const updated = yield (0, healthcareBooking_service_1.requestHealthcareReschedule)(userId, String(req.params.id), String(proposed), (_c = req.body) === null || _c === void 0 ? void 0 : _c.message);
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, updated, "Reschedule requested");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to request reschedule");
    }
});
exports.requestHealthcareAppointmentReschedule = requestHealthcareAppointmentReschedule;
const respondHealthcareReschedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const updated = yield (0, healthcareBooking_service_1.respondHealthcareReschedule)(userId, String(req.params.id), Boolean((_a = req.body) === null || _a === void 0 ? void 0 : _a.accept));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, updated, ((_b = req.body) === null || _b === void 0 ? void 0 : _b.accept) ? "New time accepted" : "Proposal declined");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to respond");
    }
});
exports.respondHealthcareReschedule = respondHealthcareReschedule;
const listMyOpdTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const rows = yield (0, healthcareBooking_service_1.listHealthcareBookings)(userId);
        const tickets = rows
            .filter((r) => r.externalTicketNumber || r.externalTicketId)
            .map((r) => ({
            ticketId: r.externalTicketId,
            ticketNumber: r.externalTicketNumber,
            appointmentId: r.id,
            externalAppointmentId: r.externalAppointmentId,
            hospital: r.facilityName,
            doctor: r.doctorName,
            department: r.department,
            scheduledAt: r.scheduledAt,
            status: r.status,
        }));
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, tickets, "OPD tickets loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to load OPD tickets");
    }
});
exports.listMyOpdTickets = listMyOpdTickets;
const listHealthcareActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const events = yield prisma_1.prisma.healthcareActivityEvent.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, events, "Activity loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to load activity");
    }
});
exports.listHealthcareActivity = listHealthcareActivity;
const listConsents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const consents = yield prisma_1.prisma.consent.findMany({
            where: { userId, appointments: true },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, consents, "Consents loaded");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to load consents");
    }
});
exports.listConsents = listConsents;
const revokeConsent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Sign in required", 401, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED), "Sign in required");
        }
        const consent = yield prisma_1.prisma.consent.findFirst({
            where: { id: String(req.params.id), userId },
        });
        if (!consent) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Consent not found", 404), "Consent not found");
        }
        const updated = yield prisma_1.prisma.consent.update({
            where: { id: consent.id },
            data: {
                status: client_1.ConsentStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) || "Revoked by patient",
            },
        });
        yield (0, healthcareBooking_service_1.recordHealthcareActivity)(userId, "CONSENT_REVOKED", "Hospital consent revoked", "Future bookings with this hospital will require new consent.", null, { consentId: consent.id, hospitalId: consent.hospitalId });
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, updated, "Consent revoked");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Failed to revoke consent");
    }
});
exports.revokeConsent = revokeConsent;
/** POST /healthcare/webhooks/saas */
const saasWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const secret = process.env.SAAS_WEBHOOK_SECRET || "";
        const provided = req.headers["x-daryeel-webhook-secret"] ||
            req.headers["x-webhook-secret"] ||
            "";
        if (!secret || provided !== secret) {
            return (0, healthcareErrors_1.sendHealthcareError)(res, new healthcareErrors_1.HealthcareError("Invalid webhook secret", 401, healthcareErrors_1.HealthcareErrorCodes.INVALID_INTEGRATION_KEY), "Unauthorized");
        }
        const updated = yield (0, healthcareBooking_service_1.applySaasWebhook)(req.body || {});
        return (0, healthcareErrors_1.sendHealthcareSuccess)(res, updated || { received: true }, "Webhook processed");
    }
    catch (error) {
        return (0, healthcareErrors_1.sendHealthcareError)(res, error, "Webhook failed");
    }
});
exports.saasWebhook = saasWebhook;
