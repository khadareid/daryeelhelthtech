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
exports.reviewApplication = exports.listApplications = exports.myApplications = exports.submitApplication = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
const featureFlag_service_1 = require("../services/featureFlag.service");
const healthId_service_1 = require("../services/healthId.service");
const ELIGIBLE = [
    client_1.Role.DOCTOR,
    client_1.Role.NURSE,
    client_1.Role.MIDWIFE,
    client_1.Role.LAB_TECH,
    client_1.Role.PHARMACIST,
];
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
/** POST /professional-applications */
const submitApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "professional_applications",
            userId,
            role,
            action: "create",
        });
        if (!allowed) {
            res.status(403).json({ isSuccess: false, message: "Applications are disabled" });
            return;
        }
        const { requestedRole, licenseNumber, qualifications, specialization, yearsOfExperience, facilityName, workplace, supportingDocs, notes, } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!requestedRole || !ELIGIBLE.includes(requestedRole)) {
            res.status(400).json({
                isSuccess: false,
                message: "Choose a valid professional role",
            });
            return;
        }
        // Never trust client to set DOCTOR on User here
        const open = yield prisma_1.prisma.professionalApplication.findFirst({
            where: {
                userId,
                requestedRole,
                status: {
                    in: [
                        client_1.ProfessionalApplicationStatus.PENDING,
                        client_1.ProfessionalApplicationStatus.UNDER_REVIEW,
                        client_1.ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED,
                    ],
                },
            },
        });
        if (open) {
            res.status(409).json({
                isSuccess: false,
                message: "You already have an open application for this role",
                result: open,
            });
            return;
        }
        const year = new Date().getFullYear();
        const seq = Date.now().toString().slice(-6);
        const applicationCode = `APP-${year}-${seq}`;
        const application = yield prisma_1.prisma.professionalApplication.create({
            data: {
                userId,
                applicationCode,
                requestedRole,
                licenseNumber: licenseNumber ? String(licenseNumber) : null,
                qualifications: qualifications ? String(qualifications) : null,
                specialization: specialization ? String(specialization) : null,
                subSpecialty: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.subSpecialty)
                    ? String(req.body.subSpecialty)
                    : null,
                yearsOfExperience: Number(yearsOfExperience) > 0 ? Number(yearsOfExperience) : null,
                languages: Array.isArray((_c = req.body) === null || _c === void 0 ? void 0 : _c.languages)
                    ? req.body.languages.map(String)
                    : [],
                facilityName: facilityName ? String(facilityName) : null,
                workplace: workplace ? String(workplace) : null,
                professionalBio: ((_d = req.body) === null || _d === void 0 ? void 0 : _d.professionalBio)
                    ? String(req.body.professionalBio)
                    : null,
                supportingDocs: supportingDocs !== null && supportingDocs !== void 0 ? supportingDocs : undefined,
                notes: notes ? String(notes) : null,
                status: client_1.ProfessionalApplicationStatus.PENDING,
            },
        });
        yield prisma_1.prisma.notification.create({
            data: {
                userId,
                title: "Application submitted",
                body: `Your ${requestedRole.replace(/_/g, " ")} application is pending review.`,
                type: client_1.NotificationType.PROFESSIONAL_APPLICATION,
                channel: client_1.NotificationChannel.IN_APP,
                metadata: { applicationId: application.professionalapplicationid },
            },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId, action: "PROFESSIONAL_APPLICATION_SUBMIT", entity: "ProfessionalApplication", entityId: application.professionalapplicationid }, (0, audit_service_1.getClientMeta)(req)));
        res.status(201).json({
            isSuccess: true,
            message: "Application submitted",
            result: application,
        });
    }
    catch (error) {
        console.error("submitApplication error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to submit application" });
    }
});
exports.submitApplication = submitApplication;
/** GET /professional-applications/mine */
const myApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const apps = yield prisma_1.prisma.professionalApplication.findMany({
            where: { userId },
            orderBy: { submittedAt: "desc" },
        });
        res.status(200).json({ isSuccess: true, result: apps });
    }
    catch (error) {
        console.error("myApplications error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load applications" });
    }
});
exports.myApplications = myApplications;
/** GET /admin/professional-applications */
const listApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = String(req.query.status || "").trim();
        const where = {};
        if (status)
            where.status = status;
        const apps = yield prisma_1.prisma.professionalApplication.findMany({
            where,
            orderBy: { submittedAt: "asc" },
            include: {
                user: {
                    select: {
                        userid: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        role: true,
                        profile: { select: { healthId: true } },
                    },
                },
            },
            take: 100,
        });
        res.status(200).json({ isSuccess: true, result: apps });
    }
    catch (error) {
        console.error("listApplications error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to list applications" });
    }
});
exports.listApplications = listApplications;
/** PATCH /admin/professional-applications/:id */
const reviewApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId: adminId, role } = actor(req);
        if (!adminId) {
            res.status(401).json({ isSuccess: false, message: "Unauthorized" });
            return;
        }
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "professional_applications",
            userId: adminId,
            role,
            action: "approve",
        });
        if (!allowed) {
            res.status(403).json({ isSuccess: false, message: "Not permitted" });
            return;
        }
        const id = String(req.params.id);
        const { decision, reviewNotes, rejectionReason } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const app = yield prisma_1.prisma.professionalApplication.findUnique({
            where: { professionalapplicationid: id },
        });
        if (!app) {
            res.status(404).json({ isSuccess: false, message: "Application not found" });
            return;
        }
        if (app.userId === adminId) {
            res.status(403).json({
                isSuccess: false,
                message: "Applicants cannot approve themselves",
            });
            return;
        }
        const next = decision === "APPROVED"
            ? client_1.ProfessionalApplicationStatus.APPROVED
            : decision === "REJECTED"
                ? client_1.ProfessionalApplicationStatus.REJECTED
                : decision === "MORE_INFORMATION_REQUIRED"
                    ? client_1.ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED
                    : decision === "UNDER_REVIEW"
                        ? client_1.ProfessionalApplicationStatus.UNDER_REVIEW
                        : null;
        if (!next) {
            res.status(400).json({
                isSuccess: false,
                message: "decision must be APPROVED, REJECTED, UNDER_REVIEW, or MORE_INFORMATION_REQUIRED",
            });
            return;
        }
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const updated = yield tx.professionalApplication.update({
                where: { professionalapplicationid: id },
                data: {
                    status: next,
                    reviewNotes: reviewNotes ? String(reviewNotes) : null,
                    rejectionReason: next === client_1.ProfessionalApplicationStatus.REJECTED
                        ? String(rejectionReason || reviewNotes || "Rejected")
                        : null,
                    reviewedById: adminId,
                    reviewedAt: new Date(),
                    decidedAt: next === client_1.ProfessionalApplicationStatus.APPROVED ||
                        next === client_1.ProfessionalApplicationStatus.REJECTED
                        ? new Date()
                        : null,
                },
            });
            if (next === client_1.ProfessionalApplicationStatus.APPROVED) {
                yield tx.user.update({
                    where: { userid: app.userId },
                    data: { role: app.requestedRole },
                });
                const applicant = yield tx.user.findUnique({
                    where: { userid: app.userId },
                    select: { fullName: true },
                });
                const slugBase = (0, healthId_service_1.slugifyProfessionalName)((applicant === null || applicant === void 0 ? void 0 : applicant.fullName) || "professional", app.userId.slice(-4).toLowerCase());
                yield tx.professionalProfile.upsert({
                    where: { userId: app.userId },
                    create: {
                        userId: app.userId,
                        professionalType: app.requestedRole,
                        slug: slugBase,
                        licenseNumber: app.licenseNumber,
                        specialization: app.specialization,
                        subSpecialty: app.subSpecialty,
                        yearsOfExperience: app.yearsOfExperience,
                        languages: (_a = app.languages) !== null && _a !== void 0 ? _a : [],
                        workplace: app.workplace,
                        facilityName: app.facilityName,
                        qualifications: app.qualifications
                            ? { text: app.qualifications }
                            : undefined,
                        isVerified: true,
                        isActive: true,
                        isPubliclyVisible: true,
                        publicBio: app.professionalBio ||
                            `${app.requestedRole.replace(/_/g, " ")} on Daryeel Health`,
                    },
                    update: {
                        professionalType: app.requestedRole,
                        slug: slugBase,
                        licenseNumber: (_b = app.licenseNumber) !== null && _b !== void 0 ? _b : undefined,
                        specialization: (_c = app.specialization) !== null && _c !== void 0 ? _c : undefined,
                        subSpecialty: (_d = app.subSpecialty) !== null && _d !== void 0 ? _d : undefined,
                        yearsOfExperience: (_e = app.yearsOfExperience) !== null && _e !== void 0 ? _e : undefined,
                        languages: ((_f = app.languages) === null || _f === void 0 ? void 0 : _f.length) ? app.languages : undefined,
                        workplace: (_g = app.workplace) !== null && _g !== void 0 ? _g : undefined,
                        facilityName: (_h = app.facilityName) !== null && _h !== void 0 ? _h : undefined,
                        publicBio: (_j = app.professionalBio) !== null && _j !== void 0 ? _j : undefined,
                        isVerified: true,
                        isActive: true,
                        deletedAt: null,
                    },
                });
            }
            const body = next === client_1.ProfessionalApplicationStatus.APPROVED
                ? `Your ${app.requestedRole.replace(/_/g, " ")} application was approved.`
                : next === client_1.ProfessionalApplicationStatus.REJECTED
                    ? `Your application was rejected. ${rejectionReason || ""}`.trim()
                    : next === client_1.ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED
                        ? `More information is required for your application. ${reviewNotes || ""}`.trim()
                        : "Your application is under review.";
            yield tx.notification.create({
                data: {
                    userId: app.userId,
                    title: "Professional application update",
                    body,
                    type: client_1.NotificationType.PROFESSIONAL_APPLICATION,
                    channel: client_1.NotificationChannel.IN_APP,
                    metadata: { applicationId: id, status: next },
                },
            });
            return updated;
        }));
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId, action: `PROFESSIONAL_APPLICATION_${next}`, entity: "ProfessionalApplication", entityId: id, metadata: { decision: next, applicantId: app.userId } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({
            isSuccess: true,
            message: "Application updated",
            result,
        });
    }
    catch (error) {
        console.error("reviewApplication error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to review application" });
    }
});
exports.reviewApplication = reviewApplication;
