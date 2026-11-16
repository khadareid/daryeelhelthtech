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
exports.recordSecurityActivity = recordSecurityActivity;
exports.getSecurityStatus = getSecurityStatus;
exports.listSecurityActivity = listSecurityActivity;
exports.getSessions = getSessions;
exports.revokeOneSession = revokeOneSession;
exports.revokeOthers = revokeOthers;
exports.updateRecoveryEmail = updateRecoveryEmail;
exports.updateSecurityPhone = updateSecurityPhone;
exports.updatePrimaryEmail = updatePrimaryEmail;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const validation_1 = require("../utils/validation");
const notification_service_1 = require("./notification.service");
const session_service_1 = require("./session.service");
const NOTIFY_TYPES = new Set([
    "LOGIN",
    "FAILED_LOGIN",
    "PASSWORD_CHANGED",
    "PHONE_ADDED",
    "PHONE_CHANGED",
    "EMAIL_CHANGED",
    "SESSION_REVOKED",
    "SESSIONS_REVOKED_OTHERS",
    "RECOVERY_EMAIL_UPDATED",
    "SESSION_CREATED",
]);
function recordSecurityActivity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = (0, session_service_1.parseUserAgent)(input.userAgent);
        const title = input.title || humanizeSecurityType(input.type);
        try {
            yield prisma_1.prisma.securityActivity.create({
                data: {
                    userId: input.userId,
                    type: input.type,
                    title,
                    device: parsed.deviceType,
                    browser: parsed.browser,
                    operatingSystem: parsed.operatingSystem,
                    ipAddress: input.ipAddress || null,
                    location: input.location || null,
                    metadata: input.metadata || undefined,
                },
            });
        }
        catch (_a) {
            // Non-fatal if table not migrated yet
        }
        const shouldNotify = input.notify !== false && NOTIFY_TYPES.has(input.type);
        if (!shouldNotify)
            return;
        const deviceHint = [parsed.operatingSystem, parsed.browser]
            .filter(Boolean)
            .join(" · ");
        const bodyParts = [
            securityNotifyBody(input.type, title),
            deviceHint || null,
            input.location || null,
        ].filter(Boolean);
        try {
            yield (0, notification_service_1.createNotification)({
                userId: input.userId,
                title: `Security · ${title}`,
                body: bodyParts.join(" · "),
                type: client_1.NotificationType.SYSTEM,
                data: {
                    kind: "security",
                    securityType: input.type,
                },
            });
        }
        catch (_b) {
            // Activity still recorded if notification write fails
        }
    });
}
function humanizeSecurityType(type) {
    const map = {
        LOGIN: "New sign-in",
        LOGOUT: "Signed out",
        PASSWORD_CHANGED: "Password changed",
        PHONE_ADDED: "Phone number added",
        PHONE_CHANGED: "Phone number changed",
        EMAIL_CHANGED: "Email changed",
        PROFILE_UPDATED: "Profile updated",
        SESSION_CREATED: "New device session",
        SESSION_REVOKED: "Device signed out",
        SESSIONS_REVOKED_OTHERS: "Signed out other devices",
        FAILED_LOGIN: "Failed sign-in attempt",
        RECOVERY_EMAIL_UPDATED: "Recovery email updated",
    };
    return map[type] || type.replace(/_/g, " ").toLowerCase();
}
function securityNotifyBody(type, title) {
    const map = {
        LOGIN: "Someone signed in to your Daryeel account.",
        FAILED_LOGIN: "A failed sign-in attempt was detected.",
        PASSWORD_CHANGED: "Your password was changed successfully.",
        PHONE_ADDED: "A phone number was added to your account.",
        PHONE_CHANGED: "Your phone number was updated.",
        EMAIL_CHANGED: "Your email address was updated.",
        SESSION_REVOKED: "A device was signed out of your account.",
        SESSIONS_REVOKED_OTHERS: "All other devices were signed out.",
        RECOVERY_EMAIL_UPDATED: "Your recovery email was updated.",
        SESSION_CREATED: "A new device session was created.",
    };
    return map[type] || `${title} on your Daryeel account.`;
}
function getSecurityStatus(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findFirst({
            where: { userid: userId, deletedAt: null },
            select: {
                email: true,
                phone: true,
                passwordHash: true,
                passwordChangedAt: true,
                emailVerified: true,
                phoneVerified: true,
                twoFactorEnabled: true,
                twoFactorMethod: true,
                recoveryEmail: true,
                lastLoginAt: true,
                lastLoginIp: true,
            },
        });
        if (!user)
            throw new ownership_1.HttpError(404, "User not found");
        const activeSessions = yield prisma_1.prisma.userSession.count({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
        });
        const phoneAdded = Boolean(user.phone);
        const emailAdded = Boolean(user.email);
        const passwordSet = Boolean(user.passwordHash);
        const twoFactorEnabled = Boolean(user.twoFactorEnabled);
        let score = 0;
        if (emailAdded)
            score += 20;
        if (passwordSet)
            score += 25;
        if (phoneAdded)
            score += 25;
        if (user.emailVerified)
            score += 10;
        if (user.phoneVerified)
            score += 10;
        if (twoFactorEnabled)
            score += 10;
        score = Math.min(100, score);
        const recommendations = [];
        if (!phoneAdded)
            recommendations.push("Add a phone number");
        if (!passwordSet)
            recommendations.push("Set a password");
        if (!twoFactorEnabled)
            recommendations.push("Enable 2-Step Verification (coming soon)");
        if (!user.recoveryEmail)
            recommendations.push("Add a recovery email");
        return {
            securityScore: score,
            protected: score >= 70 && phoneAdded && passwordSet,
            phoneAdded,
            emailAdded,
            passwordSet,
            passwordChangedAt: user.passwordChangedAt,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            twoFactorEnabled,
            twoFactorMethod: user.twoFactorMethod,
            passkeysCount: 0,
            authenticatorConfigured: false,
            recoveryEmail: user.recoveryEmail,
            recoveryPhone: user.phone,
            activeSessions,
            lastLoginAt: user.lastLoginAt,
            lastLoginIp: user.lastLoginIp,
            recommendations,
            comingSoon: {
                twoFactor: true,
                passkeys: true,
                authenticatorApp: true,
                whatsappVerification: true,
            },
        };
    });
}
function listSecurityActivity(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, limit = 30) {
        const items = yield prisma_1.prisma.securityActivity.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: Math.min(100, Math.max(1, limit)),
        });
        return items.map((a) => ({
            id: a.id,
            type: a.type,
            title: a.title || humanizeSecurityType(a.type),
            device: a.device,
            browser: a.browser,
            operatingSystem: a.operatingSystem,
            ipAddress: a.ipAddress,
            location: a.location,
            createdAt: a.createdAt,
        }));
    });
}
function getSessions(userId, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, session_service_1.listActiveSessions)(userId, refreshToken);
    });
}
function revokeOneSession(userId, sessionId, currentRefreshToken, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, session_service_1.revokeSession)(userId, sessionId, {
            currentRefreshToken,
            allowCurrent: false,
        });
        if (result.revoked) {
            yield recordSecurityActivity({
                userId,
                type: "SESSION_REVOKED",
                title: "Device signed out",
                ipAddress: meta === null || meta === void 0 ? void 0 : meta.ipAddress,
                userAgent: meta === null || meta === void 0 ? void 0 : meta.userAgent,
            });
        }
        return result;
    });
}
function revokeOthers(userId, currentRefreshToken, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, session_service_1.revokeOtherSessions)(userId, currentRefreshToken);
        yield recordSecurityActivity({
            userId,
            type: "SESSIONS_REVOKED_OTHERS",
            title: "Signed out of all other devices",
            ipAddress: meta === null || meta === void 0 ? void 0 : meta.ipAddress,
            userAgent: meta === null || meta === void 0 ? void 0 : meta.userAgent,
            metadata: { revokedCount: result.revokedCount },
        });
        return result;
    });
}
function updateRecoveryEmail(userId, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const recoveryEmail = body.recoveryEmail === null || body.recoveryEmail === ""
            ? null
            : (0, validation_1.requireEmail)(body.recoveryEmail);
        const user = yield prisma_1.prisma.user.update({
            where: { userid: userId },
            data: { recoveryEmail },
            select: {
                userid: true,
                email: true,
                recoveryEmail: true,
            },
        });
        yield recordSecurityActivity({
            userId,
            type: "RECOVERY_EMAIL_UPDATED",
            title: recoveryEmail ? "Recovery email added" : "Recovery email removed",
        });
        return user;
    });
}
function updateSecurityPhone(userId, body, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        const phone = (0, validation_1.requirePhone)(body.phone, "phone");
        const existing = yield prisma_1.prisma.user.findFirst({
            where: { userid: userId, deletedAt: null },
            select: { phone: true },
        });
        if (!existing)
            throw new ownership_1.HttpError(404, "User not found");
        const taken = yield prisma_1.prisma.user.findFirst({
            where: { phone, deletedAt: null, NOT: { userid: userId } },
        });
        if (taken)
            throw new ownership_1.HttpError(409, "Phone already registered");
        const user = yield prisma_1.prisma.user.update({
            where: { userid: userId },
            data: { phone },
            select: {
                userid: true,
                phone: true,
                email: true,
                fullName: true,
            },
        });
        yield recordSecurityActivity({
            userId,
            type: existing.phone ? "PHONE_CHANGED" : "PHONE_ADDED",
            title: existing.phone ? "Phone number changed" : "Phone number added",
            ipAddress: meta === null || meta === void 0 ? void 0 : meta.ipAddress,
            userAgent: meta === null || meta === void 0 ? void 0 : meta.userAgent,
        });
        return user;
    });
}
function updatePrimaryEmail(userId, body, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = (0, validation_1.requireEmail)(body.email);
        const taken = yield prisma_1.prisma.user.findFirst({
            where: { email, deletedAt: null, NOT: { userid: userId } },
        });
        if (taken)
            throw new ownership_1.HttpError(409, "Email already registered");
        const user = yield prisma_1.prisma.user.update({
            where: { userid: userId },
            data: { email, emailVerified: false },
            select: {
                userid: true,
                email: true,
                phone: true,
                fullName: true,
                emailVerified: true,
            },
        });
        yield recordSecurityActivity({
            userId,
            type: "EMAIL_CHANGED",
            title: "Email address changed",
            ipAddress: meta === null || meta === void 0 ? void 0 : meta.ipAddress,
            userAgent: meta === null || meta === void 0 ? void 0 : meta.userAgent,
        });
        return user;
    });
}
