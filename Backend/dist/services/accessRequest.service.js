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
exports.respondAccessRequest = exports.createAccessRequest = exports.listAccessRequests = void 0;
const client_1 = require("@prisma/client");
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const listAccessRequests = (actor, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if ((0, rbac_1.isAdminRole)(actor.role)) {
        if (query.patientId)
            where.patientId = String(query.patientId);
        if (query.requesterId)
            where.requesterId = String(query.requesterId);
    }
    else if (query.box === "sent") {
        where.requesterId = actor.userId;
    }
    else if (query.box === "received") {
        where.patientId = actor.userId;
    }
    else {
        where.OR = [
            { requesterId: actor.userId },
            { patientId: actor.userId },
        ];
    }
    if (query.status) {
        where.status = (0, validation_1.parseEnum)(query.status, Object.values(client_1.ConsentStatus), "status", true);
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.medicalAccessRequest.findMany({
            where,
            include: {
                requester: {
                    select: { userid: true, fullName: true, email: true },
                },
                patient: {
                    select: { userid: true, fullName: true, email: true },
                },
            },
            orderBy: { requestedAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.medicalAccessRequest.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listAccessRequests = listAccessRequests;
const createAccessRequest = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const patientId = (0, validation_1.requireString)(body.patientId, "patientId");
    if (patientId === actor.userId) {
        throw new ownership_1.HttpError(400, "Cannot request access to your own records");
    }
    const patient = yield prisma_1.prisma.user.findFirst({
        where: { userid: patientId, deletedAt: null },
    });
    if (!patient)
        throw new ownership_1.HttpError(404, "Patient not found");
    return prisma_1.prisma.medicalAccessRequest.create({
        data: {
            requesterId: actor.userId,
            patientId,
            requestType: (0, validation_1.parseEnum)(body.requestType, Object.values(client_1.AccessRequestType), "requestType", true),
            message: (_a = (0, validation_1.optionalString)(body.message)) !== null && _a !== void 0 ? _a : null,
            expiresAt: (_b = (0, validation_1.parseDate)(body.expiresAt, "expiresAt")) !== null && _b !== void 0 ? _b : null,
        },
    });
});
exports.createAccessRequest = createAccessRequest;
const respondAccessRequest = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.medicalAccessRequest.findUnique({ where: { id } });
    if (!row)
        throw new ownership_1.HttpError(404, "Access request not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.patientId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Only the patient can respond");
    }
    const status = (0, validation_1.parseEnum)(body.status, [client_1.ConsentStatus.APPROVED, client_1.ConsentStatus.REJECTED, client_1.ConsentStatus.REVOKED], "status", true);
    return prisma_1.prisma.medicalAccessRequest.update({
        where: { id },
        data: {
            status,
            respondedAt: new Date(),
        },
    });
});
exports.respondAccessRequest = respondAccessRequest;
