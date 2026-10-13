"use strict";
// src/controllers/UserController.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublicDoctors = exports.changeRole = exports.changePassword = exports.updateUserProfile = exports.getUserProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const GenerateToken_1 = require("../helpers/GenerateToken");
const audit_service_1 = require("../services/audit.service");
/* ==================================================================
   SHARED SELECTS
================================================================== */
/** Safe fields for the authenticated user's own profile. */
const SELF_PROFILE_SELECT = {
    userid: true,
    email: true,
    phone: true,
    fullName: true,
    gender: true,
    dateOfBirth: true,
    avatarUrl: true,
    picture: true,
    role: true,
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: true,
    language: true,
    timezone: true,
    isActive: true,
    isSuspended: true,
    lastLogin: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    profile: {
        select: {
            userprofileid: true,
            healthId: true,
            middleName: true,
            nationalId: true,
            nationality: true,
            maritalStatus: true,
            occupation: true,
            country: true,
            region: true,
            city: true,
            district: true,
            addressLine: true,
            postalCode: true,
            alternatePhone: true,
            alternateEmail: true,
            bloodType: true,
            height: true,
            weight: true,
            preferredLanguage: true,
            preferredContact: true,
        },
    },
    medicalProfile: {
        select: {
            medicalprofileid: true,
            smokingStatus: true,
            alcoholUse: true,
            exerciseFrequency: true,
            dietType: true,
            familyHistory: true,
            surgicalHistory: true,
            hospitalizationHistory: true,
            immunizationRecords: true,
            organDonor: true,
            dnrStatus: true,
            notes: true,
        },
    },
    professionalProfiles: {
        select: {
            professionalprofileid: true,
            professionalType: true,
            licenseNumber: true,
            specialization: true,
            subSpecialty: true,
            yearsOfExperience: true,
            languages: true,
            consultationFee: true,
            currency: true,
            rating: true,
            totalReviews: true,
            totalPatients: true,
            isVerified: true,
            isPubliclyVisible: true,
            publicBio: true,
            publicPhotoUrl: true,
            publicPhone: true,
            publicEmail: true,
        },
    },
};
/** Minimal safe shape for login responses. */
const LOGIN_USER_SELECT = {
    userid: true,
    email: true,
    phone: true,
    fullName: true,
    role: true,
    gender: true,
    dateOfBirth: true,
    avatarUrl: true,
    picture: true,
    emailVerified: true,
    phoneVerified: true,
    language: true,
    timezone: true,
    isActive: true,
    isSuspended: true,
};
/* ==================================================================
   POST /auth/register
================================================================== */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, fullName, name, phone, role, gender, dateOfBirth } = req.body;
        // Accept either `fullName` or `name`
        const displayName = fullName !== null && fullName !== void 0 ? fullName : name;
        // Only these three are required
        if (!email || !password || !displayName) {
            res.status(400).json({
                isSuccess: false,
                message: "Email, password, and name (or fullName) are required",
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                isSuccess: false,
                message: "Password must be at least 6 characters",
            });
            return;
        }
        // Check email uniqueness
        const existingEmail = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            res.status(400).json({
                isSuccess: false,
                message: "Email is already in use",
            });
            return;
        }
        // Only check phone if provided
        if (phone) {
            const existingPhone = yield prisma_1.prisma.user.findUnique({ where: { phone } });
            if (existingPhone) {
                res.status(400).json({
                    isSuccess: false,
                    message: "Phone number is already in use",
                });
                return;
            }
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 12);
        const user = yield prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName: displayName,
                // All optional — default to null
                phone: phone !== null && phone !== void 0 ? phone : null,
                gender: gender !== null && gender !== void 0 ? gender : null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                // Role defaults to USER if not provided
                role: role !== null && role !== void 0 ? role : client_1.Role.USER,
            },
            select: {
                userid: true,
                email: true,
                phone: true,
                fullName: true,
                role: true,
                createdAt: true,
            },
        });
        /* Auto-create an empty UserProfile so update flows work later. */
        yield prisma_1.prisma.userProfile
            .create({ data: { userId: user.userid } })
            .catch(() => {
            /* ignore race: profile already exists */
        });
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        res.status(201).json({
            isSuccess: true,
            message: "User registered successfully",
            result: { user, accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to register user",
        });
    }
});
exports.register = register;
/* ==================================================================
   POST /auth/login
================================================================== */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                isSuccess: false,
                message: "Email and password are required",
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findFirst({
            where: { email, isDeleted: false },
            select: Object.assign(Object.assign({}, LOGIN_USER_SELECT), { passwordHash: true }),
        });
        if (!user || !user.passwordHash) {
            res.status(401).json({
                isSuccess: false,
                message: "Invalid email or password",
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                isSuccess: false,
                message: "Account is deactivated",
            });
            return;
        }
        if (user.isSuspended) {
            res.status(403).json({
                isSuccess: false,
                message: "Account is suspended",
            });
            return;
        }
        const passwordOk = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordOk) {
            res.status(401).json({
                isSuccess: false,
                message: "Invalid email or password",
            });
            return;
        }
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        yield prisma_1.prisma.user.update({
            where: { userid: user.userid },
            data: { lastLogin: new Date(), lastLoginAt: new Date() },
        });
        const { passwordHash: _pw } = user, safeUser = __rest(user, ["passwordHash"]);
        res.status(200).json({
            isSuccess: true,
            message: "Login successful",
            result: { user: safeUser, accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Something went wrong. Please try again.",
        });
    }
});
exports.login = login;
/* ==================================================================
   GET /profile/:userid   (public)
================================================================== */
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const tokenUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const tokenRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const param = String((_c = req.params.userid) !== null && _c !== void 0 ? _c : "");
        const userid = param === "me" ? tokenUserId : param;
        if (!userid) {
            res.status(401).json({
                isSuccess: false,
                message: "Access Denied. No Token Provided.",
            });
            return;
        }
        const isOwner = tokenUserId === userid;
        if (!isOwner) {
            const { canAccessPatientData } = yield Promise.resolve().then(() => __importStar(require("../services/healthcareAccess.service")));
            const access = yield canAccessPatientData({
                actorUserId: tokenUserId || "",
                actorRole: tokenRole || client_1.Role.USER,
                patientUserId: userid,
                requireConsent: true,
            });
            if (!access.ok) {
                res.status(access.status).json({
                    isSuccess: false,
                    message: access.message,
                });
                return;
            }
        }
        const user = yield prisma_1.prisma.user.findFirst({
            where: { userid, isDeleted: false },
            select: Object.assign({ 
                // ─── Core user ───────────────────────────────
                userid: true, email: true, phone: true, fullName: true, gender: true, dateOfBirth: true, avatarUrl: true, picture: true, role: true, googleId: true, lastLogin: true, lastLoginAt: true, emailVerified: true, phoneVerified: true, twoFactorEnabled: true, language: true, timezone: true, isActive: true, isSuspended: true, isDeleted: true, deletedAt: true, createdAt: true, updatedAt: true, 
                // ─── Profile ─────────────────────────────────
                profile: {
                    select: {
                        userprofileid: true,
                        healthId: true,
                        middleName: true,
                        nationalId: true,
                        nationality: true,
                        maritalStatus: true,
                        occupation: true,
                        country: true,
                        region: true,
                        city: true,
                        district: true,
                        addressLine: true,
                        postalCode: true,
                        alternatePhone: true,
                        alternateEmail: true,
                        bloodType: true,
                        height: true,
                        weight: true,
                        preferredLanguage: true,
                        preferredContact: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }, 
                // ─── Medical profile ─────────────────────────
                medicalProfile: true, 
                // ─── Professional profiles ───────────────────
                professionalProfiles: {
                    where: { isActive: true, deletedAt: null },
                    select: {
                        professionalprofileid: true,
                        professionalType: true,
                        licenseNumber: true,
                        licenseExpiry: true,
                        certifications: true,
                        specialization: true,
                        subSpecialty: true,
                        qualifications: true,
                        isPubliclyVisible: true,
                        publicBio: true,
                        publicPhotoUrl: true,
                        publicCoverUrl: true,
                        yearsOfExperience: true,
                        languages: true,
                        consultationFee: true,
                        currency: true,
                        rating: true,
                        totalReviews: true,
                        totalPatients: true,
                        publicPhone: true,
                        publicEmail: true,
                        website: true,
                        linkedin: true,
                        twitter: true,
                        facebook: true,
                        isVerified: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }, 
                // ─── Emergency contacts ──────────────────────
                emergencyContacts: {
                    orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
                }, 
                // ─── Allergies ───────────────────────────────
                allergies: {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" },
                }, 
                // ─── Chronic conditions ──────────────────────
                chronicConditions: {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" },
                }, 
                // ─── Current medications ─────────────────────
                medications: {
                    where: { isActive: true },
                    orderBy: { startedAt: "desc" },
                }, 
                // ─── Latest vitals ───────────────────────────
                vitalSigns: {
                    orderBy: { recordedAt: "desc" },
                    take: 10,
                }, 
                // ─── Recent daily logs ───────────────────────
                dailyHealthLogs: {
                    orderBy: { date: "desc" },
                    take: 7,
                }, 
                // ─── Upcoming appointments ───────────────────
                appointments: {
                    where: {
                        status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
                    },
                    orderBy: { scheduledAt: "asc" },
                    take: 5,
                }, 
                // ─── Recent prescriptions ────────────────────
                prescriptions: {
                    orderBy: { issuedAt: "desc" },
                    take: 5,
                }, 
                // ─── Recent lab orders / results ─────────────
                labOrders: {
                    orderBy: { orderedAt: "desc" },
                    take: 5,
                    include: {
                        result: true,
                    },
                }, 
                // ─── Wallet ──────────────────────────────────
                wallets: {
                    where: { isActive: true },
                    select: {
                        walletid: true,
                        balance: true,
                        currency: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }, 
                // ─── Counts (lightweight summary) ────────────
                _count: {
                    select: {
                        appointments: true,
                        prescriptions: true,
                        labOrders: true,
                        labResults: true,
                        documents: true,
                        notifications: true,
                        healthRecords: true,
                        vitalSigns: true,
                        consentsGranted: true,
                    },
                } }, (isOwner
                ? {
                    sessions: {
                        where: { revokedAt: null },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: {
                            sessionid: true,
                            userAgent: true,
                            ipAddress: true,
                            deviceInfo: true,
                            expiresAt: true,
                            createdAt: true,
                        },
                    },
                }
                : {})),
        });
        if (!user) {
            res.status(404).json({ isSuccess: false, message: "User not found" });
            return;
        }
        res.status(200).json({ isSuccess: true, user });
    }
    catch (error) {
        console.error("getUserProfile error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load profile",
        });
    }
});
exports.getUserProfile = getUserProfile;
/** Immediate self-service roles (no admin approval). */
const SELF_ROLES = new Set(["USER", "PATIENT"]);
/** Clinical roles — create a ProfessionalApplication; Super Admin must approve. */
const APPLY_ROLES = new Set([
    "DOCTOR",
    "NURSE",
    "MIDWIFE",
    "LAB_TECH",
    "PHARMACIST",
    "RECEPTIONIST",
]);
const GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);
const BLOOD_TYPES = new Set([
    "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN",
]);
function ownerFromRequest(req) {
    var _a, _b;
    const tokenUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const param = String((_b = req.params.userid) !== null && _b !== void 0 ? _b : "");
    const userid = param === "me" ? tokenUserId : param;
    if (!tokenUserId || !userid) {
        return { ok: false, status: 401, message: "Access Denied. No Token Provided." };
    }
    if (tokenUserId !== userid) {
        return { ok: false, status: 403, message: "You can only change your own account" };
    }
    return { ok: true, userid };
}
/* ==================================================================
   PUT /profile/:userid
================================================================== */
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const owner = ownerFromRequest(req);
        if (!owner.ok) {
            res.status(owner.status).json({ isSuccess: false, message: owner.message });
            return;
        }
        const body = req.body;
        if (body.email) {
            const taken = yield prisma_1.prisma.user.findFirst({
                where: { email: body.email, NOT: { userid: owner.userid } },
            });
            if (taken) {
                res.status(400).json({ isSuccess: false, message: "Email is already in use" });
                return;
            }
        }
        if (body.phone) {
            const taken = yield prisma_1.prisma.user.findFirst({
                where: { phone: body.phone, NOT: { userid: owner.userid } },
            });
            if (taken) {
                res.status(400).json({ isSuccess: false, message: "Phone number is already in use" });
                return;
            }
        }
        if (body.gender && !GENDERS.has(body.gender)) {
            res.status(400).json({ isSuccess: false, message: "Invalid gender" });
            return;
        }
        const profile = body.profile;
        if ((profile === null || profile === void 0 ? void 0 : profile.bloodType) && !BLOOD_TYPES.has(profile.bloodType)) {
            res.status(400).json({ isSuccess: false, message: "Invalid blood type" });
            return;
        }
        const user = yield prisma_1.prisma.user.update({
            where: { userid: owner.userid },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (body.fullName !== undefined ? { fullName: body.fullName } : {})), (body.email !== undefined ? { email: body.email } : {})), (body.phone !== undefined ? { phone: body.phone || null } : {})), (body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl || null } : {})), (body.picture !== undefined ? { picture: body.picture || null } : {})), (body.gender !== undefined
                ? { gender: (body.gender || null) }
                : {})), (body.dateOfBirth !== undefined
                ? { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }
                : {})), (body.language !== undefined ? { language: body.language } : {})), (body.timezone !== undefined ? { timezone: body.timezone } : {})), (profile
                ? {
                    profile: {
                        upsert: {
                            create: {
                                nationality: (_a = profile.nationality) !== null && _a !== void 0 ? _a : undefined,
                                country: (_b = profile.country) !== null && _b !== void 0 ? _b : undefined,
                                region: (_c = profile.region) !== null && _c !== void 0 ? _c : undefined,
                                city: (_d = profile.city) !== null && _d !== void 0 ? _d : undefined,
                                district: (_e = profile.district) !== null && _e !== void 0 ? _e : undefined,
                                addressLine: (_f = profile.addressLine) !== null && _f !== void 0 ? _f : undefined,
                                occupation: (_g = profile.occupation) !== null && _g !== void 0 ? _g : undefined,
                                maritalStatus: (_h = profile.maritalStatus) !== null && _h !== void 0 ? _h : undefined,
                                bloodType: (_j = profile.bloodType) !== null && _j !== void 0 ? _j : undefined,
                                height: (_k = profile.height) !== null && _k !== void 0 ? _k : undefined,
                                weight: (_l = profile.weight) !== null && _l !== void 0 ? _l : undefined,
                                alternatePhone: (_m = profile.alternatePhone) !== null && _m !== void 0 ? _m : undefined,
                                preferredLanguage: (_o = profile.preferredLanguage) !== null && _o !== void 0 ? _o : undefined,
                                preferredContact: (_p = profile.preferredContact) !== null && _p !== void 0 ? _p : undefined,
                            },
                            update: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (profile.nationality !== undefined ? { nationality: profile.nationality } : {})), (profile.country !== undefined ? { country: profile.country } : {})), (profile.region !== undefined ? { region: profile.region } : {})), (profile.city !== undefined ? { city: profile.city } : {})), (profile.district !== undefined ? { district: profile.district } : {})), (profile.addressLine !== undefined ? { addressLine: profile.addressLine } : {})), (profile.occupation !== undefined ? { occupation: profile.occupation } : {})), (profile.maritalStatus !== undefined ? { maritalStatus: profile.maritalStatus } : {})), (profile.bloodType !== undefined
                                ? { bloodType: profile.bloodType }
                                : {})), (profile.height !== undefined ? { height: profile.height } : {})), (profile.weight !== undefined ? { weight: profile.weight } : {})), (profile.alternatePhone !== undefined
                                ? { alternatePhone: profile.alternatePhone }
                                : {})), (profile.preferredLanguage !== undefined
                                ? { preferredLanguage: profile.preferredLanguage }
                                : {})), (profile.preferredContact !== undefined
                                ? { preferredContact: profile.preferredContact }
                                : {})),
                        },
                    },
                }
                : {})),
            select: {
                userid: true,
                email: true,
                phone: true,
                fullName: true,
                role: true,
                gender: true,
                dateOfBirth: true,
                avatarUrl: true,
                picture: true,
                emailVerified: true,
                phoneVerified: true,
                language: true,
                timezone: true,
            },
        });
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        res.status(200).json({
            isSuccess: true,
            message: "Profile updated",
            user,
            result: { accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error("updateUserProfile error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update profile" });
    }
});
exports.updateUserProfile = updateUserProfile;
/* ==================================================================
   PUT /profile/:userid/password
================================================================== */
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const owner = ownerFromRequest(req);
        if (!owner.ok) {
            res.status(owner.status).json({ isSuccess: false, message: owner.message });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                isSuccess: false,
                message: "Current password and new password are required",
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                isSuccess: false,
                message: "New password must be at least 6 characters",
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: owner.userid },
            select: { passwordHash: true },
        });
        if (!(user === null || user === void 0 ? void 0 : user.passwordHash)) {
            res.status(400).json({ isSuccess: false, message: "Password login is not set" });
            return;
        }
        const matches = yield bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!matches) {
            res.status(400).json({ isSuccess: false, message: "Current password is incorrect" });
            return;
        }
        yield prisma_1.prisma.user.update({
            where: { userid: owner.userid },
            data: { passwordHash: yield bcryptjs_1.default.hash(newPassword, 12) },
        });
        res.status(200).json({ isSuccess: true, message: "Password changed" });
    }
    catch (error) {
        console.error("changePassword error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to change password" });
    }
});
exports.changePassword = changePassword;
/* ==================================================================
   PATCH /profile/:userid/role
================================================================== */
const changeRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const owner = ownerFromRequest(req);
        if (!owner.ok) {
            res.status(owner.status).json({ isSuccess: false, message: owner.message });
            return;
        }
        const { role, reason } = req.body;
        const reasonText = typeof reason === "string" ? reason.trim() : "";
        if (!role || (!SELF_ROLES.has(role) && !APPLY_ROLES.has(role))) {
            res.status(400).json({
                isSuccess: false,
                message: "Choose a valid role",
            });
            return;
        }
        const existing = yield prisma_1.prisma.user.findUnique({
            where: { userid: owner.userid },
            select: {
                role: true,
                isActive: true,
                isSuspended: true,
                email: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
                picture: true,
                emailVerified: true,
                phoneVerified: true,
            },
        });
        if (!(existing === null || existing === void 0 ? void 0 : existing.isActive) || existing.isSuspended) {
            res.status(403).json({ isSuccess: false, message: "Account is not active" });
            return;
        }
        if (existing.role === client_1.Role.SUPER_ADMIN || existing.role === client_1.Role.ADMIN) {
            res.status(403).json({
                isSuccess: false,
                message: "Admin roles can only be changed by Super Admin",
            });
            return;
        }
        // Clinical / staff roles → application queue (never self-grant)
        if (APPLY_ROLES.has(role)) {
            if (reasonText.length < 10) {
                res.status(400).json({
                    isSuccess: false,
                    message: "Please explain why you need this role (at least 10 characters)",
                });
                return;
            }
            const open = yield prisma_1.prisma.professionalApplication.findFirst({
                where: {
                    userId: owner.userid,
                    requestedRole: role,
                    status: {
                        in: ["PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"],
                    },
                },
            });
            if (open) {
                res.status(409).json({
                    isSuccess: false,
                    message: "You already have an open application for this role",
                    result: { application: open, applicationPending: true },
                });
                return;
            }
            const application = yield prisma_1.prisma.professionalApplication.create({
                data: {
                    userId: owner.userid,
                    requestedRole: role,
                    notes: reasonText,
                    status: "PENDING",
                },
            });
            yield prisma_1.prisma.notification.create({
                data: {
                    userId: owner.userid,
                    title: "Role application submitted",
                    body: `Your request to become ${role.replace(/_/g, " ")} is pending Super Admin review.`,
                    type: "PROFESSIONAL_APPLICATION",
                    channel: "IN_APP",
                    metadata: {
                        applicationId: application.professionalapplicationid,
                        reason: reasonText,
                    },
                },
            });
            yield (0, audit_service_1.createAuditLog)({
                userId: owner.userid,
                action: "ROLE_APPLICATION_SUBMIT",
                entity: "ProfessionalApplication",
                entityId: application.professionalapplicationid,
                metadata: { requestedRole: role, reason: reasonText },
            });
            res.status(200).json({
                isSuccess: true,
                message: "Application submitted. Your current role stays the same until Super Admin approves.",
                user: {
                    userid: owner.userid,
                    email: existing.email,
                    fullName: existing.fullName,
                    role: existing.role,
                    phone: existing.phone,
                    avatarUrl: existing.avatarUrl,
                    picture: existing.picture,
                    emailVerified: existing.emailVerified,
                    phoneVerified: existing.phoneVerified,
                },
                result: { applicationPending: true, application },
            });
            return;
        }
        // USER / PATIENT — immediate switch (still block if currently clinical without admin)
        if (existing.role === client_1.Role.DOCTOR ||
            existing.role === client_1.Role.NURSE ||
            existing.role === client_1.Role.MIDWIFE ||
            existing.role === client_1.Role.LAB_TECH ||
            existing.role === client_1.Role.PHARMACIST ||
            existing.role === client_1.Role.RECEPTIONIST) {
            res.status(403).json({
                isSuccess: false,
                message: "Professional roles can only be changed by Super Admin. Contact support if you need to switch.",
            });
            return;
        }
        const user = yield prisma_1.prisma.user.update({
            where: { userid: owner.userid },
            data: { role: role },
            select: {
                userid: true,
                email: true,
                fullName: true,
                role: true,
                phone: true,
                avatarUrl: true,
                picture: true,
                emailVerified: true,
                phoneVerified: true,
            },
        });
        yield (0, audit_service_1.createAuditLog)({
            userId: owner.userid,
            action: "ROLE_SELF_CHANGE",
            entity: "User",
            entityId: owner.userid,
            metadata: {
                from: existing.role,
                to: role,
                reason: reasonText || null,
            },
        });
        const { accessToken, refreshToken } = yield (0, GenerateToken_1.generateTokens)({
            userId: user.userid,
            email: user.email,
            role: user.role,
        });
        res.status(200).json({
            isSuccess: true,
            message: "Role updated",
            user,
            result: { accessToken, refreshToken, applicationPending: false },
        });
    }
    catch (error) {
        console.error("changeRole error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to change role" });
    }
});
exports.changeRole = changeRole;
/* ==================================================================
   GET /doctors  (public care-team directory)
================================================================== */
const listPublicDoctors = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctors = yield prisma_1.prisma.professionalProfile.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                isPubliclyVisible: true,
                professionalType: { in: ["DOCTOR", "MIDWIFE", "NURSE"] },
            },
            orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
            take: 40,
            select: {
                professionalprofileid: true,
                professionalType: true,
                specialization: true,
                subSpecialty: true,
                yearsOfExperience: true,
                consultationFee: true,
                currency: true,
                rating: true,
                totalReviews: true,
                publicBio: true,
                publicPhotoUrl: true,
                isVerified: true,
                user: {
                    select: {
                        userid: true,
                        fullName: true,
                        picture: true,
                        avatarUrl: true,
                        profile: {
                            select: {
                                city: true,
                                region: true,
                                country: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            isSuccess: true,
            result: doctors.map((item) => {
                var _a, _b, _c, _d, _e;
                return ({
                    id: item.professionalprofileid,
                    userId: item.user.userid,
                    name: item.user.fullName,
                    specialty: item.specialization || item.professionalType,
                    subSpecialty: item.subSpecialty,
                    experienceYears: (_a = item.yearsOfExperience) !== null && _a !== void 0 ? _a : 0,
                    fee: item.consultationFee != null ? Number(item.consultationFee) : 15,
                    currency: item.currency || "USD",
                    rating: (_b = item.rating) !== null && _b !== void 0 ? _b : 0,
                    reviews: (_c = item.totalReviews) !== null && _c !== void 0 ? _c : 0,
                    bio: item.publicBio || "Trusted clinician on Daryeel Health.",
                    image: item.publicPhotoUrl || item.user.avatarUrl || item.user.picture,
                    city: ((_d = item.user.profile) === null || _d === void 0 ? void 0 : _d.city) || ((_e = item.user.profile) === null || _e === void 0 ? void 0 : _e.region) || "Somaliland",
                    verified: item.isVerified,
                    availableToday: true,
                });
            }),
        });
    }
    catch (error) {
        console.error("listPublicDoctors error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load doctors",
        });
    }
});
exports.listPublicDoctors = listPublicDoctors;
