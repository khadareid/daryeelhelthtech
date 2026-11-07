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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteUser = exports.adminResetPassword = exports.adminUpdateUser = exports.adminCreateUser = exports.getUserById = exports.listUsers = exports.changePassword = exports.updateMe = exports.getMe = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const auth_service_1 = require("./auth.service");
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findFirst({
        where: { userid: userId, deletedAt: null },
        select: Object.assign(Object.assign({}, auth_service_1.PUBLIC_USER_SELECT), { medicalProfile: true, doctor: true, emergencyCard: true }),
    });
    if (!user)
        throw new ownership_1.HttpError(404, "User not found");
    return user;
});
exports.getMe = getMe;
const updateMe = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const data = {};
    if (body.fullName !== undefined) {
        data.fullName = (0, validation_1.requireString)(body.fullName, "fullName");
    }
    if (body.phone !== undefined) {
        data.phone =
            body.phone === null || body.phone === ""
                ? null
                : (0, validation_1.requireString)(body.phone, "phone");
    }
    if (body.gender !== undefined) {
        const g = String(body.gender).toUpperCase();
        data.gender = Object.values(client_1.Gender).includes(g) ? g : null;
    }
    if (body.dateOfBirth !== undefined) {
        data.dateOfBirth = (_a = (0, validation_1.parseDate)(body.dateOfBirth, "dateOfBirth")) !== null && _a !== void 0 ? _a : null;
    }
    if (body.avatarUrl !== undefined) {
        data.avatarUrl = (_b = (0, validation_1.optionalString)(body.avatarUrl)) !== null && _b !== void 0 ? _b : null;
    }
    if (body.picture !== undefined) {
        data.picture = (_c = (0, validation_1.optionalString)(body.picture)) !== null && _c !== void 0 ? _c : null;
    }
    if (body.language !== undefined) {
        data.language = (0, validation_1.requireString)(body.language, "language");
    }
    if (body.timezone !== undefined) {
        data.timezone = (0, validation_1.requireString)(body.timezone, "timezone");
    }
    if (body.country !== undefined)
        data.country = (_d = (0, validation_1.optionalString)(body.country)) !== null && _d !== void 0 ? _d : null;
    if (body.region !== undefined)
        data.region = (_e = (0, validation_1.optionalString)(body.region)) !== null && _e !== void 0 ? _e : null;
    if (body.city !== undefined)
        data.city = (_f = (0, validation_1.optionalString)(body.city)) !== null && _f !== void 0 ? _f : null;
    if (body.district !== undefined) {
        data.district = (_g = (0, validation_1.optionalString)(body.district)) !== null && _g !== void 0 ? _g : null;
    }
    return prisma_1.prisma.user.update({
        where: { userid: userId },
        data,
        select: auth_service_1.PUBLIC_USER_SELECT,
    });
});
exports.updateMe = updateMe;
const changePassword = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    const currentPassword = (0, validation_1.requireString)(body.currentPassword, "currentPassword");
    const newPassword = (0, validation_1.requireString)(body.newPassword, "newPassword", {
        min: 6,
    });
    const user = yield prisma_1.prisma.user.findUnique({ where: { userid: userId } });
    if (!user || user.deletedAt)
        throw new ownership_1.HttpError(404, "User not found");
    if (!user.passwordHash) {
        throw new ownership_1.HttpError(400, "Account has no password set");
    }
    const ok = yield bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!ok)
        throw new ownership_1.HttpError(401, "Current password is incorrect");
    const passwordHash = yield bcryptjs_1.default.hash(newPassword, 10);
    yield prisma_1.prisma.user.update({
        where: { userid: userId },
        data: { passwordHash },
    });
    return { changed: true };
});
exports.changePassword = changePassword;
const listUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {
        deletedAt: null,
    };
    if (query.role)
        where.role = String(query.role);
    if (query.status === "suspended")
        where.isSuspended = true;
    if (query.status === "active") {
        where.isSuspended = false;
        where.isActive = true;
    }
    const q = query.q || query.search;
    if (q) {
        const needle = String(q);
        where.OR = [
            { email: { contains: needle, mode: "insensitive" } },
            { fullName: { contains: needle, mode: "insensitive" } },
            { phone: { contains: needle, mode: "insensitive" } },
            { healthId: { contains: needle, mode: "insensitive" } },
        ];
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            select: Object.assign(Object.assign({}, auth_service_1.PUBLIC_USER_SELECT), { doctor: {
                    select: {
                        id: true,
                        specialty: true,
                        verificationStatus: true,
                        isActive: true,
                    },
                }, _count: {
                    select: {
                        appointments: true,
                        payments: true,
                    },
                } }),
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listUsers = listUsers;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findFirst({
        where: { userid: id, deletedAt: null },
        select: Object.assign(Object.assign({}, auth_service_1.PUBLIC_USER_SELECT), { suspensionReason: true, suspendedAt: true, suspendedUntil: true, suspendedBy: true, lastActiveAt: true, lastLoginIp: true, passwordChangedAt: true, twoFactorEnabled: true, medicalProfile: true, emergencyCard: true, doctor: true, _count: {
                select: {
                    appointments: true,
                    payments: true,
                    consultations: true,
                    notifications: true,
                    familyMembers: true,
                    medications: true,
                    labResults: true,
                    medicalRecords: true,
                },
            }, appointments: {
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    appointmentCode: true,
                    scheduledAt: true,
                    status: true,
                    paymentStatus: true,
                    doctor: { select: { fullName: true, specialty: true } },
                },
            }, payments: {
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    status: true,
                    method: true,
                    provider: true,
                    paymentReference: true,
                    createdAt: true,
                },
            } }),
    });
    if (!user)
        throw new ownership_1.HttpError(404, "User not found");
    return user;
});
exports.getUserById = getUserById;
const adminCreateUser = (body, actor) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const email = (0, validation_1.requireEmail)(body.email);
    const password = (0, validation_1.requireString)(body.password, "password", { min: 6 });
    const fullName = (0, validation_1.requireString)((_a = body.fullName) !== null && _a !== void 0 ? _a : body.name, "fullName");
    const role = body.role || client_1.Role.USER;
    if (!Object.values(client_1.Role).includes(role)) {
        throw new ownership_1.HttpError(400, "Invalid role");
    }
    const actorRole = String((actor === null || actor === void 0 ? void 0 : actor.role) || "").toUpperCase();
    if (role === client_1.Role.SUPER_ADMIN && actorRole !== client_1.Role.SUPER_ADMIN) {
        throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can create SUPER_ADMIN accounts");
    }
    if (role === client_1.Role.ADMIN &&
        actorRole !== client_1.Role.SUPER_ADMIN &&
        actorRole !== client_1.Role.ADMIN) {
        throw new ownership_1.HttpError(403, "Not allowed to create admin accounts");
    }
    const exists = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists && !exists.deletedAt) {
        throw new ownership_1.HttpError(409, "Email already registered");
    }
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    const healthId = yield (0, codes_1.generateUniqueHealthId)();
    return prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            fullName,
            role,
            healthId,
            phone: (_b = (0, validation_1.optionalString)(body.phone)) !== null && _b !== void 0 ? _b : null,
            emailVerified: Boolean((_c = body.emailVerified) !== null && _c !== void 0 ? _c : true),
            passwordChangedAt: new Date(),
            medicalProfile: { create: {} },
        },
        select: auth_service_1.PUBLIC_USER_SELECT,
    });
});
exports.adminCreateUser = adminCreateUser;
const adminUpdateUser = (id, body, actor) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const existing = yield prisma_1.prisma.user.findFirst({
        where: { userid: id, deletedAt: null },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "User not found");
    const actorRole = String((actor === null || actor === void 0 ? void 0 : actor.role) || "").toUpperCase();
    if (existing.role === client_1.Role.SUPER_ADMIN &&
        actorRole !== client_1.Role.SUPER_ADMIN) {
        throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can edit SUPER_ADMIN accounts");
    }
    const data = {};
    if (body.fullName !== undefined) {
        data.fullName = (0, validation_1.requireString)(body.fullName, "fullName");
    }
    if (body.role !== undefined) {
        const role = body.role;
        if (!Object.values(client_1.Role).includes(role)) {
            throw new ownership_1.HttpError(400, "Invalid role");
        }
        if (role === client_1.Role.SUPER_ADMIN && actorRole !== client_1.Role.SUPER_ADMIN) {
            throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can assign SUPER_ADMIN");
        }
        data.role = role;
    }
    if (body.isActive !== undefined)
        data.isActive = Boolean(body.isActive);
    if (body.isSuspended !== undefined) {
        data.isSuspended = Boolean(body.isSuspended);
        if (body.isSuspended) {
            data.suspendedAt = new Date();
            data.suspendedBy = (actor === null || actor === void 0 ? void 0 : actor.userId) || null;
            data.suspensionReason =
                (_b = (_a = (0, validation_1.optionalString)(body.suspensionReason)) !== null && _a !== void 0 ? _a : existing.suspensionReason) !== null && _b !== void 0 ? _b : null;
            if (body.suspendedUntil) {
                data.suspendedUntil =
                    (_c = (0, validation_1.parseDate)(body.suspendedUntil, "suspendedUntil")) !== null && _c !== void 0 ? _c : null;
            }
        }
        else {
            data.suspendedAt = null;
            data.suspendedBy = null;
            data.suspensionReason = null;
            data.suspendedUntil = null;
        }
    }
    if (body.emailVerified !== undefined) {
        data.emailVerified = Boolean(body.emailVerified);
    }
    if (body.phone !== undefined) {
        data.phone = (_d = (0, validation_1.optionalString)(body.phone)) !== null && _d !== void 0 ? _d : null;
    }
    if (body.city !== undefined)
        data.city = (_e = (0, validation_1.optionalString)(body.city)) !== null && _e !== void 0 ? _e : null;
    if (body.country !== undefined) {
        data.country = (_f = (0, validation_1.optionalString)(body.country)) !== null && _f !== void 0 ? _f : null;
    }
    if (body.language !== undefined) {
        data.language = (0, validation_1.requireString)(body.language, "language");
    }
    return prisma_1.prisma.user.update({
        where: { userid: id },
        data,
        select: auth_service_1.PUBLIC_USER_SELECT,
    });
});
exports.adminUpdateUser = adminUpdateUser;
/** Admin / Super Admin sets a new password for a user (support). */
const adminResetPassword = (id, body, actor) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existing = yield prisma_1.prisma.user.findFirst({
        where: { userid: id, deletedAt: null },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "User not found");
    const actorRole = String((actor === null || actor === void 0 ? void 0 : actor.role) || "").toUpperCase();
    if (existing.role === client_1.Role.SUPER_ADMIN &&
        actorRole !== client_1.Role.SUPER_ADMIN) {
        throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can reset SUPER_ADMIN passwords");
    }
    if (existing.role === client_1.Role.ADMIN &&
        actorRole !== client_1.Role.SUPER_ADMIN &&
        (actor === null || actor === void 0 ? void 0 : actor.userId) !== existing.userid) {
        // ADMIN may reset USER passwords; only SUPER_ADMIN resets other ADMIN passwords
        if (actorRole !== client_1.Role.SUPER_ADMIN) {
            throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can reset admin passwords");
        }
    }
    const newPassword = (0, validation_1.requireString)((_a = body.newPassword) !== null && _a !== void 0 ? _a : body.password, "newPassword", { min: 6 });
    const passwordHash = yield bcryptjs_1.default.hash(newPassword, 10);
    yield prisma_1.prisma.user.update({
        where: { userid: id },
        data: {
            passwordHash,
            passwordChangedAt: new Date(),
            passwordResetToken: null,
            passwordResetExpiresAt: null,
        },
    });
    return {
        changed: true,
        userid: id,
        fullName: existing.fullName,
        email: existing.email,
    };
});
exports.adminResetPassword = adminResetPassword;
const softDeleteUser = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existing = yield prisma_1.prisma.user.findFirst({
        where: { userid: id, deletedAt: null },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "User not found");
    const actorRole = String((actor === null || actor === void 0 ? void 0 : actor.role) || "").toUpperCase();
    // Self-delete from profile still allowed without actor role check
    if (actor && actorRole && actor.userId !== id) {
        if (actorRole !== client_1.Role.SUPER_ADMIN) {
            throw new ownership_1.HttpError(403, "Only SUPER_ADMIN can delete users");
        }
    }
    if (existing.userid === (actor === null || actor === void 0 ? void 0 : actor.userId) && actorRole === client_1.Role.SUPER_ADMIN) {
        throw new ownership_1.HttpError(400, "You cannot delete your own admin account here");
    }
    return prisma_1.prisma.user.update({
        where: { userid: id },
        data: {
            deletedAt: new Date(),
            isActive: false,
            deletedBy: (actor === null || actor === void 0 ? void 0 : actor.userId) || null,
            deletedReason: (_a = (0, validation_1.optionalString)(body === null || body === void 0 ? void 0 : body.reason)) !== null && _a !== void 0 ? _a : null,
            email: `deleted_${Date.now()}_${existing.email}`,
            phone: null,
        },
        select: { userid: true, deletedAt: true },
    });
});
exports.softDeleteUser = softDeleteUser;
