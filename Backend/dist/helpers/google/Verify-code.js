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
const prisma = new client_1.PrismaClient();
const verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        // --------------------------------------------------------
        // Validate input
        // --------------------------------------------------------
        if (!email || !code) {
            res.status(400).json({
                message: 'Email and verification code are required',
                isSuccess: false,
            });
            return;
        }
        // --------------------------------------------------------
        // Find verification code
        // --------------------------------------------------------
        const record = yield prisma.verificationCode.findFirst({
            where: {
                email,
                code,
                purpose: 'EMAIL_VERIFICATION',
                isUsed: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // --------------------------------------------------------
        // Check code
        // --------------------------------------------------------
        if (!record) {
            res.status(401).json({
                message: 'Invalid verification code',
                isSuccess: false,
            });
            return;
        }
        if (record.expiresAt < new Date()) {
            res.status(401).json({
                message: 'Verification code has expired',
                isSuccess: false,
            });
            return;
        }
        // --------------------------------------------------------
        // Find user
        // --------------------------------------------------------
        const user = yield prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            res.status(404).json({
                message: 'User not found',
                isSuccess: false,
            });
            return;
        }
        // --------------------------------------------------------
        // Generate tokens
        // --------------------------------------------------------
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        // --------------------------------------------------------
        // Mark verification code as used
        // --------------------------------------------------------
        yield prisma.verificationCode.update({
            where: {
                verificationcodeid: record.verificationcodeid,
            },
            data: {
                isUsed: true,
            },
        });
        // --------------------------------------------------------
        // Mark email as verified
        // --------------------------------------------------------
        yield prisma.user.update({
            where: {
                userid: user.userid,
            },
            data: {
                emailVerified: true,
                lastLoginAt: new Date(),
            },
        });
        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------
        res.status(200).json({
            message: 'Verification successful',
            isSuccess: true,
            user: {
                userId: user.userid,
                name: user.fullName,
                email: user.email,
                phone: user.phone,
                image: user.picture,
                role: user.role,
                emailVerified: true,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            message: 'Server error',
            isSuccess: false,
        });
    }
});
exports.verifyCode = verifyCode;
