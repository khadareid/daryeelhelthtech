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
exports.saasWebhook = exports.revokeConsent = exports.listConsents = exports.listMyOpdTickets = exports.listHealthcareActivity = exports.submitHealthcareReview = exports.respondHealthcareReschedule = exports.cancelHealthcareAppointment = exports.getHealthcareAppointment = exports.listHealthcareAppointments = exports.createHealthcareAppointment = exports.getHealthcareAvailability = exports.getHealthcareDoctor = exports.listHealthcareDoctors = exports.getHealthcareHospital = exports.listHealthcareHospitals = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const saasClient_1 = require("../lib/saasClient");
function getUserId(req) {
    const user = req.user;
    return (user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null;
}
function makeCode(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2)
        .toString("hex")
        .toUpperCase()}`;
}
function recordActivity(userId, type, title, body, appointmentId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.prisma.healthcareActivityEvent
            .create({
            data: {
                userId,
                type,
                title,
                body: body || null,
                appointmentId: appointmentId || null,
                metadata: (metadata || undefined),
            },
        })
            .catch(() => undefined);
        yield prisma_1.prisma.notification
            .create({
            data: {
                userId,
                title,
                body: body || title,
                type: client_1.NotificationType.APPOINTMENT,
                channel: client_1.NotificationChannel.IN_APP,
                metadata: Object.assign(Object.assign({}, (metadata || {})), { activityType: type, appointmentId }),
            },
        })
            .catch(() => undefined);
    });
}
function mapSaasStatus(status) {
    const s = String(status || "").toUpperCase();
    if (Object.values(client_1.AppointmentStatus).includes(s)) {
        return s;
    }
    return client_1.AppointmentStatus.PENDING;
}
function mapPayment(status) {
    const s = String(status || "UNPAID").toUpperCase();
    if (Object.values(client_1.PaymentStatusMirror).includes(s)) {
        return s;
    }
    return client_1.PaymentStatusMirror.UNPAID;
}
function syncLocalFromSaas(localId, saasAppt) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        return prisma_1.prisma.appointment.update({
            where: { appointmentid: localId },
            data: {
                saasAppointmentId: saasAppt.appointmentId,
                saasTenantId: saasAppt.tenantId,
                saasDoctorId: saasAppt.doctorId,
                saasTicketId: ((_a = saasAppt.opdTicket) === null || _a === void 0 ? void 0 : _a.opdTicketId) || undefined,
                saasTicketNumber: ((_b = saasAppt.opdTicket) === null || _b === void 0 ? void 0 : _b.ticketNumber) || undefined,
                saasVisitId: ((_c = saasAppt.visit) === null || _c === void 0 ? void 0 : _c.visitId) || undefined,
                status: mapSaasStatus(saasAppt.status),
                scheduledAt: new Date(saasAppt.scheduledAt),
                proposedScheduledAt: saasAppt.proposedScheduledAt
                    ? new Date(saasAppt.proposedScheduledAt)
                    : null,
                proposedMessage: saasAppt.proposedMessage || null,
                rejectionReason: saasAppt.rejectionReason || null,
                paymentStatus: mapPayment(saasAppt.paymentStatus),
                confirmedAt: saasAppt.confirmedAt ? new Date(saasAppt.confirmedAt) : null,
                cancelledAt: saasAppt.cancelledAt ? new Date(saasAppt.cancelledAt) : null,
                cancelledReason: saasAppt.cancelledReason || null,
                doctorName: ((_d = saasAppt.doctor) === null || _d === void 0 ? void 0 : _d.name) || undefined,
                facilityName: ((_e = saasAppt.tenant) === null || _e === void 0 ? void 0 : _e.companyName) || undefined,
                specialty: ((_g = (_f = saasAppt.doctor) === null || _f === void 0 ? void 0 : _f.professionalProfile) === null || _g === void 0 ? void 0 : _g.specialization) || undefined,
                department: saasAppt.department || undefined,
            },
        });
    });
}
/** GET /healthcare/hospitals — proxied SaaS directory */
const listHealthcareHospitals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield saasClient_1.saasApi.listHospitals({
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            page: typeof req.query.page === "string" ? req.query.page : undefined,
            limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) ||
                "We couldn't load hospitals right now. Please try again.",
        });
    }
});
exports.listHealthcareHospitals = listHealthcareHospitals;
const getHealthcareHospital = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield saasClient_1.saasApi.getHospital(String(req.params.hospitalId));
        res.status(200).json(result);
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Hospital unavailable",
        });
    }
});
exports.getHealthcareHospital = getHealthcareHospital;
const listHealthcareDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield saasClient_1.saasApi.listDoctors(String(req.params.hospitalId), {
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            specialization: typeof req.query.specialization === "string"
                ? req.query.specialization
                : undefined,
            page: typeof req.query.page === "string" ? req.query.page : undefined,
            limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Doctors unavailable",
        });
    }
});
exports.listHealthcareDoctors = listHealthcareDoctors;
const getHealthcareDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield saasClient_1.saasApi.getDoctor(String(req.params.doctorId));
        res.status(200).json(result);
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Doctor unavailable",
        });
    }
});
exports.getHealthcareDoctor = getHealthcareDoctor;
const getHealthcareAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const result = yield saasClient_1.saasApi.getAvailability(String(req.params.doctorId), date);
        res.status(200).json(result);
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Availability unavailable",
        });
    }
});
exports.getHealthcareAvailability = getHealthcareAvailability;
/**
 * POST /healthcare/appointments
 * Creates local PENDING mirror only after SaaS accepts the request.
 */
const createHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { tenantId, hospitalId, doctorId, facilityId, department, scheduledAt, duration, reason, notes, type, consentId, consentGranted, consultationFee, currency, doctorName, facilityName, specialty, idempotencyKey: clientKey, } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const saasTenantId = String(tenantId || hospitalId || "");
        const saasDoctorId = String(doctorId || "");
        const when = new Date(scheduledAt);
        if (!saasTenantId || !saasDoctorId || Number.isNaN(when.getTime())) {
            res.status(400).json({
                isSuccess: false,
                message: "hospital, doctor and scheduledAt are required",
            });
            return;
        }
        if (!consentGranted && !consentId) {
            res.status(400).json({
                isSuccess: false,
                message: "You must consent to share booking information with the hospital before requesting an appointment",
            });
            return;
        }
        const patient = yield prisma_1.prisma.user.findUnique({
            where: { userid: userId },
            select: {
                userid: true,
                fullName: true,
                email: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
                profile: { select: { healthId: true } },
            },
        });
        if (!(patient === null || patient === void 0 ? void 0 : patient.email)) {
            res.status(400).json({
                isSuccess: false,
                message: "Your profile email is required to book with a hospital",
            });
            return;
        }
        // Ensure / create hospital booking consent
        let consentRecordId = typeof consentId === "string" ? consentId : null;
        if (consentGranted) {
            const consent = yield prisma_1.prisma.consent.create({
                data: {
                    userId,
                    grantedToTenantId: saasTenantId,
                    grantedToTenantName: facilityName ? String(facilityName) : null,
                    scope: "APPOINTMENTS",
                    status: client_1.ConsentStatus.ACTIVE,
                    purpose: "Share booking and contact details for hospital appointment",
                    notes: "Granted during Healthtech appointment request",
                },
            });
            consentRecordId = consent.consentid;
        }
        else if (consentRecordId) {
            const existing = yield prisma_1.prisma.consent.findFirst({
                where: {
                    consentid: consentRecordId,
                    userId,
                    status: client_1.ConsentStatus.ACTIVE,
                },
            });
            if (!existing) {
                res.status(400).json({
                    isSuccess: false,
                    message: "Valid consent is required",
                });
                return;
            }
        }
        const idempotencyKey = (typeof clientKey === "string" && clientKey.trim()) ||
            `ht-${userId}-${saasDoctorId}-${when.toISOString()}`;
        // Idempotent local short-circuit
        const existingLocal = yield prisma_1.prisma.appointment.findFirst({
            where: {
                OR: [
                    { idempotencyKey },
                    {
                        userId,
                        saasDoctorId,
                        scheduledAt: when,
                        status: {
                            in: [
                                client_1.AppointmentStatus.PENDING,
                                client_1.AppointmentStatus.ACCEPTED,
                                client_1.AppointmentStatus.CONFIRMED,
                                client_1.AppointmentStatus.RESCHEDULE_REQUESTED,
                            ],
                        },
                    },
                ],
            },
        });
        if (existingLocal === null || existingLocal === void 0 ? void 0 : existingLocal.saasAppointmentId) {
            res.status(200).json({
                isSuccess: true,
                message: "Existing appointment request",
                result: existingLocal,
                created: false,
            });
            return;
        }
        const externalAppointmentId = makeCode("HT");
        // Create local draft first with PENDING — will delete if SaaS fails
        const local = yield prisma_1.prisma.appointment.create({
            data: {
                userId,
                appointmentCode: makeCode("APT"),
                doctorId: saasDoctorId,
                doctorName: doctorName ? String(doctorName) : "Doctor",
                facilityId: facilityId ? String(facilityId) : saasTenantId,
                facilityName: facilityName ? String(facilityName) : null,
                specialty: specialty ? String(specialty) : null,
                department: department ? String(department) : specialty || null,
                saasTenantId,
                saasDoctorId,
                idempotencyKey,
                scheduledAt: when,
                duration: Number(duration) > 0 ? Number(duration) : 30,
                reason: reason ? String(reason) : null,
                notes: notes ? String(notes) : null,
                status: client_1.AppointmentStatus.PENDING,
                paymentStatus: client_1.PaymentStatusMirror.UNPAID,
                consultationFee: consultationFee !== undefined && consultationFee !== null
                    ? Number(consultationFee)
                    : null,
                currency: currency ? String(currency) : "USD",
                consentId: consentRecordId,
                source: "HEALTHTECH",
            },
        });
        try {
            const saas = yield saasClient_1.saasApi.createAppointment({
                tenantId: saasTenantId,
                doctorId: saasDoctorId,
                facilityId: facilityId || null,
                department: department || specialty || null,
                scheduledAt: when.toISOString(),
                duration: Number(duration) > 0 ? Number(duration) : 30,
                type: type || "IN_PERSON",
                reason: reason || null,
                notes: notes || null,
                healthtechUserId: userId,
                externalAppointmentId: local.appointmentid,
                idempotencyKey,
                patient: {
                    email: patient.email,
                    name: patient.fullName || patient.email,
                    phone: patient.phone,
                    healthId: (_b = patient.profile) === null || _b === void 0 ? void 0 : _b.healthId,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender === "OTHER" ? null : patient.gender,
                },
            }, idempotencyKey);
            const saasAppt = saas.result || saas.data;
            if (!(saasAppt === null || saasAppt === void 0 ? void 0 : saasAppt.appointmentId)) {
                throw Object.assign(new Error("Hospital system did not confirm the booking"), { status: 503 });
            }
            const updated = yield syncLocalFromSaas(local.appointmentid, saasAppt);
            yield recordActivity(userId, "APPOINTMENT_REQUESTED", "Appointment request sent", `Your request with ${updated.doctorName || "the doctor"} was sent to ${updated.facilityName || "the hospital"}.`, updated.appointmentid, { saasAppointmentId: saasAppt.appointmentId });
            res.status(201).json({
                isSuccess: true,
                message: "Appointment request submitted. The hospital will respond shortly.",
                result: updated,
                created: Boolean(saas.created !== false),
            });
        }
        catch (error) {
            // Do not leave a fake confirmed booking — remove unconfirmed local draft
            yield prisma_1.prisma.appointment
                .delete({ where: { appointmentid: local.appointmentid } })
                .catch(() => undefined);
            res.status((error === null || error === void 0 ? void 0 : error.status) || 503).json({
                isSuccess: false,
                message: (error === null || error === void 0 ? void 0 : error.message) ||
                    "We couldn't complete your appointment request right now. Your request was not confirmed. Please try again.",
            });
        }
    }
    catch (error) {
        console.error("createHealthcareAppointment", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to create appointment request",
        });
    }
});
exports.createHealthcareAppointment = createHealthcareAppointment;
const listHealthcareAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        // Prefer local mirrors; optionally refresh from SaaS
        const local = yield prisma_1.prisma.appointment.findMany({
            where: { userId, source: "HEALTHTECH" },
            orderBy: { scheduledAt: "desc" },
            take: 100,
            include: { doctorReview: true },
        });
        try {
            const remote = yield saasClient_1.saasApi.listAppointments(userId);
            const rows = (remote.result || remote.data || []);
            for (const saasAppt of rows) {
                const match = local.find((l) => l.saasAppointmentId === saasAppt.appointmentId ||
                    l.appointmentid === saasAppt.externalAppointmentId);
                if (match) {
                    yield syncLocalFromSaas(match.appointmentid, saasAppt);
                }
            }
        }
        catch (_a) {
            // offline SaaS — return local mirrors
        }
        const refreshed = yield prisma_1.prisma.appointment.findMany({
            where: { userId, source: "HEALTHTECH" },
            orderBy: { scheduledAt: "desc" },
            take: 100,
            include: { doctorReview: true },
        });
        res.status(200).json({ isSuccess: true, result: refreshed, data: refreshed });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to list appointments",
        });
    }
});
exports.listHealthcareAppointments = listHealthcareAppointments;
const getHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id);
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: {
                userId,
                OR: [{ appointmentid: id }, { saasAppointmentId: id }],
            },
            include: { doctorReview: true },
        });
        if (!local) {
            res.status(404).json({ isSuccess: false, message: "Appointment not found" });
            return;
        }
        if (local.saasAppointmentId) {
            try {
                const remote = yield saasClient_1.saasApi.getAppointment(local.saasAppointmentId);
                const saasAppt = remote.result || remote.data;
                if (saasAppt) {
                    const updated = yield syncLocalFromSaas(local.appointmentid, saasAppt);
                    res.status(200).json({
                        isSuccess: true,
                        result: Object.assign(Object.assign({}, updated), { saas: saasAppt }),
                        data: Object.assign(Object.assign({}, updated), { saas: saasAppt }),
                    });
                    return;
                }
            }
            catch (_a) {
                /* use local */
            }
        }
        res.status(200).json({ isSuccess: true, result: local, data: local });
    }
    catch (error) {
        res.status(500).json({ isSuccess: false, message: "Failed to load appointment" });
    }
});
exports.getHealthcareAppointment = getHealthcareAppointment;
const cancelHealthcareAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { appointmentid: String(req.params.id), userId },
        });
        if (!(local === null || local === void 0 ? void 0 : local.saasAppointmentId)) {
            res.status(404).json({ isSuccess: false, message: "Appointment not found" });
            return;
        }
        const saas = yield saasClient_1.saasApi.cancelAppointment(local.saasAppointmentId, {
            healthtechUserId: userId,
            reason: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) || null,
        });
        const saasAppt = saas.result || saas.data;
        const updated = yield syncLocalFromSaas(local.appointmentid, saasAppt);
        yield recordActivity(userId, "APPOINTMENT_CANCELLED", "Appointment cancelled", "You cancelled this appointment request.", local.appointmentid);
        res.status(200).json({
            isSuccess: true,
            message: "Appointment cancelled",
            result: updated,
        });
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to cancel appointment",
        });
    }
});
exports.cancelHealthcareAppointment = cancelHealthcareAppointment;
const respondHealthcareReschedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { appointmentid: String(req.params.id), userId },
        });
        if (!(local === null || local === void 0 ? void 0 : local.saasAppointmentId)) {
            res.status(404).json({ isSuccess: false, message: "Appointment not found" });
            return;
        }
        const accept = Boolean((_a = req.body) === null || _a === void 0 ? void 0 : _a.accept);
        const saas = yield saasClient_1.saasApi.respondReschedule(local.saasAppointmentId, {
            healthtechUserId: userId,
            accept,
        });
        const saasAppt = saas.result || saas.data;
        const updated = yield syncLocalFromSaas(local.appointmentid, saasAppt);
        yield recordActivity(userId, accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED", accept ? "New appointment time accepted" : "Proposed time declined", accept
            ? "Your appointment is confirmed for the new time."
            : "You declined the hospital's proposed time.", local.appointmentid);
        res.status(200).json({
            isSuccess: true,
            message: accept ? "New time accepted" : "Proposal declined",
            result: updated,
        });
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to respond",
        });
    }
});
exports.respondHealthcareReschedule = respondHealthcareReschedule;
const submitHealthcareReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { appointmentid: String(req.params.id), userId },
            include: { doctorReview: true },
        });
        if (!(local === null || local === void 0 ? void 0 : local.saasAppointmentId)) {
            res.status(404).json({ isSuccess: false, message: "Appointment not found" });
            return;
        }
        if (local.status !== client_1.AppointmentStatus.COMPLETED) {
            res.status(400).json({
                isSuccess: false,
                message: "You can only review after a completed visit",
            });
            return;
        }
        if (local.doctorReview) {
            res.status(409).json({
                isSuccess: false,
                message: "You already reviewed this visit",
            });
            return;
        }
        const rating = Number((_a = req.body) === null || _a === void 0 ? void 0 : _a.rating);
        if (rating < 1 || rating > 5) {
            res.status(400).json({
                isSuccess: false,
                message: "Rating must be between 1 and 5",
            });
            return;
        }
        const saas = yield saasClient_1.saasApi.submitReview(local.saasAppointmentId, {
            healthtechUserId: userId,
            rating,
            comment: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.comment) || null,
            professionalism: (_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.professionalism) !== null && _d !== void 0 ? _d : null,
            communication: (_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.communication) !== null && _f !== void 0 ? _f : null,
            waitingTime: (_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.waitingTime) !== null && _h !== void 0 ? _h : null,
            careQuality: (_k = (_j = req.body) === null || _j === void 0 ? void 0 : _j.careQuality) !== null && _k !== void 0 ? _k : null,
            overallExperience: (_m = (_l = req.body) === null || _l === void 0 ? void 0 : _l.overallExperience) !== null && _m !== void 0 ? _m : null,
        });
        const review = yield prisma_1.prisma.doctorReview.create({
            data: {
                appointmentId: local.appointmentid,
                userId,
                saasDoctorId: local.saasDoctorId || local.doctorId || "",
                saasTenantId: local.saasTenantId,
                saasReviewId: ((_o = (saas.result || saas.data)) === null || _o === void 0 ? void 0 : _o.reviewId) || null,
                rating,
                comment: ((_p = req.body) === null || _p === void 0 ? void 0 : _p.comment) || null,
                professionalism: (_r = (_q = req.body) === null || _q === void 0 ? void 0 : _q.professionalism) !== null && _r !== void 0 ? _r : null,
                communication: (_t = (_s = req.body) === null || _s === void 0 ? void 0 : _s.communication) !== null && _t !== void 0 ? _t : null,
                waitingTime: (_v = (_u = req.body) === null || _u === void 0 ? void 0 : _u.waitingTime) !== null && _v !== void 0 ? _v : null,
                careQuality: (_x = (_w = req.body) === null || _w === void 0 ? void 0 : _w.careQuality) !== null && _x !== void 0 ? _x : null,
                overallExperience: (_z = (_y = req.body) === null || _y === void 0 ? void 0 : _y.overallExperience) !== null && _z !== void 0 ? _z : null,
            },
        });
        yield recordActivity(userId, "REVIEW_SUBMITTED", "Doctor review submitted", `You rated ${local.doctorName || "the doctor"} ${rating}/5.`, local.appointmentid);
        res.status(201).json({
            isSuccess: true,
            message: "Review submitted",
            result: review,
        });
    }
    catch (error) {
        res.status((error === null || error === void 0 ? void 0 : error.status) || 500).json({
            isSuccess: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to submit review",
        });
    }
});
exports.submitHealthcareReview = submitHealthcareReview;
const listHealthcareActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const events = yield prisma_1.prisma.healthcareActivityEvent.findMany({
            where: { userId },
            orderBy: { occurredAt: "desc" },
            take: 100,
        });
        res.status(200).json({ isSuccess: true, result: events, data: events });
    }
    catch (_a) {
        res.status(500).json({ isSuccess: false, message: "Failed to load activity" });
    }
});
exports.listHealthcareActivity = listHealthcareActivity;
const listMyOpdTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const tickets = yield prisma_1.prisma.appointment.findMany({
            where: {
                userId,
                saasTicketNumber: { not: null },
            },
            orderBy: { scheduledAt: "desc" },
            take: 50,
            select: {
                appointmentid: true,
                appointmentCode: true,
                saasTicketId: true,
                saasTicketNumber: true,
                saasAppointmentId: true,
                doctorName: true,
                facilityName: true,
                department: true,
                specialty: true,
                scheduledAt: true,
                status: true,
                paymentStatus: true,
            },
        });
        res.status(200).json({ isSuccess: true, result: tickets, data: tickets });
    }
    catch (_a) {
        res.status(500).json({ isSuccess: false, message: "Failed to load tickets" });
    }
});
exports.listMyOpdTickets = listMyOpdTickets;
const listConsents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const consents = yield prisma_1.prisma.consent.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        res.status(200).json({ isSuccess: true, result: consents, data: consents });
    }
    catch (_a) {
        res.status(500).json({ isSuccess: false, message: "Failed to load consents" });
    }
});
exports.listConsents = listConsents;
const revokeConsent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const consent = yield prisma_1.prisma.consent.findFirst({
            where: { consentid: String(req.params.id), userId },
        });
        if (!consent) {
            res.status(404).json({ isSuccess: false, message: "Consent not found" });
            return;
        }
        const updated = yield prisma_1.prisma.consent.update({
            where: { consentid: consent.consentid },
            data: {
                status: client_1.ConsentStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) || "Revoked by patient",
            },
        });
        res.status(200).json({
            isSuccess: true,
            message: "Consent revoked. Future sharing that depends on this permission is blocked. Historical hospital records already disclosed are not recalled.",
            result: updated,
        });
    }
    catch (_b) {
        res.status(500).json({ isSuccess: false, message: "Failed to revoke consent" });
    }
});
exports.revokeConsent = revokeConsent;
/**
 * POST /healthcare/webhooks/saas
 * Inbound events from SaaS (OPD issued, accepted, etc.)
 */
const saasWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const secret = process.env.SAAS_WEBHOOK_SECRET || "";
        const header = req.header("x-daryeel-webhook-secret") || "";
        if (!secret || header !== secret) {
            res.status(401).json({ isSuccess: false, message: "Unauthorized webhook" });
            return;
        }
        const type = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.type) || "");
        const externalAppointmentId = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.externalAppointmentId) || ((_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.payload) === null || _d === void 0 ? void 0 : _d.externalAppointmentId) || "");
        const saasAppointmentId = String(((_e = req.body) === null || _e === void 0 ? void 0 : _e.appointmentId) || ((_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.payload) === null || _g === void 0 ? void 0 : _g.appointmentId) || "");
        const healthtechUserId = String(((_h = req.body) === null || _h === void 0 ? void 0 : _h.healthtechUserId) || ((_k = (_j = req.body) === null || _j === void 0 ? void 0 : _j.payload) === null || _k === void 0 ? void 0 : _k.healthtechUserId) || "");
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: {
                OR: [
                    ...(externalAppointmentId
                        ? [{ appointmentid: externalAppointmentId }]
                        : []),
                    ...(saasAppointmentId
                        ? [{ saasAppointmentId }]
                        : []),
                ],
            },
        });
        if (!local) {
            res.status(202).json({ isSuccess: true, message: "No local appointment" });
            return;
        }
        if (local.saasAppointmentId || saasAppointmentId) {
            try {
                const remote = yield saasClient_1.saasApi.getAppointment(local.saasAppointmentId || saasAppointmentId);
                const saasAppt = remote.result || remote.data;
                if (saasAppt)
                    yield syncLocalFromSaas(local.appointmentid, saasAppt);
            }
            catch (_m) {
                /* ignore sync failure */
            }
        }
        const titles = {
            APPOINTMENT_ACCEPTED: "Appointment accepted",
            APPOINTMENT_REJECTED: "Appointment rejected",
            RESCHEDULE_REQUESTED: "New time suggested",
            OPD_TICKET_GENERATED: "OPD ticket issued",
            PATIENT_CHECKED_IN: "Checked in at hospital",
            VISIT_COMPLETED: "Visit completed",
            PAYMENT_STATUS_CHANGED: "Payment status updated",
        };
        yield recordActivity(healthtechUserId || local.userId, type || "SAAS_EVENT", titles[type] || "Appointment update", ((_l = req.body) === null || _l === void 0 ? void 0 : _l.message) || titles[type] || "Your healthcare booking was updated.", local.appointmentid, req.body);
        res.status(200).json({ isSuccess: true });
    }
    catch (error) {
        console.error("saasWebhook", error);
        res.status(500).json({ isSuccess: false, message: "Webhook failed" });
    }
});
exports.saasWebhook = saasWebhook;
