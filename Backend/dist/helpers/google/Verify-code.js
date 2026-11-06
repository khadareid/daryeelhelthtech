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
exports.verifyCode = void 0;
const client_1 = require("@prisma/client");
const GenerateToken_1 = require("../GenerateToken");
const prisma_1 = require("../../lib/prisma");
const audit_service_1 = require("../../services/audit.service");
const otp_service_1 = require("../../services/otp.service");
const verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400).json({
                message: "Email and verification code are required",
                isSuccess: false,
            });
            return;
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const entry = (0, otp_service_1.consumeOtp)(normalizedEmail, String(code));
        if (!entry) {
            res.status(401).json({
                message: "Invalid or expired verification code",
                isSuccess: false,
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || user.deletedAt) {
            res.status(404).json({ message: "User not found", isSuccess: false });
            return;
        }
        const updated = yield prisma_1.prisma.user.update({
            where: { userid: user.userid },
            data: {
                emailVerified: true,
                lastLoginAt: new Date(),
            },
        });
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: updated.userid,
            email: updated.email,
            role: updated.role,
        });
        const meta = (0, audit_service_1.getClientMeta)(req);
        yield (0, audit_service_1.createAuditLog)({
            action: client_1.AuditAction.LOGIN,
            entity: "User",
            entityId: updated.userid,
            description: "Email OTP verification login",
            userId: updated.userid,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        });
        res.status(200).json({
            message: "Verification successful",
            isSuccess: true,
            result: {
                user: {
                    userId: updated.userid,
                    name: updated.fullName,
                    email: updated.email,
                    phone: updated.phone,
                    image: updated.picture,
                    role: updated.role,
                    emailVerified: true,
                },
                accessToken,
                refreshToken,
            },
            user: {
                userId: updated.userid,
                name: updated.fullName,
                email: updated.email,
                phone: updated.phone,
                image: updated.picture,
                role: updated.role,
                emailVerified: true,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error("Verify code error:", error);
        res.status(500).json({ message: "Server error", isSuccess: false });
    }
});
exports.verifyCode = verifyCode;
