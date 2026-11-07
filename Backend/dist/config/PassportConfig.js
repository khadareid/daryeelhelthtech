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
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const GenerateToken_1 = require("../helpers/GenerateToken");
const codes_1 = require("../utils/codes");
dotenv_1.default.config();
const clean = (value) => (value || "").replace(/"/g, "").trim();
const callbackURL = clean(process.env.GOOGLE_CALLBACK_URL) ||
    "https://daryeelhelthtech.vercel.app/api/v1/auth/google/callback";
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: clean(process.env.GOOGLE_CLIENT_ID),
    clientSecret: clean(process.env.GOOGLE_CLIENT_SECRET),
    callbackURL,
}, (_accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const email = (_c = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
        const name = ((_d = profile.displayName) === null || _d === void 0 ? void 0 : _d.trim()) || "Anonymous";
        const picture = ((_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value) || "";
        if (!email) {
            return done(new Error("Google account does not have an email address"));
        }
        let user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const healthId = yield (0, codes_1.generateUniqueHealthId)();
            user = yield prisma_1.prisma.user.create({
                data: {
                    email,
                    fullName: name,
                    googleId: profile.id,
                    picture,
                    role: client_1.Role.USER,
                    emailVerified: true,
                    passwordHash: null,
                    phone: null,
                    gender: null,
                    dateOfBirth: null,
                    healthId,
                    lastLoginAt: new Date(),
                    medicalProfile: { create: {} },
                },
            });
        }
        else {
            if (user.deletedAt) {
                return done(new Error("This account has been deleted"));
            }
            if (!user.isActive) {
                return done(new Error("This account is inactive"));
            }
            if (user.isSuspended) {
                return done(new Error("This account is suspended"));
            }
            const updates = {
                lastLoginAt: new Date(),
            };
            if (!user.googleId)
                updates.googleId = profile.id;
            if (!user.picture && picture)
                updates.picture = picture;
            if (user.fullName === "Anonymous")
                updates.fullName = name;
            if (!user.healthId)
                updates.healthId = yield (0, codes_1.generateUniqueHealthId)();
            if (!user.emailVerified)
                updates.emailVerified = true;
            user = yield prisma_1.prisma.user.update({
                where: { userid: user.userid },
                data: updates,
            });
            yield prisma_1.prisma.medicalProfile.upsert({
                where: { userId: user.userid },
                create: { userId: user.userid },
                update: {},
            });
        }
        const tokens = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        return done(null, {
            userId: user.userid,
            email: user.email,
            name: user.fullName,
            picture: user.picture || picture,
            role: user.role,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user.userId);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { userid: id } });
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
exports.default = passport_1.default;
