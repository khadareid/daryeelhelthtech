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
exports.recordHealthcareActivity = recordHealthcareActivity;
exports.syncLocalFromSaas = syncLocalFromSaas;
exports.createHealthcareBooking = createHealthcareBooking;
exports.listHealthcareBookings = listHealthcareBookings;
exports.getHealthcareBooking = getHealthcareBooking;
exports.cancelHealthcareBooking = cancelHealthcareBooking;
exports.requestHealthcareReschedule = requestHealthcareReschedule;
exports.respondHealthcareReschedule = respondHealthcareReschedule;
exports.applySaasWebhook = applySaasWebhook;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_1 = require("../../lib/prisma");
const saasIntegration_service_1 = require("./saasIntegration.service");
const healthcareErrors_1 = require("./healthcareErrors");
function makeCode(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2)
        .toString("hex")
        .toUpperCase()}`;
}
function mapSaasStatus(status) {
    const s = String(status || "").toUpperCase();
    if (Object.values(client_1.AppointmentStatus).includes(s)) {
        return s;
    }
    if (s === "CANCELLED_BY_PATIENT" || s === "CANCELLED_BY_HOSPITAL") {
        return client_1.AppointmentStatus.CANCELLED;
    }
    if (s === "SCHEDULED")
        return client_1.AppointmentStatus.CONFIRMED;
    return client_1.AppointmentStatus.PENDING;
}
function mapHospitalPayment(status) {
    const s = String(status || "UNPAID").toUpperCase();
    if (Object.values(client_1.HospitalPaymentStatus).includes(s)) {
        return s;
    }
    return client_1.HospitalPaymentStatus.UNPAID;
}
function recordHealthcareActivity(userId, type, title, body, appointmentId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const safeMeta = metadata
            ? Object.fromEntries(Object.entries(metadata).filter(([k]) => !/password|token|secret|key|authorization|medical/i.test(k)))
            : undefined;
        yield prisma_1.prisma.healthcareActivityEvent
            .create({
            data: {
                userId,
                type,
                title,
                body: body || null,
                appointmentId: appointmentId || null,
                metadata: (safeMeta || undefined),
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
                data: Object.assign(Object.assign({}, (safeMeta || {})), { activityType: type, appointmentId }),
            },
        })
            .catch(() => undefined);
    });
}
function syncLocalFromSaas(localId, saasAppt) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        return prisma_1.prisma.appointment.update({
            where: { id: localId },
            data: {
                externalAppointmentId: saasAppt.appointmentId || undefined,
                externalHospitalId: saasAppt.tenantId || undefined,
                externalDoctorId: saasAppt.doctorId || undefined,
                externalFacilityId: saasAppt.facilityId || undefined,
                externalTicketId: ((_a = saasAppt.opdTicket) === null || _a === void 0 ? void 0 : _a.opdTicketId) || undefined,
                externalTicketNumber: ((_b = saasAppt.opdTicket) === null || _b === void 0 ? void 0 : _b.ticketNumber) || undefined,
                externalVisitId: ((_c = saasAppt.visit) === null || _c === void 0 ? void 0 : _c.visitId) || undefined,
                status: mapSaasStatus(saasAppt.status),
                scheduledAt: new Date(saasAppt.scheduledAt),
                proposedScheduledAt: saasAppt.proposedScheduledAt
                    ? new Date(saasAppt.proposedScheduledAt)
                    : null,
                proposedMessage: saasAppt.proposedMessage || null,
                rejectionReason: saasAppt.rejectionReason || null,
                hospitalPaymentStatus: mapHospitalPayment(saasAppt.paymentStatus),
                confirmedAt: saasAppt.confirmedAt ? new Date(saasAppt.confirmedAt) : null,
                cancelledAt: saasAppt.cancelledAt ? new Date(saasAppt.cancelledAt) : null,
                cancellationReason: saasAppt.cancelledReason || null,
                doctorName: ((_d = saasAppt.doctor) === null || _d === void 0 ? void 0 : _d.name) || undefined,
                facilityName: ((_e = saasAppt.tenant) === null || _e === void 0 ? void 0 : _e.companyName) || undefined,
                specialty: ((_g = (_f = saasAppt.doctor) === null || _f === void 0 ? void 0 : _f.professionalProfile) === null || _g === void 0 ? void 0 : _g.specialization) || undefined,
                department: saasAppt.department || undefined,
            },
        });
    });
}
function ensureBookingConsent(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input.consentGranted && !input.consentId) {
            throw new healthcareErrors_1.HealthcareError("You must consent to share booking information with the hospital before requesting an appointment", 400, healthcareErrors_1.HealthcareErrorCodes.CONSENT_REQUIRED);
        }
        if (input.consentGranted) {
            const consent = yield prisma_1.prisma.consent.create({
                data: {
                    userId: input.userId,
                    hospitalId: input.hospitalId,
                    hospitalName: input.hospitalName || null,
                    doctorId: input.doctorId || null,
                    accessLevel: client_1.AccessLevel.VIEW,
                    status: client_1.ConsentStatus.APPROVED,
                    appointments: true,
                    grantedAt: new Date(),
                    purpose: "Share booking and contact details for hospital appointment",
                    notes: "Granted during Healthtech appointment request",
                },
            });
            return consent.id;
        }
        const existing = yield prisma_1.prisma.consent.findFirst({
            where: {
                id: String(input.consentId),
                userId: input.userId,
                status: client_1.ConsentStatus.APPROVED,
                appointments: true,
            },
        });
        if (!existing) {
            throw new healthcareErrors_1.HealthcareError("Valid consent is required", 400, healthcareErrors_1.HealthcareErrorCodes.CONSENT_REQUIRED);
        }
        return existing.id;
    });
}
function createHealthcareBooking(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const saasTenantId = String(input.tenantId || input.hospitalId || "");
        const saasDoctorId = String(input.doctorId || "");
        const when = new Date(input.scheduledAt);
        if (!saasTenantId || !saasDoctorId || Number.isNaN(when.getTime())) {
            throw new healthcareErrors_1.HealthcareError("hospital, doctor and scheduledAt are required", 400, healthcareErrors_1.HealthcareErrorCodes.VALIDATION_ERROR);
        }
        // Validate hospital + doctor against SaaS (do not trust frontend IDs)
        let hospital;
        let doctor;
        try {
            const hospitalRes = yield saasIntegration_service_1.SaasIntegrationService.getHospital(saasTenantId);
            hospital = (_a = hospitalRes.data) !== null && _a !== void 0 ? _a : hospitalRes.result;
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
                throw new healthcareErrors_1.HealthcareError("Hospital not found", 404, healthcareErrors_1.HealthcareErrorCodes.HOSPITAL_NOT_FOUND);
            }
            throw error;
        }
        try {
            const doctorRes = yield saasIntegration_service_1.SaasIntegrationService.getDoctor(saasDoctorId);
            doctor = (_b = doctorRes.data) !== null && _b !== void 0 ? _b : doctorRes.result;
        }
        catch (error) {
            // Fallback: resolve doctor from public hospital detail (no integration key)
            const fromHospital = Array.isArray(hospital === null || hospital === void 0 ? void 0 : hospital.doctors)
                ? hospital.doctors.find((d) => String((d === null || d === void 0 ? void 0 : d.doctorId) || (d === null || d === void 0 ? void 0 : d.userId) || (d === null || d === void 0 ? void 0 : d.id) || "") === saasDoctorId)
                : null;
            if (fromHospital) {
                doctor = fromHospital;
            }
            else if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
                throw new healthcareErrors_1.HealthcareError("Doctor not found", 404, healthcareErrors_1.HealthcareErrorCodes.DOCTOR_NOT_FOUND);
            }
            else {
                throw error;
            }
        }
        const doctorTenantId = String((doctor === null || doctor === void 0 ? void 0 : doctor.tenantId) || (doctor === null || doctor === void 0 ? void 0 : doctor.hospitalId) || ((_c = doctor === null || doctor === void 0 ? void 0 : doctor.tenant) === null || _c === void 0 ? void 0 : _c.tenantId) || "");
        if (doctorTenantId && doctorTenantId !== saasTenantId) {
            throw new healthcareErrors_1.HealthcareError("Doctor does not belong to the selected hospital", 400, healthcareErrors_1.HealthcareErrorCodes.VALIDATION_ERROR);
        }
        // Soft availability check when date provided
        try {
            const date = when.toISOString().slice(0, 10);
            const availRes = yield saasIntegration_service_1.SaasIntegrationService.getDoctorAvailability(saasDoctorId, date);
            const avail = (_d = availRes.data) !== null && _d !== void 0 ? _d : availRes.result;
            const slots = Array.isArray(avail === null || avail === void 0 ? void 0 : avail.slots)
                ? avail.slots
                : Array.isArray(avail)
                    ? avail
                    : [];
            if (slots.length > 0) {
                const target = when.toISOString();
                const ok = slots.some((slot) => {
                    const start = typeof slot === "string"
                        ? slot
                        : (slot === null || slot === void 0 ? void 0 : slot.start) || (slot === null || slot === void 0 ? void 0 : slot.scheduledAt) || (slot === null || slot === void 0 ? void 0 : slot.time);
                    if (!start)
                        return false;
                    return new Date(start).toISOString() === target || start === target;
                });
                // If slots use local times without Z, compare by HH:mm
                const hhmm = when.toISOString().slice(11, 16);
                const okLoose = slots.some((slot) => {
                    const start = typeof slot === "string"
                        ? slot
                        : (slot === null || slot === void 0 ? void 0 : slot.start) || (slot === null || slot === void 0 ? void 0 : slot.time) || (slot === null || slot === void 0 ? void 0 : slot.label);
                    return String(start).includes(hhmm);
                });
                if (!ok && !okLoose && (avail === null || avail === void 0 ? void 0 : avail.available) !== false) {
                    // Only hard-fail when SaaS explicitly marks unavailable / empty availableSlots
                    if ((avail === null || avail === void 0 ? void 0 : avail.available) === false || (avail === null || avail === void 0 ? void 0 : avail.slotAvailable) === false) {
                        throw new healthcareErrors_1.HealthcareError("Appointment slot is no longer available", 409, healthcareErrors_1.HealthcareErrorCodes.SLOT_NOT_AVAILABLE);
                    }
                }
            }
            else if ((avail === null || avail === void 0 ? void 0 : avail.available) === false) {
                throw new healthcareErrors_1.HealthcareError("Appointment slot is no longer available", 409, healthcareErrors_1.HealthcareErrorCodes.SLOT_NOT_AVAILABLE);
            }
        }
        catch (error) {
            if (error instanceof healthcareErrors_1.HealthcareError)
                throw error;
            // Availability endpoint failures should not soft-block if SaaS create will validate
        }
        const patient = yield prisma_1.prisma.user.findUnique({
            where: { userid: input.userId },
            select: {
                userid: true,
                fullName: true,
                email: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
                healthId: true,
                isActive: true,
                isSuspended: true,
            },
        });
        if (!(patient === null || patient === void 0 ? void 0 : patient.isActive) || patient.isSuspended) {
            throw new healthcareErrors_1.HealthcareError("Your account cannot book appointments right now", 403, healthcareErrors_1.HealthcareErrorCodes.UNAUTHORIZED);
        }
        if (!patient.email) {
            throw new healthcareErrors_1.HealthcareError("Your profile email is required to book with a hospital", 400, healthcareErrors_1.HealthcareErrorCodes.VALIDATION_ERROR);
        }
        const facilityName = input.facilityName || (hospital === null || hospital === void 0 ? void 0 : hospital.companyName) || (hospital === null || hospital === void 0 ? void 0 : hospital.name) || null;
        const doctorName = input.doctorName || ((_e = doctor === null || doctor === void 0 ? void 0 : doctor.user) === null || _e === void 0 ? void 0 : _e.name) || (doctor === null || doctor === void 0 ? void 0 : doctor.name) || "Doctor";
        const specialty = input.specialty ||
            (doctor === null || doctor === void 0 ? void 0 : doctor.specialization) ||
            ((_f = doctor === null || doctor === void 0 ? void 0 : doctor.professionalProfile) === null || _f === void 0 ? void 0 : _f.specialization) ||
            null;
        const consentRecordId = yield ensureBookingConsent({
            userId: input.userId,
            hospitalId: saasTenantId,
            hospitalName: facilityName,
            doctorId: saasDoctorId,
            consentId: input.consentId,
            consentGranted: input.consentGranted,
        });
        const idempotencyKey = (typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()) ||
            (typeof input.externalRequestId === "string" &&
                input.externalRequestId.trim()) ||
            `ht-${input.userId}-${saasDoctorId}-${when.toISOString()}`;
        const existingLocal = yield prisma_1.prisma.appointment.findFirst({
            where: {
                OR: [
                    { idempotencyKey },
                    {
                        userId: input.userId,
                        externalDoctorId: saasDoctorId,
                        scheduledAt: when,
                        source: client_1.AppointmentSource.HEALTHTECH,
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
        if (existingLocal === null || existingLocal === void 0 ? void 0 : existingLocal.externalAppointmentId) {
            return { appointment: existingLocal, created: false };
        }
        const duration = Number(input.duration) > 0 ? Number(input.duration) : 30;
        const consultationFee = input.consultationFee !== undefined && input.consultationFee !== null
            ? Number(input.consultationFee)
            : (doctor === null || doctor === void 0 ? void 0 : doctor.consultationFee) != null
                ? Number(doctor.consultationFee)
                : null;
        const feeAmount = consultationFee != null && !Number.isNaN(consultationFee)
            ? consultationFee
            : 0;
        const paymentRequired = feeAmount > 0;
        const local = yield prisma_1.prisma.appointment.create({
            data: {
                userId: input.userId,
                doctorId: null, // SaaS doctor IDs must not pollute local Doctor FK
                appointmentCode: makeCode("APT"),
                source: client_1.AppointmentSource.HEALTHTECH,
                doctorName: String(doctorName),
                facilityName: facilityName ? String(facilityName) : null,
                specialty: specialty ? String(specialty) : null,
                department: (input.department && String(input.department)) ||
                    specialty ||
                    null,
                externalHospitalId: saasTenantId,
                externalDoctorId: saasDoctorId,
                externalFacilityId: input.facilityId ? String(input.facilityId) : null,
                externalDepartmentId: input.departmentId
                    ? String(input.departmentId)
                    : null,
                externalRequestId: input.externalRequestId
                    ? String(input.externalRequestId)
                    : idempotencyKey,
                idempotencyKey,
                scheduledAt: when,
                duration,
                reason: input.reason ? String(input.reason) : null,
                notes: input.notes ? String(input.notes) : null,
                status: client_1.AppointmentStatus.PENDING,
                hospitalPaymentStatus: client_1.HospitalPaymentStatus.UNPAID,
                paymentRequired,
                paymentStatus: paymentRequired ? "PENDING" : "PENDING",
                consultationFee,
                currency: input.currency ? String(input.currency) : "USD",
                consentId: consentRecordId,
            },
        });
        try {
            const saas = yield saasIntegration_service_1.SaasIntegrationService.createAppointment({
                tenantId: saasTenantId,
                doctorId: saasDoctorId,
                facilityId: input.facilityId || null,
                department: input.department || specialty || null,
                scheduledAt: when.toISOString(),
                duration,
                type: input.type || "IN_PERSON",
                reason: input.reason || null,
                notes: input.notes || null,
                healthtechUserId: input.userId,
                externalAppointmentId: local.id,
                idempotencyKey,
                patient: {
                    email: patient.email,
                    name: patient.fullName || patient.email,
                    phone: patient.phone,
                    healthId: patient.healthId,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender === "OTHER" ? null : patient.gender,
                },
            }, idempotencyKey);
            const saasAppt = saas.result || saas.data;
            if (!(saasAppt === null || saasAppt === void 0 ? void 0 : saasAppt.appointmentId)) {
                throw new healthcareErrors_1.HealthcareError("Hospital system did not confirm the booking", 503, healthcareErrors_1.HealthcareErrorCodes.SAAS_UNAVAILABLE);
            }
            const updated = yield syncLocalFromSaas(local.id, saasAppt);
            yield recordHealthcareActivity(input.userId, "HEALTHTECH_BOOKING_CREATED", "Appointment request sent", `Your request with ${updated.doctorName || "the doctor"} was sent to ${updated.facilityName || "the hospital"}.`, updated.id, {
                externalAppointmentId: saasAppt.appointmentId,
                externalRequestId: idempotencyKey,
            });
            return {
                appointment: updated,
                created: Boolean(saas.created !== false),
            };
        }
        catch (error) {
            yield prisma_1.prisma.appointment
                .delete({ where: { id: local.id } })
                .catch(() => undefined);
            if (error instanceof healthcareErrors_1.HealthcareError)
                throw error;
            const msg = String((error === null || error === void 0 ? void 0 : error.message) || "");
            if (/slot|available|conflict/i.test(msg)) {
                throw new healthcareErrors_1.HealthcareError("Appointment slot is no longer available", 409, healthcareErrors_1.HealthcareErrorCodes.SLOT_NOT_AVAILABLE);
            }
            throw error;
        }
    });
}
function listHealthcareBookings(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma_1.prisma.appointment.findMany({
            where: { userId, source: client_1.AppointmentSource.HEALTHTECH },
            orderBy: { scheduledAt: "desc" },
            take: 100,
            include: { doctorReviews: true },
        });
        try {
            const remote = yield saasIntegration_service_1.SaasIntegrationService.listAppointments(userId);
            const rows = (remote.result || remote.data || []);
            for (const saasAppt of rows) {
                const match = local.find((l) => l.externalAppointmentId === saasAppt.appointmentId ||
                    l.id === saasAppt.externalAppointmentId);
                if (match)
                    yield syncLocalFromSaas(match.id, saasAppt);
            }
        }
        catch (_a) {
            // offline SaaS — return local mirrors
        }
        return prisma_1.prisma.appointment.findMany({
            where: { userId, source: client_1.AppointmentSource.HEALTHTECH },
            orderBy: { scheduledAt: "desc" },
            take: 100,
            include: { doctorReviews: true },
        });
    });
}
function getHealthcareBooking(userId, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: {
                userId,
                source: client_1.AppointmentSource.HEALTHTECH,
                OR: [{ id }, { externalAppointmentId: id }],
            },
            include: { doctorReviews: true },
        });
        if (!local) {
            throw new healthcareErrors_1.HealthcareError("Appointment not found", 404, healthcareErrors_1.HealthcareErrorCodes.APPOINTMENT_NOT_FOUND);
        }
        if (local.externalAppointmentId) {
            try {
                const remote = yield saasIntegration_service_1.SaasIntegrationService.getAppointment(local.externalAppointmentId);
                const saasAppt = remote.result || remote.data;
                if (saasAppt) {
                    const updated = yield syncLocalFromSaas(local.id, saasAppt);
                    return Object.assign(Object.assign({}, updated), { saas: saasAppt });
                }
            }
            catch (_a) {
                /* use local */
            }
        }
        return local;
    });
}
function cancelHealthcareBooking(userId, id, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { id, userId, source: client_1.AppointmentSource.HEALTHTECH },
        });
        if (!(local === null || local === void 0 ? void 0 : local.externalAppointmentId)) {
            throw new healthcareErrors_1.HealthcareError("Appointment not found", 404, healthcareErrors_1.HealthcareErrorCodes.APPOINTMENT_NOT_FOUND);
        }
        const saas = yield saasIntegration_service_1.SaasIntegrationService.cancelAppointment(local.externalAppointmentId, { healthtechUserId: userId, reason: reason || null });
        const saasAppt = saas.result || saas.data;
        const updated = yield syncLocalFromSaas(local.id, saasAppt);
        yield recordHealthcareActivity(userId, "HEALTHTECH_BOOKING_CANCELLED", "Appointment cancelled", "You cancelled this appointment request.", local.id, { externalAppointmentId: local.externalAppointmentId });
        return updated;
    });
}
function requestHealthcareReschedule(userId, id, proposedScheduledAt, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { id, userId, source: client_1.AppointmentSource.HEALTHTECH },
        });
        if (!(local === null || local === void 0 ? void 0 : local.externalAppointmentId)) {
            throw new healthcareErrors_1.HealthcareError("Appointment not found", 404, healthcareErrors_1.HealthcareErrorCodes.APPOINTMENT_NOT_FOUND);
        }
        const saas = yield saasIntegration_service_1.SaasIntegrationService.requestReschedule(local.externalAppointmentId, {
            healthtechUserId: userId,
            proposedScheduledAt,
            scheduledAt: proposedScheduledAt,
            message: message || null,
        });
        const saasAppt = saas.result || saas.data;
        const updated = yield syncLocalFromSaas(local.id, saasAppt);
        yield recordHealthcareActivity(userId, "HEALTHTECH_BOOKING_RESCHEDULED", "Reschedule requested", message || "You requested a new appointment time.", local.id);
        return updated;
    });
}
function respondHealthcareReschedule(userId, id, accept) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: { id, userId, source: client_1.AppointmentSource.HEALTHTECH },
        });
        if (!(local === null || local === void 0 ? void 0 : local.externalAppointmentId)) {
            throw new healthcareErrors_1.HealthcareError("Appointment not found", 404, healthcareErrors_1.HealthcareErrorCodes.APPOINTMENT_NOT_FOUND);
        }
        const saas = yield saasIntegration_service_1.SaasIntegrationService.respondReschedule(local.externalAppointmentId, { healthtechUserId: userId, accept });
        const saasAppt = saas.result || saas.data;
        const updated = yield syncLocalFromSaas(local.id, saasAppt);
        yield recordHealthcareActivity(userId, accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED", accept ? "New appointment time accepted" : "Proposed time declined", accept
            ? "Your appointment is confirmed for the new time."
            : "You declined the hospital's proposed time.", local.id);
        return updated;
    });
}
function applySaasWebhook(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const externalId = (payload === null || payload === void 0 ? void 0 : payload.externalAppointmentId) ||
            (payload === null || payload === void 0 ? void 0 : payload.appointmentId) ||
            ((_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.appointmentId);
        if (!externalId)
            return null;
        const local = yield prisma_1.prisma.appointment.findFirst({
            where: {
                OR: [
                    { id: String(payload.externalAppointmentId || "") },
                    { externalAppointmentId: String(externalId) },
                ],
                source: client_1.AppointmentSource.HEALTHTECH,
            },
        });
        if (!(local === null || local === void 0 ? void 0 : local.externalAppointmentId) && !local)
            return null;
        const saasId = (local === null || local === void 0 ? void 0 : local.externalAppointmentId) || String(externalId);
        const remote = yield saasIntegration_service_1.SaasIntegrationService.getAppointment(saasId);
        const saasAppt = remote.result || remote.data;
        if (!saasAppt || !local)
            return null;
        const updated = yield syncLocalFromSaas(local.id, saasAppt);
        const type = String((payload === null || payload === void 0 ? void 0 : payload.type) || "APPOINTMENT_UPDATED");
        const titleMap = {
            APPOINTMENT_ACCEPTED: "Appointment accepted",
            APPOINTMENT_REJECTED: "Appointment rejected",
            RESCHEDULE_REQUESTED: "Hospital proposed a new time",
            OPD_TICKET_GENERATED: "OPD ticket ready",
            PATIENT_CHECKED_IN: "Checked in",
            VISIT_COMPLETED: "Visit completed",
            APPOINTMENT_CANCELLED: "Appointment cancelled",
        };
        yield recordHealthcareActivity(local.userId, type.startsWith("HEALTHTECH_") ? type : `HEALTHTECH_${type}`, titleMap[type] || "Appointment updated", updated.externalTicketNumber
            ? `OPD Ticket: ${updated.externalTicketNumber}`
            : updated.status, local.id, {
            externalAppointmentId: updated.externalAppointmentId,
            status: updated.status,
            ticketNumber: updated.externalTicketNumber,
        });
        return updated;
    });
}
