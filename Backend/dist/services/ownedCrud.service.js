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
exports.ownedDelegates = exports.deleteOwned = exports.updateOwned = exports.createOwned = exports.getOwned = exports.listOwned = void 0;
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const listOwned = (delegate_1, userId_1, query_1, ...args_1) => __awaiter(void 0, [delegate_1, userId_1, query_1, ...args_1], void 0, function* (delegate, userId, query, extraWhere = {}) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = Object.assign(Object.assign({}, (userId ? { userId } : {})), extraWhere);
    const [items, total] = yield Promise.all([
        delegate.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        delegate.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listOwned = listOwned;
const getOwned = (delegate, id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield delegate.findFirst({ where: { id } });
    if (!row)
        throw new ownership_1.HttpError(404, "Not found");
    if (!actor.isAdmin && row.userId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Forbidden");
    }
    return row;
});
exports.getOwned = getOwned;
const createOwned = (delegate, userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return delegate.create({
        data: Object.assign(Object.assign({}, data), { userId }),
    });
});
exports.createOwned = createOwned;
const updateOwned = (delegate, id, actor, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.getOwned)(delegate, id, actor);
    return delegate.update({ where: { id }, data });
});
exports.updateOwned = updateOwned;
const deleteOwned = (delegate, id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.getOwned)(delegate, id, actor);
    return delegate.delete({ where: { id } });
});
exports.deleteOwned = deleteOwned;
exports.ownedDelegates = {
    emergencyContact: prisma_1.prisma.emergencyContact,
    familyMember: prisma_1.prisma.familyMember,
    allergy: prisma_1.prisma.allergy,
    chronicCondition: prisma_1.prisma.chronicCondition,
    medication: prisma_1.prisma.medication,
    medicalRecord: prisma_1.prisma.medicalRecord,
    medicalDocument: prisma_1.prisma.medicalDocument,
    diagnosis: prisma_1.prisma.diagnosis,
    vitalSign: prisma_1.prisma.vitalSign,
    labResult: prisma_1.prisma.labResult,
    dailyHealthLog: prisma_1.prisma.dailyHealthLog,
    healthDeviceConnection: prisma_1.prisma.healthDeviceConnection,
    notification: prisma_1.prisma.notification,
    consent: prisma_1.prisma.consent,
    payment: prisma_1.prisma.payment,
    doctorReview: prisma_1.prisma.doctorReview,
};
