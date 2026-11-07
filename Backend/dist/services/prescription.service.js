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
exports.deletePrescription = exports.updatePrescription = exports.createPrescription = exports.getPrescription = exports.listPrescriptions = void 0;
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const sanitizeItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new ownership_1.HttpError(400, "items array is required");
    }
    return items.map((raw) => {
        var _a, _b, _c, _d, _e, _f;
        const item = raw;
        return {
            medicineName: (0, validation_1.requireString)(item.medicineName, "medicineName"),
            dosage: (_a = (0, validation_1.optionalString)(item.dosage)) !== null && _a !== void 0 ? _a : null,
            frequency: (_b = (0, validation_1.optionalString)(item.frequency)) !== null && _b !== void 0 ? _b : null,
            route: (_c = (0, validation_1.optionalString)(item.route)) !== null && _c !== void 0 ? _c : null,
            duration: (_d = (0, validation_1.optionalString)(item.duration)) !== null && _d !== void 0 ? _d : null,
            quantity: (_e = (0, validation_1.optionalString)(item.quantity)) !== null && _e !== void 0 ? _e : null,
            instructions: (_f = (0, validation_1.optionalString)(item.instructions)) !== null && _f !== void 0 ? _f : null,
            isActive: (0, validation_1.parseBool)(item.isActive, true),
        };
    });
};
const listPrescriptions = (actor, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if ((0, rbac_1.isAdminRole)(actor.role)) {
        if (query.userId)
            where.userId = String(query.userId);
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
    const [items, total] = yield Promise.all([
        prisma_1.prisma.prescription.findMany({
            where,
            include: { items: true, doctor: true },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.prescription.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listPrescriptions = listPrescriptions;
const getPrescription = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.prescription.findUnique({
        where: { id },
        include: { items: true, doctor: true },
    });
    if (!row)
        throw new ownership_1.HttpError(404, "Prescription not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
        if (!doctorId || row.doctorId !== doctorId) {
            throw new ownership_1.HttpError(403, "Forbidden");
        }
    }
    return row;
});
exports.getPrescription = getPrescription;
const createPrescription = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const userId = (0, rbac_1.isAdminRole)(actor.role) && body.userId
        ? (0, validation_1.requireString)(body.userId, "userId")
        : ((_a = (0, validation_1.optionalString)(body.userId)) !== null && _a !== void 0 ? _a : actor.userId);
    const doctorId = (_b = (0, validation_1.optionalString)(body.doctorId)) !== null && _b !== void 0 ? _b : (yield (0, ownership_1.getActorDoctorId)(actor.userId));
    const items = sanitizeItems(body.items);
    return prisma_1.prisma.prescription.create({
        data: {
            userId,
            doctorId,
            appointmentId: (_c = (0, validation_1.optionalString)(body.appointmentId)) !== null && _c !== void 0 ? _c : null,
            consultationId: (_d = (0, validation_1.optionalString)(body.consultationId)) !== null && _d !== void 0 ? _d : null,
            prescriptionNumber: (0, validation_1.optionalString)(body.prescriptionNumber) ||
                (0, codes_1.generatePrescriptionNumber)(),
            issuedAt: (_e = (0, validation_1.parseDate)(body.issuedAt, "issuedAt")) !== null && _e !== void 0 ? _e : new Date(),
            startDate: (_f = (0, validation_1.parseDate)(body.startDate, "startDate")) !== null && _f !== void 0 ? _f : null,
            endDate: (_g = (0, validation_1.parseDate)(body.endDate, "endDate")) !== null && _g !== void 0 ? _g : null,
            status: (0, validation_1.optionalString)(body.status) || "ACTIVE",
            notes: (_h = (0, validation_1.optionalString)(body.notes)) !== null && _h !== void 0 ? _h : null,
            items: { create: items },
        },
        include: { items: true, doctor: true },
    });
});
exports.createPrescription = createPrescription;
const updatePrescription = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const row = yield (0, exports.getPrescription)(id, actor);
    const doctorId = yield (0, ownership_1.getActorDoctorId)(actor.userId);
    const canEdit = (0, rbac_1.isAdminRole)(actor.role) ||
        (doctorId && row.doctorId === doctorId) ||
        row.userId === actor.userId;
    if (!canEdit)
        throw new ownership_1.HttpError(403, "Forbidden");
    const data = {};
    if (body.status !== undefined)
        data.status = (0, validation_1.requireString)(body.status, "status");
    if (body.notes !== undefined)
        data.notes = (_a = (0, validation_1.optionalString)(body.notes)) !== null && _a !== void 0 ? _a : null;
    if (body.startDate !== undefined)
        data.startDate = (_b = (0, validation_1.parseDate)(body.startDate, "startDate")) !== null && _b !== void 0 ? _b : null;
    if (body.endDate !== undefined)
        data.endDate = (_c = (0, validation_1.parseDate)(body.endDate, "endDate")) !== null && _c !== void 0 ? _c : null;
    if (Array.isArray(body.items)) {
        const items = sanitizeItems(body.items);
        yield prisma_1.prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
        data.items = { create: items };
    }
    return prisma_1.prisma.prescription.update({
        where: { id },
        data,
        include: { items: true, doctor: true },
    });
});
exports.updatePrescription = updatePrescription;
const deletePrescription = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield (0, exports.getPrescription)(id, actor);
    if (!(0, rbac_1.isAdminRole)(actor.role)) {
        (0, ownership_1.assertOwnerOrAdmin)(row.userId, actor);
    }
    return prisma_1.prisma.prescription.delete({ where: { id } });
});
exports.deletePrescription = deletePrescription;
