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
exports.updateConsultation = exports.createConsultation = exports.getConsultation = exports.listConsultations = void 0;
const client_1 = require("@prisma/client");
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const listConsultations = (actor, query) => __awaiter(void 0, void 0, void 0, function* () {
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
        where.status = (0, validation_1.parseEnum)(query.status, Object.values(client_1.ConsultationStatus), "status", true);
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.consultation.findMany({
            where,
            include: { doctor: true, appointment: true },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.consultation.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listConsultations = listConsultations;
const getConsultation = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.consultation.findUnique({
        where: { id },
        include: {
            doctor: true,
            appointment: true,
            diagnoses: true,
            prescriptions: { include: { items: true } },
        },
    });
    if (!row)
        throw new ownership_1.HttpError(404, "Consultation not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
        if (!doctorId || row.doctorId !== doctorId) {
            throw new ownership_1.HttpError(403, "Forbidden");
        }
    }
    return row;
});
exports.getConsultation = getConsultation;
const createConsultation = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const userId = (0, rbac_1.isAdminRole)(actor.role) && body.userId
        ? (0, validation_1.requireString)(body.userId, "userId")
        : actor.userId;
    const type = (0, validation_1.parseEnum)(body.type, Object.values(client_1.ConsultationType), "type", true);
    return prisma_1.prisma.consultation.create({
        data: {
            userId,
            doctorId: (_a = (0, validation_1.optionalString)(body.doctorId)) !== null && _a !== void 0 ? _a : null,
            appointmentId: (_b = (0, validation_1.optionalString)(body.appointmentId)) !== null && _b !== void 0 ? _b : null,
            consultationCode: (0, validation_1.optionalString)(body.consultationCode) || (0, codes_1.generateConsultationCode)(),
            type,
            status: (0, validation_1.parseEnum)(body.status, Object.values(client_1.ConsultationStatus), "status") ||
                client_1.ConsultationStatus.SCHEDULED,
            scheduledAt: (_c = (0, validation_1.parseDate)(body.scheduledAt, "scheduledAt")) !== null && _c !== void 0 ? _c : null,
            meetingLink: (_d = (0, validation_1.optionalString)(body.meetingLink)) !== null && _d !== void 0 ? _d : null,
            patientNotes: (_e = (0, validation_1.optionalString)(body.patientNotes)) !== null && _e !== void 0 ? _e : null,
            doctorNotes: (_f = (0, validation_1.optionalString)(body.doctorNotes)) !== null && _f !== void 0 ? _f : null,
        },
        include: { doctor: true },
    });
});
exports.createConsultation = createConsultation;
const updateConsultation = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const row = yield (0, exports.getConsultation)(id, actor);
    const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
    const isDoctor = Boolean(doctorId && row.doctorId === doctorId);
    const data = {};
    if (body.status !== undefined) {
        data.status = (0, validation_1.parseEnum)(body.status, Object.values(client_1.ConsultationStatus), "status", true);
        if (data.status === client_1.ConsultationStatus.ACTIVE)
            data.startedAt = new Date();
        if (data.status === client_1.ConsultationStatus.COMPLETED)
            data.endedAt = new Date();
    }
    if (body.meetingLink !== undefined) {
        data.meetingLink = (_a = (0, validation_1.optionalString)(body.meetingLink)) !== null && _a !== void 0 ? _a : null;
    }
    if (body.summary !== undefined && (isDoctor || (0, rbac_1.isAdminRole)(actor.role))) {
        data.summary = (_b = (0, validation_1.optionalString)(body.summary)) !== null && _b !== void 0 ? _b : null;
    }
    if (body.diagnosisSummary !== undefined &&
        (isDoctor || (0, rbac_1.isAdminRole)(actor.role))) {
        data.diagnosisSummary = (_c = (0, validation_1.optionalString)(body.diagnosisSummary)) !== null && _c !== void 0 ? _c : null;
    }
    if (body.treatmentPlan !== undefined &&
        (isDoctor || (0, rbac_1.isAdminRole)(actor.role))) {
        data.treatmentPlan = (_d = (0, validation_1.optionalString)(body.treatmentPlan)) !== null && _d !== void 0 ? _d : null;
    }
    if (body.patientNotes !== undefined) {
        data.patientNotes = (_e = (0, validation_1.optionalString)(body.patientNotes)) !== null && _e !== void 0 ? _e : null;
    }
    if (body.doctorNotes !== undefined && (isDoctor || (0, rbac_1.isAdminRole)(actor.role))) {
        data.doctorNotes = (_f = (0, validation_1.optionalString)(body.doctorNotes)) !== null && _f !== void 0 ? _f : null;
    }
    if (body.followUpAt !== undefined) {
        data.followUpAt = (_g = (0, validation_1.parseDate)(body.followUpAt, "followUpAt")) !== null && _g !== void 0 ? _g : null;
    }
    if (body.scheduledAt !== undefined) {
        data.scheduledAt = (_h = (0, validation_1.parseDate)(body.scheduledAt, "scheduledAt")) !== null && _h !== void 0 ? _h : null;
    }
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId && !isDoctor) {
        (0, ownership_1.assertOwnerOrAdmin)(row.userId, actor);
    }
    return prisma_1.prisma.consultation.update({
        where: { id },
        data,
        include: { doctor: true, appointment: true },
    });
});
exports.updateConsultation = updateConsultation;
