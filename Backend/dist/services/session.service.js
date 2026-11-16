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
exports.hashToken = hashToken;
exports.parseUserAgent = parseUserAgent;
exports.createUserSession = createUserSession;
exports.listActiveSessions = listActiveSessions;
exports.revokeSession = revokeSession;
exports.revokeOtherSessions = revokeOtherSessions;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const REFRESH_DAYS = 7;
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
function parseUserAgent(ua) {
    const raw = ua || "";
    const lower = raw.toLowerCase();
    let browser = "Browser";
    if (lower.includes("edg/"))
        browser = "Edge";
    else if (lower.includes("chrome/"))
        browser = "Chrome";
    else if (lower.includes("safari/") && !lower.includes("chrome"))
        browser = "Safari";
    else if (lower.includes("firefox/"))
        browser = "Firefox";
    let operatingSystem = "Unknown";
    if (lower.includes("windows"))
        operatingSystem = "Windows";
    else if (lower.includes("android"))
        operatingSystem = "Android";
    else if (lower.includes("iphone") || lower.includes("ipad"))
        operatingSystem = "iOS";
    else if (lower.includes("mac os") || lower.includes("macintosh"))
        operatingSystem = "macOS";
    else if (lower.includes("linux"))
        operatingSystem = "Linux";
    let deviceType = "computer";
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
        deviceType = "mobile";
    }
    else if (lower.includes("tablet") || lower.includes("ipad")) {
        deviceType = "tablet";
    }
    return { browser, operatingSystem, deviceType };
}
function createUserSession(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = parseUserAgent(input.userAgent);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
        return prisma_1.prisma.userSession.create({
            data: {
                userId: input.userId,
                refreshToken: hashToken(input.refreshToken),
                ipAddress: input.ipAddress || null,
                userAgent: input.userAgent || null,
                deviceType: parsed.deviceType,
                browser: parsed.browser,
                operatingSystem: parsed.operatingSystem,
                location: input.location || null,
                expiresAt,
                lastUsedAt: new Date(),
            },
        });
    });
}
function listActiveSessions(userId, currentRefreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentHash = currentRefreshToken
            ? hashToken(currentRefreshToken)
            : null;
        const rows = yield prisma_1.prisma.userSession.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { lastUsedAt: "desc" },
            take: 40,
        });
        return rows.map((s) => ({
            id: s.id,
            device: s.deviceType === "mobile"
                ? `${s.operatingSystem || "Mobile"} device`
                : `${s.operatingSystem || "Computer"} computer`,
            browser: s.browser,
            operatingSystem: s.operatingSystem,
            deviceType: s.deviceType,
            ipAddress: s.ipAddress,
            location: s.location,
            lastActiveAt: s.lastUsedAt,
            createdAt: s.createdAt,
            isCurrent: Boolean(currentHash && s.refreshToken === currentHash),
        }));
    });
}
function revokeSession(userId, sessionId, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield prisma_1.prisma.userSession.findFirst({
            where: { id: sessionId, userId, isRevoked: false },
        });
        if (!session)
            return { revoked: false };
        if (!(opts === null || opts === void 0 ? void 0 : opts.allowCurrent) &&
            (opts === null || opts === void 0 ? void 0 : opts.currentRefreshToken) &&
            session.refreshToken === hashToken(opts.currentRefreshToken)) {
            return { revoked: false, reason: "Cannot revoke current session here" };
        }
        yield prisma_1.prisma.userSession.update({
            where: { id: session.id },
            data: { isRevoked: true, revokedAt: new Date(), revokedBy: userId },
        });
        return { revoked: true };
    });
}
function revokeOtherSessions(userId, currentRefreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentHash = currentRefreshToken
            ? hashToken(currentRefreshToken)
            : null;
        const result = yield prisma_1.prisma.userSession.updateMany({
            where: Object.assign({ userId, isRevoked: false }, (currentHash ? { NOT: { refreshToken: currentHash } } : {})),
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokedBy: userId,
            },
        });
        return { revokedCount: result.count };
    });
}
