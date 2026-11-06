import bcrypt from "bcryptjs";
import { Gender, Prisma, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateUniqueHealthId } from "../utils/codes";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseDate,
  requireEmail,
  requireString,
} from "../utils/validation";
import { PUBLIC_USER_SELECT } from "./auth.service";

export const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { userid: userId, deletedAt: null },
    select: {
      ...PUBLIC_USER_SELECT,
      medicalProfile: true,
      doctor: true,
      emergencyCard: true,
    },
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
};

export const updateMe = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const data: Prisma.UserUpdateInput = {};

  if (body.fullName !== undefined) {
    data.fullName = requireString(body.fullName, "fullName");
  }
  if (body.phone !== undefined) {
    data.phone =
      body.phone === null || body.phone === ""
        ? null
        : requireString(body.phone, "phone");
  }
  if (body.gender !== undefined) {
    const g = String(body.gender).toUpperCase() as Gender;
    data.gender = Object.values(Gender).includes(g) ? g : null;
  }
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = parseDate(body.dateOfBirth, "dateOfBirth") ?? null;
  }
  if (body.avatarUrl !== undefined) {
    data.avatarUrl = optionalString(body.avatarUrl) ?? null;
  }
  if (body.picture !== undefined) {
    data.picture = optionalString(body.picture) ?? null;
  }
  if (body.language !== undefined) {
    data.language = requireString(body.language, "language");
  }
  if (body.timezone !== undefined) {
    data.timezone = requireString(body.timezone, "timezone");
  }
  if (body.country !== undefined) data.country = optionalString(body.country) ?? null;
  if (body.region !== undefined) data.region = optionalString(body.region) ?? null;
  if (body.city !== undefined) data.city = optionalString(body.city) ?? null;
  if (body.district !== undefined) {
    data.district = optionalString(body.district) ?? null;
  }

  return prisma.user.update({
    where: { userid: userId },
    data,
    select: PUBLIC_USER_SELECT,
  });
};

export const changePassword = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const currentPassword = requireString(body.currentPassword, "currentPassword");
  const newPassword = requireString(body.newPassword, "newPassword", {
    min: 6,
  });

  const user = await prisma.user.findUnique({ where: { userid: userId } });
  if (!user || user.deletedAt) throw new HttpError(404, "User not found");
  if (!user.passwordHash) {
    throw new HttpError(400, "Account has no password set");
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new HttpError(401, "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { userid: userId },
    data: { passwordHash },
  });

  return { changed: true };
};

export const listUsers = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (query.role) where.role = String(query.role) as Role;
  if (query.status === "suspended") where.isSuspended = true;
  if (query.status === "active") {
    where.isSuspended = false;
    where.isActive = true;
  }
  const q = query.q || query.search;
  if (q) {
    const needle = String(q);
    where.OR = [
      { email: { contains: needle, mode: "insensitive" } },
      { fullName: { contains: needle, mode: "insensitive" } },
      { phone: { contains: needle, mode: "insensitive" } },
      { healthId: { contains: needle, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        ...PUBLIC_USER_SELECT,
        doctor: {
          select: {
            id: true,
            specialty: true,
            verificationStatus: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { userid: id, deletedAt: null },
    select: {
      ...PUBLIC_USER_SELECT,
      suspensionReason: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspendedBy: true,
      lastActiveAt: true,
      lastLoginIp: true,
      passwordChangedAt: true,
      twoFactorEnabled: true,
      medicalProfile: true,
      emergencyCard: true,
      doctor: true,
      _count: {
        select: {
          appointments: true,
          payments: true,
          consultations: true,
          notifications: true,
          familyMembers: true,
          medications: true,
          labResults: true,
          medicalRecords: true,
        },
      },
      appointments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          appointmentCode: true,
          scheduledAt: true,
          status: true,
          paymentStatus: true,
          doctor: { select: { fullName: true, specialty: true } },
        },
      },
      payments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          method: true,
          provider: true,
          paymentReference: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
};

export const adminCreateUser = async (
  body: Record<string, unknown>,
  actor?: { userId: string; role: string }
) => {
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password", { min: 6 });
  const fullName = requireString(body.fullName ?? body.name, "fullName");
  const role = (body.role as Role) || Role.USER;

  if (!Object.values(Role).includes(role)) {
    throw new HttpError(400, "Invalid role");
  }

  const actorRole = String(actor?.role || "").toUpperCase();
  if (role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
    throw new HttpError(403, "Only SUPER_ADMIN can create SUPER_ADMIN accounts");
  }
  if (
    role === Role.ADMIN &&
    actorRole !== Role.SUPER_ADMIN &&
    actorRole !== Role.ADMIN
  ) {
    throw new HttpError(403, "Not allowed to create admin accounts");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && !exists.deletedAt) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const healthId = await generateUniqueHealthId();

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role,
      healthId,
      phone: optionalString(body.phone) ?? null,
      emailVerified: Boolean(body.emailVerified ?? true),
      passwordChangedAt: new Date(),
      medicalProfile: { create: {} },
    },
    select: PUBLIC_USER_SELECT,
  });
};

export const adminUpdateUser = async (
  id: string,
  body: Record<string, unknown>,
  actor?: { userId: string; role: string }
) => {
  const existing = await prisma.user.findFirst({
    where: { userid: id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, "User not found");

  const actorRole = String(actor?.role || "").toUpperCase();
  if (
    existing.role === Role.SUPER_ADMIN &&
    actorRole !== Role.SUPER_ADMIN
  ) {
    throw new HttpError(403, "Only SUPER_ADMIN can edit SUPER_ADMIN accounts");
  }

  const data: Prisma.UserUpdateInput = {};
  if (body.fullName !== undefined) {
    data.fullName = requireString(body.fullName, "fullName");
  }
  if (body.role !== undefined) {
    const role = body.role as Role;
    if (!Object.values(Role).includes(role)) {
      throw new HttpError(400, "Invalid role");
    }
    if (role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new HttpError(403, "Only SUPER_ADMIN can assign SUPER_ADMIN");
    }
    data.role = role;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.isSuspended !== undefined) {
    data.isSuspended = Boolean(body.isSuspended);
    if (body.isSuspended) {
      data.suspendedAt = new Date();
      data.suspendedBy = actor?.userId || null;
      data.suspensionReason =
        optionalString(body.suspensionReason) ??
        existing.suspensionReason ??
        null;
      if (body.suspendedUntil) {
        data.suspendedUntil =
          parseDate(body.suspendedUntil, "suspendedUntil") ?? null;
      }
    } else {
      data.suspendedAt = null;
      data.suspendedBy = null;
      data.suspensionReason = null;
      data.suspendedUntil = null;
    }
  }
  if (body.emailVerified !== undefined) {
    data.emailVerified = Boolean(body.emailVerified);
  }
  if (body.phone !== undefined) {
    data.phone = optionalString(body.phone) ?? null;
  }
  if (body.city !== undefined) data.city = optionalString(body.city) ?? null;
  if (body.country !== undefined) {
    data.country = optionalString(body.country) ?? null;
  }
  if (body.language !== undefined) {
    data.language = requireString(body.language, "language");
  }

  return prisma.user.update({
    where: { userid: id },
    data,
    select: PUBLIC_USER_SELECT,
  });
};

/** Admin / Super Admin sets a new password for a user (support). */
export const adminResetPassword = async (
  id: string,
  body: Record<string, unknown>,
  actor?: { userId: string; role: string }
) => {
  const existing = await prisma.user.findFirst({
    where: { userid: id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, "User not found");

  const actorRole = String(actor?.role || "").toUpperCase();
  if (
    existing.role === Role.SUPER_ADMIN &&
    actorRole !== Role.SUPER_ADMIN
  ) {
    throw new HttpError(
      403,
      "Only SUPER_ADMIN can reset SUPER_ADMIN passwords"
    );
  }
  if (
    existing.role === Role.ADMIN &&
    actorRole !== Role.SUPER_ADMIN &&
    actor?.userId !== existing.userid
  ) {
    // ADMIN may reset USER passwords; only SUPER_ADMIN resets other ADMIN passwords
    if (actorRole !== Role.SUPER_ADMIN) {
      throw new HttpError(403, "Only SUPER_ADMIN can reset admin passwords");
    }
  }

  const newPassword = requireString(
    body.newPassword ?? body.password,
    "newPassword",
    { min: 6 }
  );
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { userid: id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  return {
    changed: true,
    userid: id,
    fullName: existing.fullName,
    email: existing.email,
  };
};

export const softDeleteUser = async (
  id: string,
  actor?: { userId: string; role: string },
  body?: Record<string, unknown>
) => {
  const existing = await prisma.user.findFirst({
    where: { userid: id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, "User not found");

  const actorRole = String(actor?.role || "").toUpperCase();
  // Self-delete from profile still allowed without actor role check
  if (actor && actorRole && actor.userId !== id) {
    if (actorRole !== Role.SUPER_ADMIN) {
      throw new HttpError(403, "Only SUPER_ADMIN can delete users");
    }
  }
  if (existing.userid === actor?.userId && actorRole === Role.SUPER_ADMIN) {
    throw new HttpError(400, "You cannot delete your own admin account here");
  }

  return prisma.user.update({
    where: { userid: id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      deletedBy: actor?.userId || null,
      deletedReason: optionalString(body?.reason) ?? null,
      email: `deleted_${Date.now()}_${existing.email}`,
      phone: null,
    },
    select: { userid: true, deletedAt: true },
  });
};
