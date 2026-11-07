"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateDoctor = exports.adminDeleteDoctor = exports.adminUpdateDoctor = exports.adminListDoctors = exports.listPendingDoctors = exports.adminVerifyDoctor = exports.upsertMyDoctorProfile = exports.getMyDoctorProfile = exports.getDoctorById = exports.listDoctors = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const listDoctors = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {
        isActive: true,
        verificationStatus: client_1.DoctorVerificationStatus.VERIFIED,
    };
    if (query.specialty) {
        where.specialty = {
            contains: String(query.specialty),
            mode: "insensitive",
        };
    }
    if (query.city) {
        where.city = { contains: String(query.city), mode: "insensitive" };
    }
    if (query.q) {
        const q = String(query.q);
        where.OR = [
            { fullName: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
            { clinicName: { contains: q, mode: "insensitive" } },
        ];
    }
    if (query.includeUnverified === "true") {
        delete where.verificationStatus;
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.doctor.findMany({
            where,
            include: {
                user: {
                    select: {
                        userid: true,
                        email: true,
                        picture: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
            skip,
            take,
        }),
        prisma_1.prisma.doctor.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listDoctors = listDoctors;
const getDoctorById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield prisma_1.prisma.doctor.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    userid: true,
                    email: true,
                    picture: true,
                    avatarUrl: true,
                },
            },
            doctorReviews: {
                where: { isPublished: true },
                take: 20,
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!doctor)
        throw new ownership_1.HttpError(404, "Doctor not found");
    return doctor;
});
exports.getDoctorById = getDoctorById;
const getMyDoctorProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.doctor.findUnique({ where: { userId } });
});
exports.getMyDoctorProfile = getMyDoctorProfile;
const upsertMyDoctorProfile = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
    const existing = yield prisma_1.prisma.doctor.findUnique({ where: { userId } });
    const fullName = body.fullName
        ? (0, validation_1.requireString)(body.fullName, "fullName")
        : existing === null || existing === void 0 ? void 0 : existing.fullName;
    const specialty = body.specialty
        ? (0, validation_1.requireString)(body.specialty, "specialty")
        : existing === null || existing === void 0 ? void 0 : existing.specialty;
    if (!fullName || !specialty) {
        throw new ownership_1.HttpError(400, "fullName and specialty are required");
    }
    const data = {
        userId,
        fullName,
        specialty,
        profileImage: (_b = (_a = (0, validation_1.optionalString)(body.profileImage)) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.profileImage) !== null && _b !== void 0 ? _b : null,
        gender: (_d = (_c = (0, validation_1.parseEnum)(body.gender, Object.values(client_1.Gender), "gender")) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.gender) !== null && _d !== void 0 ? _d : null,
        subSpecialty: (_f = (_e = (0, validation_1.optionalString)(body.subSpecialty)) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.subSpecialty) !== null && _f !== void 0 ? _f : null,
        qualification: (_h = (_g = (0, validation_1.optionalString)(body.qualification)) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.qualification) !== null && _h !== void 0 ? _h : null,
        university: (_k = (_j = (0, validation_1.optionalString)(body.university)) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.university) !== null && _k !== void 0 ? _k : null,
        yearsExperience: (_m = (_l = (0, validation_1.parseNumber)(body.yearsExperience, "yearsExperience")) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.yearsExperience) !== null && _m !== void 0 ? _m : null,
        bio: (_p = (_o = (0, validation_1.optionalString)(body.bio)) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.bio) !== null && _p !== void 0 ? _p : null,
        languages: Array.isArray(body.languages)
            ? body.languages.map(String)
            : (_q = existing === null || existing === void 0 ? void 0 : existing.languages) !== null && _q !== void 0 ? _q : [],
        licenseNumber: (_s = (_r = (0, validation_1.optionalString)(body.licenseNumber)) !== null && _r !== void 0 ? _r : existing === null || existing === void 0 ? void 0 : existing.licenseNumber) !== null && _s !== void 0 ? _s : null,
        licenseAuthority: (_v = (_t = (0, validation_1.optionalString)(body.licenseAuthority)) !== null && _t !== void 0 ? _t : existing === null || existing === void 0 ? void 0 : existing.licenseAuthority) !== null && _v !== void 0 ? _v : null,
        consultationEnabled: (0, validation_1.parseBool)(body.consultationEnabled, (_w = existing === null || existing === void 0 ? void 0 : existing.consultationEnabled) !== null && _w !== void 0 ? _w : true),
        videoConsultationEnabled: (0, validation_1.parseBool)(body.videoConsultationEnabled, (_x = existing === null || existing === void 0 ? void 0 : existing.videoConsultationEnabled) !== null && _x !== void 0 ? _x : false),
        chatConsultationEnabled: (0, validation_1.parseBool)(body.chatConsultationEnabled, (_y = existing === null || existing === void 0 ? void 0 : existing.chatConsultationEnabled) !== null && _y !== void 0 ? _y : false),
        consultationFee: (_z = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee")) !== null && _z !== void 0 ? _z : ((existing === null || existing === void 0 ? void 0 : existing.consultationFee) ? Number(existing.consultationFee) : null),
        videoConsultationFee: (_0 = (0, validation_1.parseNumber)(body.videoConsultationFee, "videoConsultationFee")) !== null && _0 !== void 0 ? _0 : ((existing === null || existing === void 0 ? void 0 : existing.videoConsultationFee)
            ? Number(existing.videoConsultationFee)
            : null),
        chatConsultationFee: (_1 = (0, validation_1.parseNumber)(body.chatConsultationFee, "chatConsultationFee")) !== null && _1 !== void 0 ? _1 : ((existing === null || existing === void 0 ? void 0 : existing.chatConsultationFee)
            ? Number(existing.chatConsultationFee)
            : null),
        currency: (0, validation_1.optionalString)(body.currency) || (existing === null || existing === void 0 ? void 0 : existing.currency) || "USD",
        isAvailable: (0, validation_1.parseBool)(body.isAvailable, (_2 = existing === null || existing === void 0 ? void 0 : existing.isAvailable) !== null && _2 !== void 0 ? _2 : true),
        isOnline: (0, validation_1.parseBool)(body.isOnline, (_3 = existing === null || existing === void 0 ? void 0 : existing.isOnline) !== null && _3 !== void 0 ? _3 : false),
        clinicName: (_5 = (_4 = (0, validation_1.optionalString)(body.clinicName)) !== null && _4 !== void 0 ? _4 : existing === null || existing === void 0 ? void 0 : existing.clinicName) !== null && _5 !== void 0 ? _5 : null,
        city: (_7 = (_6 = (0, validation_1.optionalString)(body.city)) !== null && _6 !== void 0 ? _6 : existing === null || existing === void 0 ? void 0 : existing.city) !== null && _7 !== void 0 ? _7 : null,
        country: (_9 = (_8 = (0, validation_1.optionalString)(body.country)) !== null && _8 !== void 0 ? _8 : existing === null || existing === void 0 ? void 0 : existing.country) !== null && _9 !== void 0 ? _9 : null,
    };
    if (existing) {
        const { userId: _u } = data, update = __rest(data, ["userId"]);
        // Allow rejected applicants to re-submit for review
        if (existing.verificationStatus === client_1.DoctorVerificationStatus.REJECTED &&
            body.resubmit === true) {
            update.verificationStatus =
                client_1.DoctorVerificationStatus.PENDING;
            update.rejectionReason = null;
            update.verifiedAt = null;
        }
        return prisma_1.prisma.doctor.update({ where: { userId }, data: update });
    }
    return prisma_1.prisma.doctor.create({
        data: Object.assign(Object.assign({}, data), { verificationStatus: client_1.DoctorVerificationStatus.PENDING, isActive: true, isAvailable: false }),
    });
});
exports.upsertMyDoctorProfile = upsertMyDoctorProfile;
const adminVerifyDoctor = (id, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { id } });
    if (!doctor)
        throw new ownership_1.HttpError(404, "Doctor not found");
    const status = (0, validation_1.parseEnum)((_a = body.status) !== null && _a !== void 0 ? _a : body.verificationStatus, Object.values(client_1.DoctorVerificationStatus), "status", true);
    return prisma_1.prisma.doctor.update({
        where: { id },
        data: {
            verificationStatus: status,
            verifiedAt: status === client_1.DoctorVerificationStatus.VERIFIED ? new Date() : null,
            rejectionReason: status === client_1.DoctorVerificationStatus.REJECTED
                ? (_b = (0, validation_1.optionalString)(body.rejectionReason)) !== null && _b !== void 0 ? _b : null
                : null,
            isActive: status === client_1.DoctorVerificationStatus.SUSPENDED
                ? false
                : (0, validation_1.parseBool)(body.isActive, doctor.isActive),
        },
    });
});
exports.adminVerifyDoctor = adminVerifyDoctor;
const listPendingDoctors = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {
        verificationStatus: client_1.DoctorVerificationStatus.PENDING,
    };
    const [items, total] = yield Promise.all([
        prisma_1.prisma.doctor.findMany({
            where,
            include: {
                user: { select: { userid: true, email: true, fullName: true } },
            },
            orderBy: { createdAt: "asc" },
            skip,
            take,
        }),
        prisma_1.prisma.doctor.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listPendingDoctors = listPendingDoctors;
const adminListDoctors = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.status) {
        where.verificationStatus = (0, validation_1.parseEnum)(query.status, Object.values(client_1.DoctorVerificationStatus), "status", true);
    }
    if (query.q) {
        const q = String(query.q);
        where.OR = [
            { fullName: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
            { clinicName: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
        ];
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.doctor.findMany({
            where,
            include: {
                user: {
                    select: {
                        userid: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.doctor.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.adminListDoctors = adminListDoctors;
/** Admin updates doctor profile, fees, availability, and verification flags. */
const adminUpdateDoctor = (id, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const doctor = yield prisma_1.prisma.doctor.findUnique({
        where: { id },
        include: { user: { select: { userid: true, phone: true } } },
    });
    if (!doctor)
        throw new ownership_1.HttpError(404, "Doctor not found");
    const data = {};
    if (body.fullName !== undefined) {
        data.fullName = (0, validation_1.requireString)(body.fullName, "fullName");
    }
    if (body.specialty !== undefined) {
        data.specialty = (0, validation_1.requireString)(body.specialty, "specialty");
    }
    if (body.subSpecialty !== undefined) {
        data.subSpecialty = (0, validation_1.optionalString)(body.subSpecialty);
    }
    if (body.qualification !== undefined) {
        data.qualification = (0, validation_1.optionalString)(body.qualification);
    }
    if (body.university !== undefined) {
        data.university = (0, validation_1.optionalString)(body.university);
    }
    if (body.yearsExperience !== undefined) {
        data.yearsExperience = (0, validation_1.parseNumber)(body.yearsExperience, "yearsExperience");
    }
    if (body.bio !== undefined)
        data.bio = (0, validation_1.optionalString)(body.bio);
    if (body.licenseNumber !== undefined) {
        data.licenseNumber = (0, validation_1.optionalString)(body.licenseNumber);
    }
    if (body.licenseAuthority !== undefined) {
        data.licenseAuthority = (0, validation_1.optionalString)(body.licenseAuthority);
    }
    if (body.clinicName !== undefined) {
        data.clinicName = (0, validation_1.optionalString)(body.clinicName);
    }
    if (body.city !== undefined)
        data.city = (0, validation_1.optionalString)(body.city);
    if (body.country !== undefined)
        data.country = (0, validation_1.optionalString)(body.country);
    if (body.currency !== undefined) {
        data.currency = (0, validation_1.optionalString)(body.currency) || "USD";
    }
    if (body.consultationFee !== undefined) {
        data.consultationFee = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee");
    }
    if (body.videoConsultationFee !== undefined) {
        data.videoConsultationFee = (0, validation_1.parseNumber)(body.videoConsultationFee, "videoConsultationFee");
    }
    if (body.chatConsultationFee !== undefined) {
        data.chatConsultationFee = (0, validation_1.parseNumber)(body.chatConsultationFee, "chatConsultationFee");
    }
    if (body.consultationEnabled !== undefined) {
        data.consultationEnabled = (0, validation_1.parseBool)(body.consultationEnabled, true);
    }
    if (body.videoConsultationEnabled !== undefined) {
        data.videoConsultationEnabled = (0, validation_1.parseBool)(body.videoConsultationEnabled, false);
    }
    if (body.chatConsultationEnabled !== undefined) {
        data.chatConsultationEnabled = (0, validation_1.parseBool)(body.chatConsultationEnabled, false);
    }
    if (body.isAvailable !== undefined) {
        data.isAvailable = (0, validation_1.parseBool)(body.isAvailable, true);
    }
    if (body.isOnline !== undefined) {
        data.isOnline = (0, validation_1.parseBool)(body.isOnline, false);
    }
    if (body.isActive !== undefined) {
        data.isActive = (0, validation_1.parseBool)(body.isActive, true);
    }
    if (body.verificationStatus !== undefined || body.status !== undefined) {
        const status = (0, validation_1.parseEnum)((_a = body.verificationStatus) !== null && _a !== void 0 ? _a : body.status, Object.values(client_1.DoctorVerificationStatus), "verificationStatus", true);
        data.verificationStatus = status;
        data.verifiedAt =
            status === client_1.DoctorVerificationStatus.VERIFIED ? new Date() : null;
        if (status === client_1.DoctorVerificationStatus.REJECTED) {
            data.rejectionReason = (_b = (0, validation_1.optionalString)(body.rejectionReason)) !== null && _b !== void 0 ? _b : null;
        }
        if (status === client_1.DoctorVerificationStatus.SUSPENDED) {
            data.isActive = false;
        }
    }
    if (body.rejectionReason !== undefined) {
        data.rejectionReason = (0, validation_1.optionalString)(body.rejectionReason);
    }
    const phone = (0, validation_1.optionalString)(body.phone);
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        if (phone !== undefined) {
            yield tx.user.update({
                where: { userid: doctor.userId },
                data: { phone },
            });
        }
        return tx.doctor.update({
            where: { id },
            data,
            include: {
                user: {
                    select: {
                        userid: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        isActive: true,
                    },
                },
            },
        });
    }));
    return updated;
});
exports.adminUpdateDoctor = adminUpdateDoctor;
/** Soft-deactivate a doctor (keeps history; hides from directory). */
const adminDeleteDoctor = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { id } });
    if (!doctor)
        throw new ownership_1.HttpError(404, "Doctor not found");
    return prisma_1.prisma.doctor.update({
        where: { id },
        data: {
            isActive: false,
            isAvailable: false,
            verificationStatus: client_1.DoctorVerificationStatus.SUSPENDED,
        },
        include: {
            user: {
                select: {
                    userid: true,
                    email: true,
                    fullName: true,
                    phone: true,
                },
            },
        },
    });
});
exports.adminDeleteDoctor = adminDeleteDoctor;
/** Admin creates a login + verified doctor profile in one step. */
const adminCreateDoctor = (body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _v, _w;
    const bcrypt = yield Promise.resolve().then(() => __importStar(require("bcryptjs")));
    const { generateUniqueHealthId } = yield Promise.resolve().then(() => __importStar(require("../utils/codes")));
    const email = (0, validation_1.requireString)(body.email, "email").toLowerCase();
    const password = (0, validation_1.requireString)(body.password, "password", { min: 6 });
    const fullName = (0, validation_1.requireString)((_a = body.fullName) !== null && _a !== void 0 ? _a : body.name, "fullName");
    const specialty = (0, validation_1.requireString)(body.specialty, "specialty");
    const existing = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
        const hasDoctor = yield prisma_1.prisma.doctor.findUnique({
            where: { userId: existing.userid },
        });
        if (hasDoctor)
            throw new ownership_1.HttpError(409, "This user is already a doctor");
        const doctor = yield prisma_1.prisma.doctor.create({
            data: {
                userId: existing.userid,
                fullName,
                specialty,
                subSpecialty: (_b = (0, validation_1.optionalString)(body.subSpecialty)) !== null && _b !== void 0 ? _b : null,
                licenseNumber: (_c = (0, validation_1.optionalString)(body.licenseNumber)) !== null && _c !== void 0 ? _c : null,
                qualification: (_d = (0, validation_1.optionalString)(body.qualification)) !== null && _d !== void 0 ? _d : null,
                clinicName: (_e = (0, validation_1.optionalString)(body.clinicName)) !== null && _e !== void 0 ? _e : null,
                city: (_f = (0, validation_1.optionalString)(body.city)) !== null && _f !== void 0 ? _f : null,
                country: (_g = (0, validation_1.optionalString)(body.country)) !== null && _g !== void 0 ? _g : "Somaliland",
                consultationFee: (_h = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee")) !== null && _h !== void 0 ? _h : null,
                currency: (_j = (0, validation_1.optionalString)(body.currency)) !== null && _j !== void 0 ? _j : "USD",
                bio: (_k = (0, validation_1.optionalString)(body.bio)) !== null && _k !== void 0 ? _k : null,
                verificationStatus: client_1.DoctorVerificationStatus.VERIFIED,
                verifiedAt: new Date(),
                isActive: true,
                isAvailable: (0, validation_1.parseBool)(body.isAvailable, true),
                videoConsultationEnabled: (0, validation_1.parseBool)(body.videoConsultationEnabled, false),
                chatConsultationEnabled: (0, validation_1.parseBool)(body.chatConsultationEnabled, false),
            },
            include: {
                user: { select: { userid: true, email: true, fullName: true, phone: true } },
            },
        });
        return doctor;
    }
    const passwordHash = yield bcrypt.hash(password, 10);
    const healthId = yield generateUniqueHealthId();
    const user = yield prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            fullName,
            phone: (_l = (0, validation_1.optionalString)(body.phone)) !== null && _l !== void 0 ? _l : null,
            role: "USER",
            healthId,
            emailVerified: true,
            medicalProfile: { create: {} },
            doctor: {
                create: {
                    fullName,
                    specialty,
                    subSpecialty: (_m = (0, validation_1.optionalString)(body.subSpecialty)) !== null && _m !== void 0 ? _m : null,
                    licenseNumber: (_o = (0, validation_1.optionalString)(body.licenseNumber)) !== null && _o !== void 0 ? _o : null,
                    qualification: (_p = (0, validation_1.optionalString)(body.qualification)) !== null && _p !== void 0 ? _p : null,
                    clinicName: (_q = (0, validation_1.optionalString)(body.clinicName)) !== null && _q !== void 0 ? _q : null,
                    city: (_r = (0, validation_1.optionalString)(body.city)) !== null && _r !== void 0 ? _r : null,
                    country: (_s = (0, validation_1.optionalString)(body.country)) !== null && _s !== void 0 ? _s : "Somaliland",
                    consultationFee: (_t = (0, validation_1.parseNumber)(body.consultationFee, "consultationFee")) !== null && _t !== void 0 ? _t : null,
                    currency: (_v = (0, validation_1.optionalString)(body.currency)) !== null && _v !== void 0 ? _v : "USD",
                    bio: (_w = (0, validation_1.optionalString)(body.bio)) !== null && _w !== void 0 ? _w : null,
                    verificationStatus: client_1.DoctorVerificationStatus.VERIFIED,
                    verifiedAt: new Date(),
                    isActive: true,
                    isAvailable: (0, validation_1.parseBool)(body.isAvailable, true),
                    videoConsultationEnabled: (0, validation_1.parseBool)(body.videoConsultationEnabled, false),
                    chatConsultationEnabled: (0, validation_1.parseBool)(body.chatConsultationEnabled, false),
                },
            },
        },
        include: {
            doctor: true,
        },
    });
    return Object.assign(Object.assign({}, user.doctor), { user: {
            userid: user.userid,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
        } });
});
exports.adminCreateDoctor = adminCreateDoctor;
