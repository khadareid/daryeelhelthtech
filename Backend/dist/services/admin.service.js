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
const pagination_1 = require("../utils/pagination");
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [users, patients, admins, superAdmins, suspendedUsers, doctors, verifiedDoctors, pendingDoctors, rejectedDoctors, suspendedDoctors, appointments, pendingAppointments, confirmedAppointments, completedAppointments, cancelledAppointments, consultations, payments, paidPayments, pendingPayments, refundedPayments, freePayments, paymentAgg, notifications, unreadNotifications, auditLogs, medications, labResults, medicalRecords, familyMembers, emergencyCards, recentAppointments, recentUsers, recentPayments,] = yield Promise.all([
        prisma_1.prisma.user.count({ where: { deletedAt: null } }),
        prisma_1.prisma.user.count({ where: { deletedAt: null, role: "USER" } }),
        prisma_1.prisma.user.count({ where: { deletedAt: null, role: "ADMIN" } }),
        prisma_1.prisma.user.count({ where: { deletedAt: null, role: "SUPER_ADMIN" } }),
        prisma_1.prisma.user.count({ where: { deletedAt: null, isSuspended: true } }),
        prisma_1.prisma.doctor.count({ where: { isActive: true } }),
        prisma_1.prisma.doctor.count({ where: { verificationStatus: "VERIFIED" } }),
        prisma_1.prisma.doctor.count({ where: { verificationStatus: "PENDING" } }),
        prisma_1.prisma.doctor.count({ where: { verificationStatus: "REJECTED" } }),
        prisma_1.prisma.doctor.count({ where: { verificationStatus: "SUSPENDED" } }),
        prisma_1.prisma.appointment.count(),
        prisma_1.prisma.appointment.count({
            where: { status: { in: ["PENDING", "RESCHEDULE_REQUESTED"] } },
        }),
        prisma_1.prisma.appointment.count({
            where: { status: { in: ["ACCEPTED", "CONFIRMED"] } },
        }),
        prisma_1.prisma.appointment.count({ where: { status: "COMPLETED" } }),
        prisma_1.prisma.appointment.count({
            where: { status: { in: ["CANCELLED", "REJECTED"] } },
        }),
        prisma_1.prisma.consultation.count(),
        prisma_1.prisma.payment.count(),
        prisma_1.prisma.payment.count({ where: { status: "PAID" } }),
        prisma_1.prisma.payment.count({ where: { status: "PENDING" } }),
        prisma_1.prisma.payment.count({ where: { status: "REFUNDED" } }),
        prisma_1.prisma.payment.count({
            where: {
                OR: [{ provider: "FREE" }, { amount: { lte: 0 } }],
            },
        }),
        prisma_1.prisma.payment.aggregate({
            where: { status: "PAID", amount: { gt: 0 } },
            _sum: { amount: true },
        }),
        prisma_1.prisma.notification.count(),
        prisma_1.prisma.notification.count({ where: { isRead: false } }),
        prisma_1.prisma.auditLog.count(),
        prisma_1.prisma.medication.count(),
        prisma_1.prisma.labResult.count(),
        prisma_1.prisma.medicalRecord.count(),
        prisma_1.prisma.familyMember.count(),
        prisma_1.prisma.emergencyCard.count(),
        prisma_1.prisma.appointment.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { userid: true, fullName: true, email: true } },
                doctor: { select: { id: true, fullName: true, specialty: true } },
            },
        }),
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.payment.findMany({
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
    ]);
    const revenuePaid = Number(paymentAgg._sum.amount || 0);
    return {
        users,
        patients,
        admins,
        superAdmins,
        suspendedUsers,
        doctors,
        verifiedDoctors,
        pendingDoctors,
        rejectedDoctors,
        suspendedDoctors,
        appointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        consultations,
        payments,
        paidPayments,
        pendingPayments,
        refundedPayments,
        freePayments,
        revenuePaid,
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
    const [items, total] = yield Promise.all([
        prisma_1.prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { userid: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.auditLog.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listAuditLogs = listAuditLogs;
