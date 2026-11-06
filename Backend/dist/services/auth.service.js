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
exports.PUBLIC_USER_SELECT = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const GenerateToken_1 = require("../helpers/GenerateToken");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const validation_1 = require("../utils/validation");
const audit_service_1 = require("./audit.service");
const PUBLIC_USER_SELECT = {
    userid: true,
    email: true,
    phone: true,
    fullName: true,
    gender: true,
    dateOfBirth: true,
    avatarUrl: true,
    picture: true,
    healthId: true,
    role: true,
    emailVerified: true,
    phoneVerified: true,
    language: true,
    timezone: true,
    country: true,
    region: true,
    city: true,
    district: true,
    isActive: true,
    isSuspended: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
};
exports.PUBLIC_USER_SELECT = PUBLIC_USER_SELECT;
const registerUser = (body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (0, validation_1.requireEmail)(body.email);
    const password = (0, validation_1.requireString)(body.password, "password", { min: 6 });
    const fullName = (0, validation_1.requireString)((_a = body.fullName) !== null && _a !== void 0 ? _a : body.name, "fullName");
    const phone = body.phone === undefined || body.phone === null || body.phone === ""
        ? null
        : (0, validation_1.requireString)(body.phone, "phone");
    const existing = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
        throw new ownership_1.HttpError(409, "Email already registered");
    }
    if (phone) {
        const phoneTaken = yield prisma_1.prisma.user.findFirst({
            where: { phone, deletedAt: null },
        });
        if (phoneTaken)
            throw new ownership_1.HttpError(409, "Phone already registered");
    }
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    const healthId = yield (0, codes_1.generateUniqueHealthId)();
    const gender = body.gender
        ? String(body.gender).toUpperCase()
        : undefined;
    const dateOfBirth = (0, validation_1.parseDate)(body.dateOfBirth, "dateOfBirth");
    const user = yield prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            fullName,
            phone,
            gender: gender && Object.values(client_1.Gender).includes(gender) ? gender : null,
            dateOfBirth: dateOfBirth !== null && dateOfBirth !== void 0 ? dateOfBirth : null,
            role: client_1.Role.USER,
            healthId,
            medicalProfile: { create: {} },
        },
        select: PUBLIC_USER_SELECT,
    });
    const tokens = yield (0, GenerateToken_1.generateTokens)({
        userId: user.userid,
        email: user.email,
        role: user.role,
    });
    return Object.assign({ user }, tokens);
});
exports.registerUser = registerUser;
const loginUser = (body, meta) => __awaiter(void 0, void 0, void 0, function* () {
    const email = (0, validation_1.requireEmail)(body.email);
    const password = (0, validation_1.requireString)(body.password, "password");
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
        throw new ownership_1.HttpError(401, "Invalid email or password");
    }
    if (!user.isActive || user.isSuspended) {
        throw new ownership_1.HttpError(403, "Account is not active");
    }
    if (!user.passwordHash) {
        throw new ownership_1.HttpError(400, "Please sign in with Google or reset your password");
    }
    const ok = yield bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        throw new ownership_1.HttpError(401, "Invalid email or password");
    const updated = yield prisma_1.prisma.user.update({
        where: { userid: user.userid },
        data: { lastLoginAt: new Date() },
        select: PUBLIC_USER_SELECT,
    });
    const tokens = yield (0, GenerateToken_1.generateTokens)({
        userId: updated.userid,
        email: updated.email,
        role: updated.role,
    });
    yield (0, audit_service_1.createAuditLog)({
        action: client_1.AuditAction.LOGIN,
        entity: "User",
        entityId: updated.userid,
        description: "User logged in",
        userId: updated.userid,
        ipAddress: meta === null || meta === void 0 ? void 0 : meta.ipAddress,
        userAgent: meta === null || meta === void 0 ? void 0 : meta.userAgent,
    });
    return Object.assign({ user: updated }, tokens);
});
exports.loginUser = loginUser;
