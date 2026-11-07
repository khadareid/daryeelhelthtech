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
exports.deleteDoctorReview = exports.updateDoctorReview = exports.createDoctorReview = exports.listDoctorReviews = void 0;
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const refreshDoctorRating = (doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const agg = yield prisma_1.prisma.doctorReview.aggregate({
        where: { doctorId, isPublished: true },
        _avg: { rating: true },
        _count: { _all: true },
    });
    yield prisma_1.prisma.doctor.update({
        where: { id: doctorId },
        data: {
            rating: (_a = agg._avg.rating) !== null && _a !== void 0 ? _a : null,
            reviewCount: agg._count._all,
        },
    });
});
const listDoctorReviews = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { isPublished: true };
    if (query.doctorId)
        where.doctorId = String(query.doctorId);
    if (query.userId)
        where.userId = String(query.userId);
    const [items, total] = yield Promise.all([
        prisma_1.prisma.doctorReview.findMany({
            where,
            include: {
                user: { select: { userid: true, fullName: true, picture: true } },
                doctor: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.doctorReview.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listDoctorReviews = listDoctorReviews;
const createDoctorReview = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const doctorId = (0, validation_1.requireString)(body.doctorId, "doctorId");
    const rating = (0, validation_1.parseNumber)(body.rating, "rating", true);
    if (rating < 1 || rating > 5)
        throw new ownership_1.HttpError(400, "rating must be 1-5");
    const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor)
        throw new ownership_1.HttpError(404, "Doctor not found");
    const review = yield prisma_1.prisma.doctorReview.create({
        data: {
            userId: actor.userId,
            doctorId,
            appointmentId: (_a = (0, validation_1.optionalString)(body.appointmentId)) !== null && _a !== void 0 ? _a : null,
            rating,
            review: (_b = (0, validation_1.optionalString)(body.review)) !== null && _b !== void 0 ? _b : null,
            isAnonymous: (0, validation_1.parseBool)(body.isAnonymous, false),
            isPublished: (0, validation_1.parseBool)(body.isPublished, true),
        },
    });
    yield refreshDoctorRating(doctorId);
    return review;
});
exports.createDoctorReview = createDoctorReview;
const updateDoctorReview = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const row = yield prisma_1.prisma.doctorReview.findUnique({ where: { id } });
    if (!row)
        throw new ownership_1.HttpError(404, "Review not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Forbidden");
    }
    const data = {};
    if (body.rating !== undefined) {
        const rating = (0, validation_1.parseNumber)(body.rating, "rating", true);
        if (rating < 1 || rating > 5)
            throw new ownership_1.HttpError(400, "rating must be 1-5");
        data.rating = rating;
    }
    if (body.review !== undefined)
        data.review = (_a = (0, validation_1.optionalString)(body.review)) !== null && _a !== void 0 ? _a : null;
    if (body.isAnonymous !== undefined)
        data.isAnonymous = (0, validation_1.parseBool)(body.isAnonymous);
    if (body.isPublished !== undefined)
        data.isPublished = (0, validation_1.parseBool)(body.isPublished);
    const updated = yield prisma_1.prisma.doctorReview.update({ where: { id }, data });
    if (row.doctorId)
        yield refreshDoctorRating(row.doctorId);
    return updated;
});
exports.updateDoctorReview = updateDoctorReview;
const deleteDoctorReview = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.doctorReview.findUnique({ where: { id } });
    if (!row)
        throw new ownership_1.HttpError(404, "Review not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Forbidden");
    }
    yield prisma_1.prisma.doctorReview.delete({ where: { id } });
    if (row.doctorId)
        yield refreshDoctorRating(row.doctorId);
    return { deleted: true };
});
exports.deleteDoctorReview = deleteDoctorReview;
