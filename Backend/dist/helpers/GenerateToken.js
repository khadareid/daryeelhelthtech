"use strict";
// helpers/GenerateToken.ts
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.verifyRefreshToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
/* -------------------------------------------------------------
   Config
------------------------------------------------------------- */
const ACCESS_SECRET = (_b = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : process.env.JWT_SECRET_TOKEN) !== null && _b !== void 0 ? _b : "dev-access-secret";
const REFRESH_SECRET = (_c = process.env.JWT_REFRESH_SECRET) !== null && _c !== void 0 ? _c : "dev-refresh-secret";
const ACCESS_TTL = "1d"; // 1 day
const REFRESH_DAYS = 7; // 7 days
/* -------------------------------------------------------------
   generateTokens
   - Creates access + refresh tokens
   - Persists a new Session row
------------------------------------------------------------- */
const generateTokens = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const jwtPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: (_a = payload.tenantId) !== null && _a !== void 0 ? _a : null,
    };
    const accessToken = jsonwebtoken_1.default.sign(jwtPayload, ACCESS_SECRET, {
        expiresIn: ACCESS_TTL,
    });
    const refreshToken = jsonwebtoken_1.default.sign(jwtPayload, REFRESH_SECRET, {
        expiresIn: `${REFRESH_DAYS}d`,
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
    // ⚠️ IMPORTANT: only ONE user id field — see the schema note below.
    yield prisma_1.prisma.session.create({
        data: {
            userId: payload.userId,
            refreshToken,
            expiresAt,
        },
    });
    return { accessToken, refreshToken };
});
exports.generateTokens = generateTokens;
/* -------------------------------------------------------------
   verifyRefreshToken
   - Returns the decoded refresh JWT payload
------------------------------------------------------------- */
const verifyRefreshToken = (token) => {
    var _a, _b;
    const decoded = jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
    if (!decoded.userId || typeof decoded.userId !== "string") {
        throw new Error("Invalid refresh token payload");
    }
    return {
        userId: decoded.userId,
        email: (_a = decoded.email) !== null && _a !== void 0 ? _a : "",
        role: decoded.role,
        tenantId: (_b = decoded.tenantId) !== null && _b !== void 0 ? _b : null,
    };
};
exports.verifyRefreshToken = verifyRefreshToken;
/* -------------------------------------------------------------
   verifyAccessToken  (optional but handy)
   - Use in your auth middleware
------------------------------------------------------------- */
const verifyAccessToken = (token) => {
    var _a, _b;
    const decoded = jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
    if (!decoded.userId || typeof decoded.userId !== "string") {
        throw new Error("Invalid access token payload");
    }
    return {
        userId: decoded.userId,
        email: (_a = decoded.email) !== null && _a !== void 0 ? _a : "",
        role: decoded.role,
        tenantId: (_b = decoded.tenantId) !== null && _b !== void 0 ? _b : null,
    };
};
exports.verifyAccessToken = verifyAccessToken;
