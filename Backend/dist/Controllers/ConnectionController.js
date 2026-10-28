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
exports.endConnection = exports.rejectConnection = exports.acceptConnection = exports.listConnectionRequests = exports.listConnections = exports.requestConnection = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
const CLINICAL = [
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
function assertProfessional(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: userId },
            select: {
                role: true,
                professionalProfiles: {
                    where: { isActive: true, deletedAt: null },
                    take: 1,
                    select: { isVerified: true, professionalType: true },
                },
            },
        });
        if (!user)
            return null;
        const profile = user.professionalProfiles[0];
        if ((profile === null || profile === void 0 ? void 0 : profile.isVerified) && CLINICAL.includes(profile.professionalType)) {
            return { role: profile.professionalType, verified: true };
        }
        if (CLINICAL.includes(user.role)) {
            return { role: user.role, verified: Boolean(profile === null || profile === void 0 ? void 0 : profile.isVerified) };
        }
        return null;
    });
}
/** POST /connections — patient requests connection with a professional */
const requestConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const professionalUserId = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.professionalUserId) || "").trim();
        const reason = typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.reason) === "string" ? req.body.reason.trim() : null;
        if (!professionalUserId) {
            res.status(400).json({
                isSuccess: false,
                message: "professionalUserId is required",
            });
            return;
        }
        if (professionalUserId === userId) {
            res.status(400).json({
                isSuccess: false,
                message: "You cannot connect with yourself",
            });
            return;
        }
        const pro = yield assertProfessional(professionalUserId);
        if (!pro) {
            res.status(400).json({
                isSuccess: false,
                message: "Target user is not an approved professional",
            });
            return;
        }
        const existing = yield prisma_1.prisma.patientProfessionalConnection.findUnique({
            where: {
                patientUserId_professionalUserId: {
                    patientUserId: userId,
                    professionalUserId,
                },
            },
        });
        if (existing) {
            if (existing.status === client_1.ConnectionStatus.PENDING ||
                existing.status === client_1.ConnectionStatus.ACCEPTED) {
                res.status(409).json({
                    isSuccess: false,
                    message: `Connection already ${existing.status.toLowerCase()}`,
                    result: existing,
                });
                return;
            }
            // Re-open rejected/ended/blocked as new pending request
            const updated = yield prisma_1.prisma.patientProfessionalConnection.update({
                where: { id: existing.id },
                data: {
                    status: client_1.ConnectionStatus.PENDING,
                    requestedBy: client_1.ConnectionRequestedBy.PATIENT,
                    reason,
                    requestedAt: new Date(),
                    acceptedAt: null,
                    rejectedAt: null,
                    endedAt: null,
                },
            });
            yield notifyConnection(professionalUserId, userId, "requested");
            res.status(200).json({
                isSuccess: true,
                message: "Connection request sent",
                result: updated,
            });
            return;
        }
        const created = yield prisma_1.prisma.patientProfessionalConnection.create({
            data: {
                patientUserId: userId,
                professionalUserId,
                status: client_1.ConnectionStatus.PENDING,
                requestedBy: client_1.ConnectionRequestedBy.PATIENT,
                reason,
            },
        });
        const meta = (0, audit_service_1.getClientMeta)(req);
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId, action: "CONNECTION_REQUESTED", entity: "PatientProfessionalConnection", entityId: created.id, metadata: { professionalUserId, reason } }, meta));
        yield notifyConnection(professionalUserId, userId, "requested");
        res.status(201).json({
            isSuccess: true,
            message: "Connection request sent",
            result: created,
        });
    }
    catch (error) {
        console.error("requestConnection error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to request connection",
        });
    }
});
exports.requestConnection = requestConnection;
function notifyConnection(toUserId, fromUserId, kind) {
    return __awaiter(this, void 0, void 0, function* () {
        const from = yield prisma_1.prisma.user.findUnique({
            where: { userid: fromUserId },
            select: { fullName: true },
        });
        const titles = {
            requested: "New connection request",
            accepted: "Connection accepted",
            rejected: "Connection rejected",
            ended: "Connection ended",
        };
        const bodies = {
            requested: `${(from === null || from === void 0 ? void 0 : from.fullName) || "A patient"} requested to connect with you.`,
            accepted: `${(from === null || from === void 0 ? void 0 : from.fullName) || "A professional"} accepted your connection.`,
            rejected: `${(from === null || from === void 0 ? void 0 : from.fullName) || "A professional"} declined your connection.`,
            ended: `${(from === null || from === void 0 ? void 0 : from.fullName) || "Someone"} ended the healthcare connection.`,
        };
        yield prisma_1.prisma.notification
            .create({
            data: {
                userId: toUserId,
                type: client_1.NotificationType.CONNECTION,
                channel: client_1.NotificationChannel.IN_APP,
                title: titles[kind],
                body: bodies[kind],
                metadata: { fromUserId, kind },
            },
        })
            .catch(() => undefined);
    });
}
/** GET /connections */
const listConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";
        const whereStatus = status && Object.values(client_1.ConnectionStatus).includes(status)
            ? status
            : undefined;
        const rows = yield prisma_1.prisma.patientProfessionalConnection.findMany({
            where: Object.assign({ OR: [{ patientUserId: userId }, { professionalUserId: userId }] }, (whereStatus ? { status: whereStatus } : {})),
            orderBy: { updatedAt: "desc" },
            include: {
                patient: {
                    select: {
                        userid: true,
                        fullName: true,
                        avatarUrl: true,
                        picture: true,
                        profile: { select: { healthId: true, city: true } },
                    },
                },
                professional: {
                    select: {
                        userid: true,
                        fullName: true,
                        avatarUrl: true,
                        picture: true,
                        role: true,
                        professionalProfiles: {
                            take: 1,
                            select: {
                                professionalType: true,
                                specialization: true,
                                isVerified: true,
                                publicPhotoUrl: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({ isSuccess: true, result: rows });
    }
    catch (error) {
        console.error("listConnections error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to list connections",
        });
    }
});
exports.listConnections = listConnections;
/** GET /connections/requests — pending for professional */
const listConnectionRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const rows = yield prisma_1.prisma.patientProfessionalConnection.findMany({
            where: {
                professionalUserId: userId,
                status: client_1.ConnectionStatus.PENDING,
            },
            orderBy: { requestedAt: "desc" },
            include: {
                patient: {
                    select: {
                        userid: true,
                        fullName: true,
                        avatarUrl: true,
                        picture: true,
                        profile: { select: { healthId: true, city: true } },
                    },
                },
            },
        });
        res.status(200).json({ isSuccess: true, result: rows });
    }
    catch (error) {
        console.error("listConnectionRequests error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to list requests",
        });
    }
});
exports.listConnectionRequests = listConnectionRequests;
function mutateConnectionStatus(req, res, nextStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId } = actor(req);
            if (!userId) {
                res.status(401).json({ isSuccess: false, message: "Sign in required" });
                return;
            }
            const id = String(req.params.id || "");
            const row = yield prisma_1.prisma.patientProfessionalConnection.findUnique({
                where: { id },
            });
            if (!row) {
                res.status(404).json({ isSuccess: false, message: "Connection not found" });
                return;
            }
            const isPatient = row.patientUserId === userId;
            const isPro = row.professionalUserId === userId;
            if (!isPatient && !isPro) {
                res.status(403).json({ isSuccess: false, message: "Not allowed" });
                return;
            }
            if (nextStatus === client_1.ConnectionStatus.ACCEPTED || nextStatus === client_1.ConnectionStatus.REJECTED) {
                if (!isPro) {
                    res.status(403).json({
                        isSuccess: false,
                        message: "Only the professional can accept or reject",
                    });
                    return;
                }
                if (row.status !== client_1.ConnectionStatus.PENDING) {
                    res.status(400).json({
                        isSuccess: false,
                        message: "Only pending requests can be accepted or rejected",
                    });
                    return;
                }
            }
            if (nextStatus === client_1.ConnectionStatus.ENDED || nextStatus === client_1.ConnectionStatus.BLOCKED) {
                if (row.status !== client_1.ConnectionStatus.ACCEPTED && row.status !== client_1.ConnectionStatus.PENDING) {
                    res.status(400).json({
                        isSuccess: false,
                        message: "Connection cannot be ended from this status",
                    });
                    return;
                }
            }
            const updated = yield prisma_1.prisma.patientProfessionalConnection.update({
                where: { id },
                data: {
                    status: nextStatus,
                    acceptedAt: nextStatus === client_1.ConnectionStatus.ACCEPTED ? new Date() : row.acceptedAt,
                    rejectedAt: nextStatus === client_1.ConnectionStatus.REJECTED ? new Date() : row.rejectedAt,
                    endedAt: nextStatus === client_1.ConnectionStatus.ENDED || nextStatus === client_1.ConnectionStatus.BLOCKED
                        ? new Date()
                        : row.endedAt,
                },
            });
            const actionMap = {
                ACCEPTED: "CONNECTION_ACCEPTED",
                REJECTED: "CONNECTION_REJECTED",
                ENDED: "CONNECTION_ENDED",
                BLOCKED: "CONNECTION_ENDED",
            };
            yield (0, audit_service_1.createAuditLog)(Object.assign({ userId, action: actionMap[nextStatus] || "CONNECTION_UPDATED", entity: "PatientProfessionalConnection", entityId: id, metadata: { status: nextStatus } }, (0, audit_service_1.getClientMeta)(req)));
            const notifyTarget = isPro ? row.patientUserId : row.professionalUserId;
            const kind = nextStatus === client_1.ConnectionStatus.ACCEPTED
                ? "accepted"
                : nextStatus === client_1.ConnectionStatus.REJECTED
                    ? "rejected"
                    : "ended";
            yield notifyConnection(notifyTarget, userId, kind);
            res.status(200).json({
                isSuccess: true,
                message: `Connection ${nextStatus.toLowerCase()}`,
                result: updated,
            });
        }
        catch (error) {
            console.error("mutateConnectionStatus error:", error);
            res.status(500).json({
                isSuccess: false,
                message: "Failed to update connection",
            });
        }
    });
}
const acceptConnection = (req, res) => mutateConnectionStatus(req, res, client_1.ConnectionStatus.ACCEPTED);
exports.acceptConnection = acceptConnection;
const rejectConnection = (req, res) => mutateConnectionStatus(req, res, client_1.ConnectionStatus.REJECTED);
exports.rejectConnection = rejectConnection;
const endConnection = (req, res) => mutateConnectionStatus(req, res, client_1.ConnectionStatus.ENDED);
exports.endConnection = endConnection;
