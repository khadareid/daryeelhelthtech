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
exports.deleteAppointment = exports.updateAppointment = exports.createAppointment = exports.getAppointment = exports.listAppointments = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const rbac_1 = require("../helpers/middleware/rbac");
const listAppointments = (actor, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if ((0, rbac_1.isAdminRole)(actor.role)) {
        if (query.userId)
            where.userId = String(query.userId);
        if (query.doctorId)
            where.doctorId = String(query.doctorId);
    }
    else {
        const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
        if (doctorId && query.as === "doctor") {
            where.doctorId = doctorId;
        }
        else if (doctorId) {
            where.OR = [{ userId: actor.userId }, { doctorId }];
        }
        else {
            where.userId = actor.userId;
        }
    }
    if (query.status) {
        where.status = (0, validation_1.parseEnum)(query.status, Object.values(client_1.AppointmentStatus), "status", true);
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.appointment.findMany({
            where,
            include: {
                doctor: true,
                user: {
                    select: { userid: true, fullName: true, email: true, phone: true },
                },
                payments: true,
                consultation: true,
            },
            orderBy: { scheduledAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.appointment.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listAppointments = listAppointments;
const getAppointment = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.appointment.findUnique({
        where: { id },
        include: {
            doctor: true,
            user: {
                select: { userid: true, fullName: true, email: true, phone: true },
            },
            payments: true,
            consultation: true,
            diagnoses: true,
            prescriptions: true,
        },
    });
    if (!row)
        throw new ownership_1.HttpError(404, "Appointment not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
        if (!doctorId || row.doctorId !== doctorId) {
            throw new ownership_1.HttpError(403, "Forbidden");
        }
    }
    return row;
});
exports.getAppointment = getAppointment;
const createAppointment = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const userId = (0, rbac_1.isAdminRole)(actor.role) && body.userId
        ? (0, validation_1.requireString)(body.userId, "userId")
        : actor.userId;
    const scheduledAt = (0, validation_1.parseDate)(body.scheduledAt, "scheduledAt", true);
    const doctorId = (_a = (0, validation_1.optionalString)(body.doctorId)) !== null && _a !== void 0 ? _a : null;
    let fee = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee");
    let paymentRequired = (0, validation_1.parseBool)(body.paymentRequired);
    const currency = (0, validation_1.optionalString)(body.currency) || "USD";
    if (doctorId) {
        const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor || !doctor.isActive) {
            throw new ownership_1.HttpError(400, "Doctor not available");
        }
        if (fee === undefined || fee === null) {
            fee = doctor.consultationFee != null ? Number(doctor.consultationFee) : 0;
        }
        if (paymentRequired === undefined) {
            paymentRequired = Number(fee || 0) > 0;
        }
    }
    else {
        fee = fee !== null && fee !== void 0 ? fee : 0;
        if (paymentRequired === undefined) {
            paymentRequired = Number(fee || 0) > 0;
        }
    }
    const amount = Number(fee || 0);
    const isFree = !paymentRequired || amount <= 0;
    const appt = yield prisma_1.prisma.appointment.create({
        data: {
            userId,
            doctorId,
            appointmentCode: (0, validation_1.optionalString)(body.appointmentCode) || (0, codes_1.generateAppointmentCode)(),
            scheduledAt,
            duration: (_b = (0, validation_1.parseNumber)(body.duration, "duration")) !== null && _b !== void 0 ? _b : 30,
            reason: (_c = (0, validation_1.optionalString)(body.reason)) !== null && _c !== void 0 ? _c : null,
            notes: (_d = (0, validation_1.optionalString)(body.notes)) !== null && _d !== void 0 ? _d : null,
            status: client_1.AppointmentStatus.PENDING,
            meetingLink: (_e = (0, validation_1.optionalString)(body.meetingLink)) !== null && _e !== void 0 ? _e : null,
            paymentRequired: !isFree,
            consultationFee: isFree ? 0 : amount,
            currency,
            paymentStatus: isFree ? client_1.PaymentStatus.PAID : client_1.PaymentStatus.PENDING,
        },
        include: { doctor: true, payments: true },
    });
    yield prisma_1.prisma.payment.create({
        data: {
            userId,
            appointmentId: appt.id,
            amount: isFree ? 0 : amount,
            currency,
            status: isFree ? client_1.PaymentStatus.PAID : client_1.PaymentStatus.PENDING,
            method: isFree ? client_1.PaymentMethod.OTHER : null,
            paymentReference: (0, codes_1.generatePaymentReference)(),
            provider: isFree ? "FREE" : null,
            paidAt: isFree ? new Date() : null,
        },
    });
    return prisma_1.prisma.appointment.findUnique({
        where: { id: appt.id },
        include: { doctor: true, payments: true },
    });
});
exports.createAppointment = createAppointment;
const updateAppointment = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const row = yield (0, exports.getAppointment)(id, actor);
    const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
    const isDoctor = Boolean(doctorId && row.doctorId === doctorId);
    const isOwner = row.userId === actor.userId;
    const data = {};
    if (body.scheduledAt !== undefined) {
        data.scheduledAt = (0, validation_1.parseDate)(body.scheduledAt, "scheduledAt", true);
    }
    if (body.duration !== undefined) {
        data.duration = (0, validation_1.parseNumber)(body.duration, "duration");
    }
    if (body.reason !== undefined)
        data.reason = (_a = (0, validation_1.optionalString)(body.reason)) !== null && _a !== void 0 ? _a : null;
    if (body.notes !== undefined)
        data.notes = (_b = (0, validation_1.optionalString)(body.notes)) !== null && _b !== void 0 ? _b : null;
    if (body.meetingLink !== undefined) {
        data.meetingLink = (_c = (0, validation_1.optionalString)(body.meetingLink)) !== null && _c !== void 0 ? _c : null;
    }
    if (body.status !== undefined) {
        const status = (0, validation_1.parseEnum)(body.status, Object.values(client_1.AppointmentStatus), "status", true);
        // Patients: cancel / reschedule request only
        // Doctors: clinical workflow statuses
        // Admins / SUPER_ADMIN: any status (including reopen cancelled)
        const patientAllowed = [
            client_1.AppointmentStatus.CANCELLED,
            client_1.AppointmentStatus.RESCHEDULE_REQUESTED,
        ];
        const doctorAllowed = [
            client_1.AppointmentStatus.ACCEPTED,
            client_1.AppointmentStatus.CONFIRMED,
            client_1.AppointmentStatus.REJECTED,
            client_1.AppointmentStatus.CHECKED_IN,
            client_1.AppointmentStatus.IN_PROGRESS,
            client_1.AppointmentStatus.COMPLETED,
            client_1.AppointmentStatus.CANCELLED,
            client_1.AppointmentStatus.NO_SHOW,
            client_1.AppointmentStatus.RESCHEDULE_REQUESTED,
            client_1.AppointmentStatus.PENDING,
        ];
        if ((0, rbac_1.isAdminRole)(actor.role)) {
            // full control
        }
        else if (isDoctor) {
            if (!doctorAllowed.includes(status)) {
                throw new ownership_1.HttpError(403, "Cannot set this status");
            }
        }
        else if (!patientAllowed.includes(status)) {
            throw new ownership_1.HttpError(403, "Cannot set this status");
        }
        data.status = status;
        if (status === client_1.AppointmentStatus.CONFIRMED || status === client_1.AppointmentStatus.ACCEPTED) {
            data.confirmedAt = new Date();
            data.cancelledAt = null;
            data.cancellationReason = null;
        }
        if (status === client_1.AppointmentStatus.PENDING && (0, rbac_1.isAdminRole)(actor.role)) {
            data.cancelledAt = null;
            data.cancellationReason = null;
        }
        if (status === client_1.AppointmentStatus.CANCELLED) {
            data.cancelledAt = new Date();
            data.cancellationReason =
                (_d = (0, validation_1.optionalString)(body.cancellationReason)) !== null && _d !== void 0 ? _d : null;
        }
    }
    if (body.cancellationReason !== undefined) {
        data.cancellationReason = (_e = (0, validation_1.optionalString)(body.cancellationReason)) !== null && _e !== void 0 ? _e : null;
    }
    if ((0, rbac_1.isAdminRole)(actor.role) || isDoctor) {
        if (body.paymentStatus !== undefined) {
            data.paymentStatus = (0, validation_1.parseEnum)(body.paymentStatus, Object.values(client_1.PaymentStatus), "paymentStatus", true);
        }
        if (body.paymentRequired !== undefined) {
            data.paymentRequired = (0, validation_1.parseBool)(body.paymentRequired, false);
        }
        if (body.consultationFee !== undefined) {
            data.consultationFee =
                (_f = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee")) !== null && _f !== void 0 ? _f : null;
        }
    }
    if (!(0, rbac_1.isAdminRole)(actor.role) && !isOwner && !isDoctor) {
        (0, ownership_1.assertOwnerOrAdmin)(row.userId, actor);
    }
    return prisma_1.prisma.appointment.update({
        where: { id },
        data,
        include: { doctor: true, payments: true },
    });
});
exports.updateAppointment = updateAppointment;
const deleteAppointment = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield (0, exports.getAppointment)(id, actor);
    if (!(0, rbac_1.isAdminRole)(actor.role)) {
        (0, ownership_1.assertOwnerOrAdmin)(row.userId, actor);
    }
    return prisma_1.prisma.appointment.delete({ where: { id } });
});
exports.deleteAppointment = deleteAppointment;
