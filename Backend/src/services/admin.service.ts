import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { runInBatches } from "../utils/dbBatch";
import { pageMeta, parsePagination } from "../utils/pagination";

const countMap = (
  rows: Array<Record<string, unknown>>,
  key: string
): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const k = String(row[key] ?? "");
    const count = row._count;
    map[k] =
      typeof count === "number"
        ? count
        : typeof count === "object" && count && "_all" in count
          ? Number((count as { _all: number })._all)
          : Number(count ?? 0);
  }
  return map;
};

export const getDashboardStats = async () => {
  // Prefer groupBy + small batches over ~33 parallel count() calls so
  // Neon’s Prisma pool (often limit 5–8) is not exhausted (P2024).
  const [
    users,
    suspendedUsers,
    userByRole,
    doctorsActive,
    doctorByStatus,
    appointments,
    appointmentByStatus,
    consultations,
    payments,
    paymentByStatus,
    freePayments,
    paymentAgg,
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
  ] = (await runInBatches(
    [
      () => prisma.user.count({ where: { deletedAt: null } }),
      () =>
        prisma.user.count({ where: { deletedAt: null, isSuspended: true } }),
      () =>
        prisma.user.groupBy({
          by: ["role"],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
      () => prisma.doctor.count({ where: { isActive: true } }),
      () =>
        prisma.doctor.groupBy({
          by: ["verificationStatus"],
          _count: { _all: true },
        }),
      () => prisma.appointment.count(),
      () =>
        prisma.appointment.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      () => prisma.consultation.count(),
      () => prisma.payment.count(),
      () =>
        prisma.payment.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      () =>
        prisma.payment.count({
          where: {
            OR: [{ provider: "FREE" }, { amount: { lte: 0 } }],
          },
        }),
      () =>
        prisma.payment.aggregate({
          where: { status: "PAID", amount: { gt: 0 } },
          _sum: { amount: true },
        }),
      () => prisma.notification.count(),
      () => prisma.notification.count({ where: { isRead: false } }),
      () => prisma.auditLog.count(),
      () => prisma.medication.count(),
      () => prisma.labResult.count(),
      () => prisma.medicalRecord.count(),
      () => prisma.familyMember.count(),
      () => prisma.emergencyCard.count(),
      () =>
        prisma.appointment.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { userid: true, fullName: true, email: true } },
            doctor: { select: { id: true, fullName: true, specialty: true } },
          },
        }),
      () =>
        prisma.user.findMany({
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
      () =>
        prisma.payment.findMany({
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
    ],
    4
  )) as [
    number,
    number,
    Array<Record<string, unknown>>,
    number,
    Array<Record<string, unknown>>,
    number,
    Array<Record<string, unknown>>,
    number,
    number,
    Array<Record<string, unknown>>,
    number,
    { _sum: { amount: Prisma.Decimal | number | null } },
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    unknown[],
    unknown[],
    unknown[],
  ];

  const roles = countMap(userByRole, "role");
  const doctorStatus = countMap(doctorByStatus, "verificationStatus");
  const apptStatus = countMap(appointmentByStatus, "status");
  const payStatus = countMap(paymentByStatus, "status");

  const pendingAppointments =
    (apptStatus.PENDING || 0) + (apptStatus.RESCHEDULE_REQUESTED || 0);
  const confirmedAppointments =
    (apptStatus.ACCEPTED || 0) + (apptStatus.CONFIRMED || 0);
  const cancelledAppointments =
    (apptStatus.CANCELLED || 0) + (apptStatus.REJECTED || 0);

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
};

export const listAuditLogs = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.AuditLogWhereInput = {};
  if (query.userId) where.userId = String(query.userId);
  if (query.action) where.action = String(query.action) as never;
  if (query.entity) where.entity = String(query.entity);

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

  const [items, total] = (await runInBatches(
    [
      () =>
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { userid: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
      () => prisma.auditLog.count({ where }),
    ],
    2
  )) as [unknown[], number];

  return { items, meta: pageMeta(total, page, limit) };
};
