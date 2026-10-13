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
exports.getMyFeatures = exports.listAdminAppointments = exports.listAdminAuditLogs = exports.updateFeatureFlag = exports.listFeatureFlags = exports.adminInitiatePasswordReset = exports.updateAdminUser = exports.getAdminUser = exports.listAdminUsers = exports.getAdminStats = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
const featureFlag_service_1 = require("../services/featureFlag.service");
const crypto_1 = __importDefault(require("crypto"));
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
/** GET /admin/stats */
const getAdminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, featureFlag_service_1.ensureDefaultFeatureFlags)();
        const [totalUsers, patients, professionals, byRole, pendingApps, verifiedPros, unverifiedPros, activeUsers, suspendedUsers, deactivatedUsers, appointments, appointmentTotal, messages, planCount, activeSubscriptions, newsPosts, newsComments, newsReports, recentUsers, recentAudits,] = yield Promise.all([
            prisma_1.prisma.user.count({ where: { isDeleted: false } }),
            prisma_1.prisma.user.count({ where: { role: client_1.Role.PATIENT, isDeleted: false } }),
            prisma_1.prisma.user.count({
                where: {
                    isDeleted: false,
                    role: {
                        in: [
                            client_1.Role.DOCTOR,
                            client_1.Role.NURSE,
                            client_1.Role.MIDWIFE,
                            client_1.Role.LAB_TECH,
                            client_1.Role.PHARMACIST,
                        ],
                    },
                },
            }),
            prisma_1.prisma.user.groupBy({
                by: ["role"],
                where: { isDeleted: false },
                _count: { _all: true },
            }),
            prisma_1.prisma.professionalApplication.count({
                where: { status: { in: ["PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"] } },
            }),
            prisma_1.prisma.professionalProfile.count({ where: { isVerified: true, deletedAt: null } }),
            prisma_1.prisma.professionalProfile.count({ where: { isVerified: false, deletedAt: null } }),
            prisma_1.prisma.user.count({ where: { isActive: true, isSuspended: false, isDeleted: false } }),
            prisma_1.prisma.user.count({ where: { isSuspended: true, isDeleted: false } }),
            prisma_1.prisma.user.count({ where: { OR: [{ isActive: false }, { isDeleted: true }] } }),
            prisma_1.prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
            prisma_1.prisma.appointment.count(),
            prisma_1.prisma.message.count(),
            prisma_1.prisma.platformPlan.count({ where: { isActive: true } }),
            prisma_1.prisma.platformSubscription.count({
                where: { status: { in: ["ACTIVE", "TRIALING"] } },
            }),
            prisma_1.prisma.newsPost.count({ where: { deletedAt: null } }),
            prisma_1.prisma.newsComment.count({ where: { deletedAt: null } }),
            prisma_1.prisma.newsReport.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
            prisma_1.prisma.user.findMany({
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    userid: true,
                    fullName: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true,
                    isSuspended: true,
                },
            }),
            prisma_1.prisma.auditLog.findMany({
                orderBy: { createdAt: "desc" },
                take: 12,
                select: {
                    auditlogid: true,
                    action: true,
                    entity: true,
                    entityId: true,
                    userId: true,
                    createdAt: true,
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            result: {
                totals: {
                    users: totalUsers,
                    patients,
                    professionals,
                    pendingApplications: pendingApps,
                    verifiedProfessionals: verifiedPros,
                    unverifiedProfessionals: unverifiedPros,
                    activeUsers,
                    suspendedUsers,
                    deactivatedUsers,
                    appointments: appointmentTotal,
                    messages,
                    plans: planCount,
                    activeSubscriptions,
                    newsPosts,
                    newsComments,
                    openNewsReports: newsReports,
                },
                usersByRole: byRole.map((r) => ({
                    role: r.role,
                    count: r._count._all,
                })),
                appointmentsByStatus: appointments.map((a) => ({
                    status: a.status,
                    count: a._count._all,
                })),
                recentRegistrations: recentUsers,
                recentAdminActivity: recentAudits,
                apiHealth: { status: "ok", at: new Date().toISOString() },
            },
        });
    }
    catch (error) {
        console.error("getAdminStats error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load admin stats" });
    }
});
exports.getAdminStats = getAdminStats;
/** GET /admin/users */
const listAdminUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const search = String(req.query.search || "").trim();
        const role = String(req.query.role || "").trim();
        const status = String(req.query.status || "").trim();
        const where = { isDeleted: false };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }
        if (role && Object.values(client_1.Role).includes(role)) {
            where.role = role;
        }
        if (status === "active") {
            where.isActive = true;
            where.isSuspended = false;
        }
        else if (status === "suspended") {
            where.isSuspended = true;
        }
        else if (status === "deactivated") {
            where.isActive = false;
        }
        const [total, users] = yield Promise.all([
            prisma_1.prisma.user.count({ where }),
            prisma_1.prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    userid: true,
                    email: true,
                    phone: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    isSuspended: true,
                    emailVerified: true,
                    phoneVerified: true,
                    createdAt: true,
                    lastLoginAt: true,
                    professionalProfiles: {
                        select: {
                            professionalprofileid: true,
                            professionalType: true,
                            isVerified: true,
                            specialization: true,
                        },
                    },
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        console.error("listAdminUsers error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to list users" });
    }
});
exports.listAdminUsers = listAdminUsers;
/** GET /admin/users/:id */
const getAdminUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = String(req.params.id);
        const user = yield prisma_1.prisma.user.findUnique({
            where: { userid: id },
            select: {
                userid: true,
                email: true,
                phone: true,
                fullName: true,
                gender: true,
                dateOfBirth: true,
                role: true,
                isActive: true,
                isSuspended: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                avatarUrl: true,
                picture: true,
                profile: true,
                professionalProfiles: true,
                professionalApplications: {
                    orderBy: { submittedAt: "desc" },
                    take: 10,
                },
                auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
                _count: {
                    select: {
                        appointments: true,
                        prescriptions: true,
                        labOrders: true,
                        notifications: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ isSuccess: false, message: "User not found" });
            return;
        }
        res.status(200).json({ isSuccess: true, result: user });
    }
    catch (error) {
        console.error("getAdminUser error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load user" });
    }
});
exports.getAdminUser = getAdminUser;
/** PATCH /admin/users/:id */
const updateAdminUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId: adminId } = actor(req);
        const id = String(req.params.id);
        const { fullName, phone, role, isActive, isSuspended, } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const target = yield prisma_1.prisma.user.findUnique({ where: { userid: id } });
        if (!target) {
            res.status(404).json({ isSuccess: false, message: "User not found" });
            return;
        }
        if (target.role === client_1.Role.SUPER_ADMIN && (isActive === false || isSuspended === true)) {
            const otherSupers = yield prisma_1.prisma.user.count({
                where: {
                    role: client_1.Role.SUPER_ADMIN,
                    isActive: true,
                    isSuspended: false,
                    isDeleted: false,
                    userid: { not: id },
                },
            });
            if (otherSupers === 0) {
                res.status(400).json({
                    isSuccess: false,
                    message: "Cannot suspend or deactivate the last active Super Admin",
                });
                return;
            }
        }
        if (role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN || role) {
            const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
                key: "admin_settings",
                userId: adminId,
                role: actor(req).role,
                action: "manage",
            });
            if (!allowed) {
                res.status(403).json({ isSuccess: false, message: "Not permitted" });
                return;
            }
        }
        const data = {};
        if (typeof fullName === "string")
            data.fullName = fullName.trim();
        if (typeof phone === "string")
            data.phone = phone.trim() || null;
        if (typeof isActive === "boolean")
            data.isActive = isActive;
        if (typeof isSuspended === "boolean")
            data.isSuspended = isSuspended;
        if (role && Object.values(client_1.Role).includes(role)) {
            if (target.role === client_1.Role.SUPER_ADMIN && role !== client_1.Role.SUPER_ADMIN) {
                const otherSupers = yield prisma_1.prisma.user.count({
                    where: {
                        role: client_1.Role.SUPER_ADMIN,
                        isActive: true,
                        isSuspended: false,
                        isDeleted: false,
                        userid: { not: id },
                    },
                });
                if (otherSupers === 0) {
                    res.status(400).json({
                        isSuccess: false,
                        message: "Cannot demote the last active Super Admin",
                    });
                    return;
                }
            }
            data.role = role;
        }
        const updated = yield prisma_1.prisma.user.update({
            where: { userid: id },
            data,
            select: {
                userid: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                isSuspended: true,
            },
        });
        const meta = (0, audit_service_1.getClientMeta)(req);
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId || undefined, action: "ADMIN_USER_UPDATE", entity: "User", entityId: id, metadata: { changes: data } }, meta));
        res.status(200).json({ isSuccess: true, result: updated });
    }
    catch (error) {
        console.error("updateAdminUser error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update user" });
    }
});
exports.updateAdminUser = updateAdminUser;
/** POST /admin/users/:id/password-reset */
const adminInitiatePasswordReset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId: adminId } = actor(req);
        const id = String(req.params.id);
        const user = yield prisma_1.prisma.user.findUnique({ where: { userid: id } });
        if (!user) {
            res.status(404).json({ isSuccess: false, message: "User not found" });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
        yield prisma_1.prisma.passwordReset.create({
            data: { userId: id, token, expiresAt },
        });
        yield prisma_1.prisma.notification.create({
            data: {
                userId: id,
                title: "Password reset initiated",
                body: "An administrator started a password reset for your account. Use the secure link sent to your email, or contact support.",
                type: "SYSTEM",
                channel: "IN_APP",
                metadata: { source: "admin", adminId },
            },
        });
        const meta = (0, audit_service_1.getClientMeta)(req);
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId || undefined, action: "ADMIN_PASSWORD_RESET", entity: "User", entityId: id, metadata: { expiresAt } }, meta));
        // Never return the raw token to the client UI in production lists —
        // include once for admin delivery channel configuration.
        res.status(200).json({
            isSuccess: true,
            message: "Password reset initiated",
            result: { expiresAt, resetToken: token },
        });
    }
    catch (error) {
        console.error("adminInitiatePasswordReset error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to initiate reset" });
    }
});
exports.adminInitiatePasswordReset = adminInitiatePasswordReset;
/** GET /admin/features */
const listFeatureFlags = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, featureFlag_service_1.ensureDefaultFeatureFlags)();
        const flags = yield prisma_1.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
        res.status(200).json({ isSuccess: true, result: flags });
    }
    catch (error) {
        console.error("listFeatureFlags error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load features" });
    }
});
exports.listFeatureFlags = listFeatureFlags;
/** PATCH /admin/features/:key */
const updateFeatureFlag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId: adminId } = actor(req);
        const key = String(req.params.key);
        const { enabled, allowedRoles, actions, client, description } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const data = {};
        if (typeof enabled === "boolean")
            data.enabled = enabled;
        if (Array.isArray(allowedRoles))
            data.allowedRoles = allowedRoles.map(String);
        if (Array.isArray(actions))
            data.actions = actions.map(String);
        if (client)
            data.client = client;
        if (typeof description === "string")
            data.description = description;
        const flag = yield prisma_1.prisma.featureFlag.update({
            where: { key },
            data,
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId || undefined, action: "FEATURE_FLAG_UPDATE", entity: "FeatureFlag", entityId: flag.featureflagid, metadata: data }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: flag });
    }
    catch (error) {
        console.error("updateFeatureFlag error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update feature" });
    }
});
exports.updateFeatureFlag = updateFeatureFlag;
/** GET /admin/audit-logs */
const listAdminAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
        const action = String(req.query.action || "").trim();
        const entity = String(req.query.entity || "").trim();
        const search = String(req.query.search || "").trim();
        const where = {};
        if (action)
            where.action = { contains: action, mode: "insensitive" };
        if (entity)
            where.entity = { contains: entity, mode: "insensitive" };
        if (search) {
            where.OR = [
                { action: { contains: search, mode: "insensitive" } },
                { entity: { contains: search, mode: "insensitive" } },
                { entityId: { contains: search, mode: "insensitive" } },
                { userId: { contains: search, mode: "insensitive" } },
            ];
        }
        const [total, rows] = yield Promise.all([
            prisma_1.prisma.auditLog.count({ where }),
            prisma_1.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: { userid: true, fullName: true, email: true, role: true },
                    },
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        console.error("listAdminAuditLogs error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load audit logs" });
    }
});
exports.listAdminAuditLogs = listAdminAuditLogs;
/** GET /admin/appointments */
const listAdminAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
        const status = String(req.query.status || "").trim();
        const search = String(req.query.search || "").trim();
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { appointmentCode: { contains: search, mode: "insensitive" } },
                { doctorName: { contains: search, mode: "insensitive" } },
                { facilityName: { contains: search, mode: "insensitive" } },
                { reason: { contains: search, mode: "insensitive" } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }
        const [total, rows] = yield Promise.all([
            prisma_1.prisma.appointment.count({ where }),
            prisma_1.prisma.appointment.findMany({
                where,
                orderBy: { scheduledAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    appointmentid: true,
                    appointmentCode: true,
                    doctorName: true,
                    facilityName: true,
                    specialty: true,
                    scheduledAt: true,
                    status: true,
                    reason: true,
                    createdAt: true,
                    user: {
                        select: {
                            userid: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        console.error("listAdminAppointments error:", error);
        res
            .status(500)
            .json({ isSuccess: false, message: "Failed to load appointments" });
    }
});
exports.listAdminAppointments = listAdminAppointments;
/** GET /features/me — resolved flags for current user (web/mobile) */
const getMyFeatures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, featureFlag_service_1.ensureDefaultFeatureFlags)();
        const { userId, role } = actor(req);
        const client = String(req.query.client || "ALL").toUpperCase();
        const flags = yield prisma_1.prisma.featureFlag.findMany();
        const resolved = [];
        for (const flag of flags) {
            const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
                key: flag.key,
                userId,
                role,
                action: "read",
                client: client === "WEB" || client === "MOBILE" ? client : "ALL",
            });
            resolved.push({
                key: flag.key,
                label: flag.label,
                enabled: allowed,
                actions: flag.actions,
            });
        }
        res.status(200).json({ isSuccess: true, result: resolved });
    }
    catch (error) {
        console.error("getMyFeatures error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to resolve features" });
    }
});
exports.getMyFeatures = getMyFeatures;
