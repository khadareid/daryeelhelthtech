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
exports.updateMyProfessionalProfile = exports.getMyProfessionalProfile = void 0;
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
const healthId_service_1 = require("../services/healthId.service");
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
/** GET /professional/profile — own professional profile */
const getMyProfessionalProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const profile = yield prisma_1.prisma.professionalProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        userid: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        picture: true,
                        role: true,
                        profile: {
                            select: {
                                healthId: true,
                                city: true,
                                region: true,
                                country: true,
                            },
                        },
                    },
                },
            },
        });
        if (!profile || profile.deletedAt) {
            res.status(404).json({
                isSuccess: false,
                message: "No professional profile yet",
            });
            return;
        }
        res.status(200).json({ isSuccess: true, result: profile });
    }
    catch (error) {
        console.error("getMyProfessionalProfile error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load professional profile",
        });
    }
});
exports.getMyProfessionalProfile = getMyProfessionalProfile;
/** PATCH /professional/profile — owner updates public professional info */
const updateMyProfessionalProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const existing = yield prisma_1.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!existing || existing.deletedAt) {
            res.status(404).json({
                isSuccess: false,
                message: "No professional profile to update",
            });
            return;
        }
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const data = {};
        if (body.specialization !== undefined)
            data.specialization = String(body.specialization || "") || null;
        if (body.subSpecialty !== undefined)
            data.subSpecialty = String(body.subSpecialty || "") || null;
        if (body.publicBio !== undefined)
            data.publicBio = String(body.publicBio || "") || null;
        if (body.workplace !== undefined)
            data.workplace = String(body.workplace || "") || null;
        if (body.facilityName !== undefined)
            data.facilityName = String(body.facilityName || "") || null;
        if (body.publicPhone !== undefined)
            data.publicPhone = String(body.publicPhone || "") || null;
        if (body.publicEmail !== undefined)
            data.publicEmail = String(body.publicEmail || "") || null;
        if (body.website !== undefined)
            data.website = String(body.website || "") || null;
        if (body.linkedin !== undefined)
            data.linkedin = String(body.linkedin || "") || null;
        if (body.twitter !== undefined)
            data.twitter = String(body.twitter || "") || null;
        if (body.facebook !== undefined)
            data.facebook = String(body.facebook || "") || null;
        if (body.publicPhotoUrl !== undefined)
            data.publicPhotoUrl = String(body.publicPhotoUrl || "") || null;
        if (body.yearsOfExperience !== undefined) {
            const n = Number(body.yearsOfExperience);
            data.yearsOfExperience = Number.isFinite(n) && n >= 0 ? n : null;
        }
        if (body.languages !== undefined) {
            data.languages = Array.isArray(body.languages)
                ? body.languages.map(String).filter(Boolean)
                : String(body.languages || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
        }
        if (body.isPubliclyVisible !== undefined) {
            data.isPubliclyVisible = Boolean(body.isPubliclyVisible);
        }
        if (body.consultationFee !== undefined) {
            const fee = Number(body.consultationFee);
            data.consultationFee = Number.isFinite(fee) ? fee : null;
        }
        if (body.slug !== undefined) {
            const raw = String(body.slug || "").trim().toLowerCase();
            data.slug = raw
                ? (0, healthId_service_1.slugifyProfessionalName)(raw.replace(/^-+|-+$/g, ""))
                : existing.slug;
        }
        // Never allow self-setting verification or role type from this endpoint
        const updated = yield prisma_1.prisma.professionalProfile.update({
            where: { userId },
            data,
            include: {
                user: {
                    select: {
                        userid: true,
                        fullName: true,
                        profile: { select: { healthId: true, city: true } },
                    },
                },
            },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId, action: "PROFESSIONAL_PROFILE_UPDATED", entity: "ProfessionalProfile", entityId: updated.professionalprofileid, metadata: { fields: Object.keys(data) } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({
            isSuccess: true,
            message: "Professional profile updated",
            result: updated,
        });
    }
    catch (error) {
        console.error("updateMyProfessionalProfile error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to update professional profile",
        });
    }
});
exports.updateMyProfessionalProfile = updateMyProfessionalProfile;
