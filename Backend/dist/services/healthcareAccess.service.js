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
exports.canAccessPatientData = canAccessPatientData;
exports.assertActiveAccount = assertActiveAccount;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ADMIN_ROLES = [client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN];
const CLINICAL_ROLES = [
    client_1.Role.DOCTOR,
    client_1.Role.NURSE,
    client_1.Role.MIDWIFE,
    client_1.Role.LAB_TECH,
    client_1.Role.PHARMACIST,
];
function isAdmin(role) {
    return !!role && ADMIN_ROLES.includes(role);
}
/**
 * Patient owns the resource, or admin, or clinician with active appointment
 * and (when required) active consent for the scope.
 */
function canAccessPatientData(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input.actorUserId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const actor = yield prisma_1.prisma.user.findUnique({
            where: { userid: input.actorUserId },
            select: {
                userid: true,
                role: true,
                isActive: true,
                isSuspended: true,
                isDeleted: true,
            },
        });
        if (!actor || actor.isDeleted || !actor.isActive || actor.isSuspended) {
            return { ok: false, status: 403, message: "Account is not active" };
        }
        if (actor.userid === input.patientUserId) {
            return { ok: true, reason: "owner" };
        }
        if (isAdmin(actor.role)) {
            return { ok: true, reason: "admin" };
        }
        if (!CLINICAL_ROLES.includes(actor.role)) {
            return {
                ok: false,
                status: 403,
                message: "You do not have access to this patient record",
            };
        }
        const profile = yield prisma_1.prisma.professionalProfile.findUnique({
            where: { userId: actor.userid },
            select: { professionalprofileid: true, isVerified: true, isActive: true },
        });
        if (!(profile === null || profile === void 0 ? void 0 : profile.isVerified) || !profile.isActive) {
            return {
                ok: false,
                status: 403,
                message: "Professional profile is not verified",
            };
        }
        // Care relationship via appointment (doctorId may be user id or profile id)
        const related = yield prisma_1.prisma.appointment.findFirst({
            where: {
                userId: input.patientUserId,
                status: { notIn: ["CANCELLED"] },
                OR: [
                    { doctorId: actor.userid },
                    { doctorId: profile.professionalprofileid },
                ],
            },
            select: { appointmentid: true },
        });
        if (!related) {
            return {
                ok: false,
                status: 403,
                message: "No authorized care relationship with this patient",
            };
        }
        if (input.requireConsent !== false) {
            const scope = input.scope || client_1.ConsentScope.ALL;
            const consent = yield prisma_1.prisma.consent.findFirst({
                where: {
                    userId: input.patientUserId,
                    grantedToUserId: actor.userid,
                    status: client_1.ConsentStatus.ACTIVE,
                    OR: [{ scope }, { scope: client_1.ConsentScope.ALL }],
                    AND: [
                        {
                            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                        },
                    ],
                },
            });
            if (!consent) {
                return {
                    ok: false,
                    status: 403,
                    message: "Active patient consent is required for this data",
                };
            }
        }
        return { ok: true, reason: "care_relationship" };
    });
}
function assertActiveAccount(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: userId },
            select: { isActive: true, isSuspended: true, isDeleted: true },
        });
        if (!user || user.isDeleted || !user.isActive || user.isSuspended) {
            return { ok: false, status: 403, message: "Account is not active" };
        }
        return { ok: true, reason: "active" };
    });
}
