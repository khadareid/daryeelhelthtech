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
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const GenerateToken_1 = require("../GenerateToken");
const router = (0, express_1.Router)();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refreshToken = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
            req.headers["x-refresh-token"];
        if (!refreshToken) {
            res.status(400).json({
                isSuccess: false,
                message: "Refresh token is required",
            });
            return;
        }
        let payload;
        try {
            payload = (0, GenerateToken_1.verifyRefreshToken)(refreshToken);
        }
        catch (_b) {
            res.status(401).json({
                isSuccess: false,
                message: "Invalid or expired refresh token",
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: payload.userId },
            select: {
                userid: true,
                email: true,
                role: true,
                isActive: true,
                isSuspended: true,
                deletedAt: true,
            },
        });
        if (!user || user.deletedAt || !user.isActive || user.isSuspended) {
            res.status(401).json({
                isSuccess: false,
                message: "User is not allowed to refresh session",
            });
            return;
        }
        const tokens = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        res.status(200).json({
            isSuccess: true,
            message: "Token refreshed",
            result: tokens,
        });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ isSuccess: false, message: "Could not refresh token" });
    }
}));
router.post("/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Stateless JWTs — client discards tokens
    res.status(200).json({ isSuccess: true, message: "Logged out" });
}));
exports.default = router;
