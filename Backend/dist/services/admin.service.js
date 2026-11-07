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
exports.listAuditLogs = exports.getDashboardStats = void 0;
const prisma_1 = require("../lib/prisma");
const dbBatch_1 = require("../utils/dbBatch");
const pagination_1 = require("../utils/pagination");
const countMap = (rows, key) => {
    var _a;
    const map = {};
    for (const row of rows) {
        const k = String((_a = row[key]) !== null && _a !== void 0 ? _a : "");
        const count = row._count;
        map[k] =
            typeof count === "number"
                ? count
                : typeof count === "object" && count && "_all" in count
                    ? Number(count._all)
                    : Number(count !== null && count !== void 0 ? count : 0);
    }
    return map;
};
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    // Prefer groupBy + small batches over ~33 parallel count() calls so
    // Neon’s Prisma pool (often limit 5–8) is not exhausted (P2024).
    const [users, suspendedUsers, userByRole, doctorsActive, doctorByStatus, appointments, appointmentByStatus, consultations, payments, paymentByStatus, freePayments, paymentAgg, notifications, unreadNotifications, auditLogs, medications, labResults, medicalRecords, familyMembers, emergencyCards, recentAppointments, recentUsers, recentPayments,] = (yield (0, dbBatch_1.runInBatches)([
        () => prisma_1.prisma.user.count({ where: { deletedAt: null } }),
        () => prisma_1.prisma.user.count({ where: { deletedAt: null, isSuspended: true } }),
        () => prisma_1.prisma.user.groupBy({
            by: ["role"],
            where: { deletedAt: null },
            _count: { _all: true },
        }),
        () => prisma_1.prisma.doctor.count({ where: { isActive: true } }),
        () => prisma_1.prisma.doctor.groupBy({
            by: ["verificationStatus"],
            _count: { _all: true },
        }),
        () => prisma_1.prisma.appointment.count(),
        () => prisma_1.prisma.appointment.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
        () => prisma_1.prisma.consultation.count(),
        () => prisma_1.prisma.payment.count(),
        () => prisma_1.prisma.payment.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
        () => prisma_1.prisma.payment.count({
            where: {
                OR: [{ provider: "FREE" }, { amount: { lte: 0 } }],
            },
        }),
        () => prisma_1.prisma.payment.aggregate({
            where: { status: "PAID", amount: { gt: 0 } },
            _sum: { amount: true },
        }),
        () => prisma_1.prisma.notification.count(),
        () => prisma_1.prisma.notification.count({ where: { isRead: false } }),
        () => prisma_1.prisma.auditLog.count(),
        () => prisma_1.prisma.medication.count(),
        () => prisma_1.prisma.labResult.count(),
        () => prisma_1.prisma.medicalRecord.count(),
        () => prisma_1.prisma.familyMember.count(),
        () => prisma_1.prisma.emergencyCard.count(),
        () => prisma_1.prisma.appointment.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { userid: true, fullName: true, email: true } },
                doctor: { select: { id: true, fullName: true, specialty: true } },
            },
        }),
        () => prisma_1.prisma.user.findMany({
            where: { deletedAt: null },
            take: 6,
            orderBy: { createdAt: "desc" },
            select: {
                userid: true,
                fullName: true,
                email: true,
                role: true,
                isSuspended: true,
                createdAt: true,
            },
        }),
        () => prisma_1.prisma.payment.findMany({
            take: 6,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { userid: true, fullName: true, email: true } },
                appointment: {
                    select: {
                        appointmentCode: true,
                        doctor: { select: { fullName: true } },
                    },
                },
            },
        }),
    ], 4));
    const roles = countMap(userByRole, "role");
    const doctorStatus = countMap(doctorByStatus, "verificationStatus");
    const apptStatus = countMap(appointmentByStatus, "status");
    const payStatus = countMap(paymentByStatus, "status");
    const pendingAppointments = (apptStatus.PENDING || 0) + (apptStatus.RESCHEDULE_REQUESTED || 0);
    const confirmedAppointments = (apptStatus.ACCEPTED || 0) + (apptStatus.CONFIRMED || 0);
    const cancelledAppointments = (apptStatus.CANCELLED || 0) + (apptStatus.REJECTED || 0);
    return {
        users,
        patients: roles.USER || 0,
        admins: roles.ADMIN || 0,
        superAdmins: roles.SUPER_ADMIN || 0,
        suspendedUsers,
        doctors: doctorsActive,
        verifiedDoctors: doctorStatus.VERIFIED || 0,
        pendingDoctors: doctorStatus.PENDING || 0,
        rejectedDoctors: doctorStatus.REJECTED || 0,
        suspendedDoctors: doctorStatus.SUSPENDED || 0,
        appointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments: apptStatus.COMPLETED || 0,
        cancelledAppointments,
        noShowAppointments: apptStatus.NO_SHOW || 0,
        consultations,
        payments,
        paidPayments: payStatus.PAID || 0,
        pendingPayments: payStatus.PENDING || 0,
        failedPayments: payStatus.FAILED || 0,
        refundedPayments: payStatus.REFUNDED || 0,
        freePayments,
        revenuePaid: Number(paymentAgg._sum.amount || 0),
        notifications,
        unreadNotifications,
        auditLogs,
        medications,
        labResults,
        medicalRecords,
        familyMembers,
        emergencyCards,
        recentAppointments,
        recentUsers,
        recentPayments,
    };
});
exports.getDashboardStats = getDashboardStats;
const listAuditLogs = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.userId)
        where.userId = String(query.userId);
    if (query.action)
        where.action = String(query.action);
    if (query.entity)
        where.entity = String(query.entity);
    const search = query.search ? String(query.search).trim() : "";
    if (search) {
        where.OR = [
            { entity: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search, mode: "insensitive" } },
            { userId: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }
    const [items, total] = (yield (0, dbBatch_1.runInBatches)([
        () => prisma_1.prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { userid: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        () => prisma_1.prisma.auditLog.count({ where }),
    ], 2));
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listAuditLogs = listAuditLogs;
