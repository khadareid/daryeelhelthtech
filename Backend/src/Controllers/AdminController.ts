import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";
import {
  ensureDefaultFeatureFlags,
  isFeatureAllowed,
} from "../services/featureFlag.service";
import crypto from "crypto";

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

/** GET /admin/stats */
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    await ensureDefaultFeatureFlags();
    const [
      totalUsers,
      patients,
      professionals,
      byRole,
      pendingApps,
      verifiedPros,
      unverifiedPros,
      activeUsers,
      suspendedUsers,
      deactivatedUsers,
      appointments,
      appointmentTotal,
      messages,
      planCount,
      activeSubscriptions,
      newsPosts,
      newsComments,
      newsReports,
      recentUsers,
      recentAudits,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { role: Role.PATIENT, isDeleted: false } }),
      prisma.user.count({
        where: {
          isDeleted: false,
          role: {
            in: [
              Role.DOCTOR,
              Role.NURSE,
              Role.MIDWIFE,
              Role.LAB_TECH,
              Role.PHARMACIST,
            ],
          },
        },
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      prisma.professionalApplication.count({
        where: { status: { in: ["PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"] } },
      }),
      prisma.professionalProfile.count({ where: { isVerified: true, deletedAt: null } }),
      prisma.professionalProfile.count({ where: { isVerified: false, deletedAt: null } }),
      prisma.user.count({ where: { isActive: true, isSuspended: false, isDeleted: false } }),
      prisma.user.count({ where: { isSuspended: true, isDeleted: false } }),
      prisma.user.count({ where: { OR: [{ isActive: false }, { isDeleted: true }] } }),
      prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.appointment.count(),
      prisma.message.count(),
      prisma.platformPlan.count({ where: { isActive: true } }),
      prisma.platformSubscription.count({
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
      }),
      prisma.newsPost.count({ where: { deletedAt: null } }),
      prisma.newsComment.count({ where: { deletedAt: null } }),
      prisma.newsReport.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.user.findMany({
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
      prisma.auditLog.findMany({
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
        usersByRole: byRole.map((r: { role: Role; _count: { _all: number } }) => ({
          role: r.role,
          count: r._count._all,
        })),
        appointmentsByStatus: appointments.map(
          (a: { status: string; _count: { _all: number } }) => ({
            status: a.status,
            count: a._count._all,
          }),
        ),
        recentRegistrations: recentUsers,
        recentAdminActivity: recentAudits,
        apiHealth: { status: "ok", at: new Date().toISOString() },
      },
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load admin stats" });
  }
};

/** GET /admin/users */
export const listAdminUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role;
    }
    if (status === "active") {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === "suspended") {
      where.isSuspended = true;
    } else if (status === "deactivated") {
      where.isActive = false;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
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
  } catch (error) {
    console.error("listAdminUsers error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to list users" });
  }
};

/** GET /admin/users/:id */
export const getAdminUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error("getAdminUser error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load user" });
  }
};

/** PATCH /admin/users/:id */
export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = actor(req);
    const id = String(req.params.id);
    const {
      fullName,
      phone,
      role,
      isActive,
      isSuspended,
    } = req.body ?? {};

    const target = await prisma.user.findUnique({ where: { userid: id } });
    if (!target) {
      res.status(404).json({ isSuccess: false, message: "User not found" });
      return;
    }

    if (target.role === Role.SUPER_ADMIN && (isActive === false || isSuspended === true)) {
      const otherSupers = await prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
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

    if (role === Role.SUPER_ADMIN || role === Role.ADMIN || role) {
      const allowed = await isFeatureAllowed({
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

    const data: any = {};
    if (typeof fullName === "string") data.fullName = fullName.trim();
    if (typeof phone === "string") data.phone = phone.trim() || null;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof isSuspended === "boolean") data.isSuspended = isSuspended;
    if (role && Object.values(Role).includes(role)) {
      if (target.role === Role.SUPER_ADMIN && role !== Role.SUPER_ADMIN) {
        const otherSupers = await prisma.user.count({
          where: {
            role: Role.SUPER_ADMIN,
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

    const updated = await prisma.user.update({
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

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: adminId || undefined,
      action: "ADMIN_USER_UPDATE",
      entity: "User",
      entityId: id,
      metadata: { changes: data },
      ...meta,
    });

    res.status(200).json({ isSuccess: true, result: updated });
  } catch (error) {
    console.error("updateAdminUser error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update user" });
  }
};

/** POST /admin/users/:id/password-reset */
export const adminInitiatePasswordReset = async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = actor(req);
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { userid: id } });
    if (!user) {
      res.status(404).json({ isSuccess: false, message: "User not found" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordReset.create({
      data: { userId: id, token, expiresAt },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        title: "Password reset initiated",
        body: "An administrator started a password reset for your account. Use the secure link sent to your email, or contact support.",
        type: "SYSTEM",
        channel: "IN_APP",
        metadata: { source: "admin", adminId },
      },
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: adminId || undefined,
      action: "ADMIN_PASSWORD_RESET",
      entity: "User",
      entityId: id,
      metadata: { expiresAt },
      ...meta,
    });

    // Never return the raw token to the client UI in production lists —
    // include once for admin delivery channel configuration.
    res.status(200).json({
      isSuccess: true,
      message: "Password reset initiated",
      result: { expiresAt, resetToken: token },
    });
  } catch (error) {
    console.error("adminInitiatePasswordReset error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to initiate reset" });
  }
};

/** GET /admin/features */
export const listFeatureFlags = async (_req: Request, res: Response) => {
  try {
    await ensureDefaultFeatureFlags();
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
    res.status(200).json({ isSuccess: true, result: flags });
  } catch (error) {
    console.error("listFeatureFlags error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load features" });
  }
};

/** PATCH /admin/features/:key */
export const updateFeatureFlag = async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = actor(req);
    const key = String(req.params.key);
    const { enabled, allowedRoles, actions, client, description } = req.body ?? {};

    const data: any = {};
    if (typeof enabled === "boolean") data.enabled = enabled;
    if (Array.isArray(allowedRoles)) data.allowedRoles = allowedRoles.map(String);
    if (Array.isArray(actions)) data.actions = actions.map(String);
    if (client) data.client = client;
    if (typeof description === "string") data.description = description;

    const flag = await prisma.featureFlag.update({
      where: { key },
      data,
    });

    await createAuditLog({
      userId: adminId || undefined,
      action: "FEATURE_FLAG_UPDATE",
      entity: "FeatureFlag",
      entityId: flag.featureflagid,
      metadata: data,
      ...getClientMeta(req),
    });

    res.status(200).json({ isSuccess: true, result: flag });
  } catch (error) {
    console.error("updateFeatureFlag error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update feature" });
  }
};

/** GET /admin/audit-logs */
export const listAdminAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const action = String(req.query.action || "").trim();
    const entity = String(req.query.entity || "").trim();
    const search = String(req.query.search || "").trim();

    const where: any = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
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
  } catch (error) {
    console.error("listAdminAuditLogs error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load audit logs" });
  }
};

/** GET /admin/appointments */
export const listAdminAppointments = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();

    const where: any = {};
    if (status) where.status = status;
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

    const [total, rows] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
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
  } catch (error) {
    console.error("listAdminAppointments error:", error);
    res
      .status(500)
      .json({ isSuccess: false, message: "Failed to load appointments" });
  }
};

/** GET /features/me — resolved flags for current user (web/mobile) */
export const getMyFeatures = async (req: Request, res: Response) => {
  try {
    await ensureDefaultFeatureFlags();
    const { userId, role } = actor(req);
    const client = String(req.query.client || "ALL").toUpperCase() as
      | "WEB"
      | "MOBILE"
      | "ALL";
    const flags = await prisma.featureFlag.findMany();
    const resolved = [];
    for (const flag of flags) {
      const allowed = await isFeatureAllowed({
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
  } catch (error) {
    console.error("getMyFeatures error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to resolve features" });
  }
};
