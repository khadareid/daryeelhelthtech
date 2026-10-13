"use strict";
// src/routes/auth/session.routes.ts  (adjust path as needed)
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
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../lib/prisma");
const audit_service_1 = require("../../services/audit.service");
const GenerateToken_1 = require("../../helpers/GenerateToken");
const router = express_1.default.Router();
/* ============================================================
   POST /refresh-token
   ============================================================ */
router.post("/refresh-token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({
            isSuccess: false,
            message: "Refresh token is required",
        });
        return;
    }
    try {
        const storedSession = yield prisma_1.prisma.session.findUnique({
            where: { refreshToken },
            include: { user: true },
        });
        if (!storedSession) {
            res.status(403).json({
                isSuccess: false,
                message: "Invalid refresh token",
            });
            return;
        }
        if (storedSession.revokedAt) {
            res.status(403).json({
                isSuccess: false,
                message: "Session has been revoked",
            });
            return;
        }
        if (storedSession.expiresAt < new Date()) {
            yield prisma_1.prisma.session.delete({ where: { refreshToken } });
            res.status(403).json({
                isSuccess: false,
                message: "Session expired. Please log in again.",
            });
            return;
        }
        /* ── Verify JWT signature ── */
        let payload;
        try {
            payload = (0, GenerateToken_1.verifyRefreshToken)(refreshToken);
        }
        catch (_a) {
            yield prisma_1.prisma.session.deleteMany({ where: { refreshToken } });
            res.status(403).json({
                isSuccess: false,
                message: "Invalid refresh token",
            });
            return;
        }
        /* ── Reload the user ── */
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: payload.userId },
            select: {
                userid: true,
                email: true,
                role: true,
                isActive: true,
                isSuspended: true,
                isDeleted: true,
            },
        });
        if (!user || user.isDeleted || !user.isActive || user.isSuspended) {
            yield prisma_1.prisma.session.deleteMany({ where: { refreshToken } });
            res.status(403).json({
                isSuccess: false,
                message: "Account is not active",
            });
            return;
        }
        /* ── Build fresh token payload ── */
        const tokenPayload = {
            userId: user.userid,
            email: user.email,
            role: user.role,
        };
        /* ── Rotate: delete old session before issuing a new one ── */
        yield prisma_1.prisma.session.deleteMany({ where: { refreshToken } });
        const { accessToken, refreshToken: newRefreshToken } = yield (0, GenerateToken_1.generateTokens)(tokenPayload);
        /* ── Audit log ── */
        const meta = (0, audit_service_1.getClientMeta)(req);
        yield (0, audit_service_1.createAuditLog)({
            action: "TOKEN_REFRESH",
            entity: "Session",
            entityId: storedSession.sessionid,
            userId: user.userid,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            metadata: { email: user.email, role: user.role },
        });
        res.status(200).json({
            isSuccess: true,
            message: "Token refreshed",
            accessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        console.error("⚠️ Refresh token error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to refresh token",
        });
    }
}));
/* ============================================================
   POST /logout
   ============================================================ */
router.post("/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({
            isSuccess: false,
            message: "Refresh token is required",
        });
        return;
    }
    try {
        const session = yield prisma_1.prisma.session.findUnique({
            where: { refreshToken },
        });
        yield prisma_1.prisma.session.deleteMany({ where: { refreshToken } });
        if (session === null || session === void 0 ? void 0 : session.userId) {
            const meta = (0, audit_service_1.getClientMeta)(req);
            yield (0, audit_service_1.createAuditLog)({
                action: "LOGOUT",
                entity: "User",
                entityId: session.userId,
                userId: session.userId,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
                metadata: { sessionId: session.sessionid },
            });
        }
        res.status(200).json({
            isSuccess: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to logout",
        });
    }
}));
exports.default = router;
