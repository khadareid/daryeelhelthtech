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
exports.normalizeHealthId = normalizeHealthId;
exports.findPatientByHealthId = findPatientByHealthId;
exports.upsertHospitalPatientRequestFromSaas = upsertHospitalPatientRequestFromSaas;
exports.listMyHospitalPatientRequests = listMyHospitalPatientRequests;
exports.respondMyHospitalPatientRequest = respondMyHospitalPatientRequest;
const client_1 = require("@prisma/client");
const saasClient_1 = require("../../lib/saasClient");
const healthcareBooking_service_1 = require("./healthcareBooking.service");
const prisma = new client_1.PrismaClient();
function normalizeHealthId(raw) {
    return String(raw || "").trim().toUpperCase();
}
function findPatientByHealthId(healthIdRaw) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const healthId = normalizeHealthId(healthIdRaw);
        if (!healthId) {
            return {
                found: false,
                patient: null,
                result: null,
                message: "Daryeel Health ID Not Found",
            };
        }
        // Exact (case-insensitive) match on canonical Health ID — never create users
        const user = yield prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { healthId: { equals: healthId, mode: "insensitive" } },
                    { healthId },
                ],
            },
            select: {
                userid: true,
                healthId: true,
                fullName: true,
                phone: true,
                email: true,
                gender: true,
                dateOfBirth: true,
                country: true,
                region: true,
                city: true,
                isActive: true,
                isSuspended: true,
                role: true,
            },
        });
        if (!(user === null || user === void 0 ? void 0 : user.healthId)) {
            return {
                found: false,
                patient: null,
                result: null,
                message: "Daryeel Health ID Not Found",
            };
        }
        const normalizedReturned = normalizeHealthId(user.healthId);
        if (normalizedReturned !== healthId) {
            return {
                found: false,
                patient: null,
                result: null,
                message: "Daryeel Health ID Not Found",
            };
        }
        const patient = {
            patientId: user.userid,
            healthtechUserId: user.userid,
            userid: user.userid,
            healthId: normalizedReturned,
            name: user.fullName,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            gender: user.gender,
            dateOfBirth: ((_a = user.dateOfBirth) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
            country: user.country || null,
            city: user.city || null,
            region: user.region || null,
            isActive: user.isActive,
            isSuspended: user.isSuspended,
            role: String(user.role),
            status: user.isSuspended
                ? "SUSPENDED"
                : user.isActive
                    ? "ACTIVE"
                    : "INACTIVE",
        };
        // `result` mirrors Healthtech user API shape (result.healthId) for SaaS parsers
        const result = {
            userid: user.userid,
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            healthId: normalizedReturned,
            country: user.country,
            region: user.region,
            city: user.city,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            role: String(user.role),
            isActive: user.isActive,
            isSuspended: user.isSuspended,
        };
        return {
            found: true,
            message: "Daryeel Health ID Found",
            patient,
            result,
        };
    });
}
/** Ingest SaaS hospital request webhook — never creates a User. */
function upsertHospitalPatientRequestFromSaas(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const externalRequestId = String((payload === null || payload === void 0 ? void 0 : payload.requestId) || (payload === null || payload === void 0 ? void 0 : payload.externalRequestId) || "").trim();
        const healthId = normalizeHealthId((payload === null || payload === void 0 ? void 0 : payload.healthId) || "");
        const patientId = String((payload === null || payload === void 0 ? void 0 : payload.patientId) || "").trim();
        if (!externalRequestId || !healthId)
            return null;
        const user = yield prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    ...(patientId ? [{ userid: patientId }] : []),
                    { healthId: { equals: healthId, mode: "insensitive" } },
                ],
            },
            select: { userid: true, healthId: true },
        });
        if (!user)
            return null;
        const idempotencyKey = String((payload === null || payload === void 0 ? void 0 : payload.idempotencyKey) || "").trim() ||
            `saas-req-${externalRequestId}`;
        const existing = yield prisma.hospitalPatientRequest.findFirst({
            where: {
                OR: [{ externalRequestId }, { idempotencyKey }],
            },
        });
        const data = {
            externalRequestId,
            healthId: normalizeHealthId(user.healthId || healthId),
            patientId: user.userid,
            userId: user.userid,
            hospitalId: (payload === null || payload === void 0 ? void 0 : payload.hospitalId) ? String(payload.hospitalId) : null,
            tenantId: (payload === null || payload === void 0 ? void 0 : payload.tenantId) ? String(payload.tenantId) : null,
            branchId: (payload === null || payload === void 0 ? void 0 : payload.branchId) ? String(payload.branchId) : null,
            doctorId: (payload === null || payload === void 0 ? void 0 : payload.doctorId) ? String(payload.doctorId) : null,
            requestType: String((payload === null || payload === void 0 ? void 0 : payload.requestType) || "HOSPITAL_INVITE"),
            message: (payload === null || payload === void 0 ? void 0 : payload.message) ? String(payload.message) : null,
            status: client_1.HospitalPatientRequestStatus.PENDING,
            idempotencyKey,
            hospitalName: (payload === null || payload === void 0 ? void 0 : payload.hospitalName) ? String(payload.hospitalName) : null,
            branchName: (payload === null || payload === void 0 ? void 0 : payload.branchName) ? String(payload.branchName) : null,
            doctorName: (payload === null || payload === void 0 ? void 0 : payload.doctorName) ? String(payload.doctorName) : null,
            department: (payload === null || payload === void 0 ? void 0 : payload.department) ? String(payload.department) : null,
        };
        const row = existing
            ? yield prisma.hospitalPatientRequest.update({
                where: { id: existing.id },
                data: Object.assign(Object.assign({}, data), { status: existing.status === client_1.HospitalPatientRequestStatus.PENDING
                        ? client_1.HospitalPatientRequestStatus.PENDING
                        : existing.status }),
            })
            : yield prisma.hospitalPatientRequest.create({ data });
        if (!existing) {
            yield (0, healthcareBooking_service_1.recordHealthcareActivity)(user.userid, "HOSPITAL_PATIENT_REQUESTED", "Hospital Booking Request", [
                data.hospitalName ? `From ${data.hospitalName}` : "Hospital request",
                data.doctorName ? `Doctor: ${data.doctorName}` : null,
                data.department ? `Dept: ${data.department}` : null,
                data.message || null,
            ]
                .filter(Boolean)
                .join(" · "), null, {
                externalRequestId,
                healthId: data.healthId,
                status: "PENDING",
                source: "HEALTHTECH",
                brand: "DARYEEL",
            });
        }
        return row;
    });
}
function listMyHospitalPatientRequests(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.hospitalPatientRequest.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    });
}
function respondMyHospitalPatientRequest(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const local = yield prisma.hospitalPatientRequest.findFirst({
            where: { id: opts.id, userId: opts.userId },
        });
        if (!local) {
            throw Object.assign(new Error("Hospital request not found"), { status: 404 });
        }
        if (local.status !== client_1.HospitalPatientRequestStatus.PENDING) {
            return { request: local, changed: false };
        }
        if (!local.externalRequestId) {
            throw Object.assign(new Error("Request is not linked to SaaS"), {
                status: 400,
            });
        }
        yield saasClient_1.saasApi.respondHospitalRequest(local.externalRequestId, {
            accept: opts.accept,
            healthtechUserId: opts.userId,
            healthId: local.healthId,
        });
        const updated = yield prisma.hospitalPatientRequest.update({
            where: { id: local.id },
            data: {
                status: opts.accept
                    ? client_1.HospitalPatientRequestStatus.ACCEPTED
                    : client_1.HospitalPatientRequestStatus.REJECTED,
                respondedAt: new Date(),
            },
        });
        yield (0, healthcareBooking_service_1.recordHealthcareActivity)(opts.userId, opts.accept ? "HOSPITAL_PATIENT_ACCEPTED" : "HOSPITAL_PATIENT_REJECTED", opts.accept ? "Hospital request accepted" : "Hospital request rejected", updated.hospitalName
            ? `${updated.hospitalName} · ${updated.status}`
            : updated.status, null, {
            externalRequestId: updated.externalRequestId,
            healthId: updated.healthId,
            status: updated.status,
        });
        return { request: updated, changed: true };
    });
}
