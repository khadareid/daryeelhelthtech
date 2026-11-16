import bcrypt from "bcryptjs";
import { AuditAction, Gender, Role } from "@prisma/client";
import { generateTokens } from "../helpers/GenerateToken";
import { prisma } from "../lib/prisma";
import { generateUniqueHealthId } from "../utils/codes";
import { HttpError } from "../utils/ownership";
import {
  parseDate,
  requireEmail,
  requirePhone,
  requireString,
} from "../utils/validation";
import { createAuditLog } from "./audit.service";
import { recordSecurityActivity } from "./security.service";
import { createUserSession } from "./session.service";

const PUBLIC_USER_SELECT = {
  userid: true,
  email: true,
  phone: true,
  fullName: true,
  gender: true,
  dateOfBirth: true,
  avatarUrl: true,
  picture: true,
  healthId: true,
  role: true,
  emailVerified: true,
  phoneVerified: true,
  language: true,
  timezone: true,
  country: true,
  region: true,
  city: true,
  district: true,
  isActive: true,
  isSuspended: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  twoFactorEnabled: true,
  twoFactorMethod: true,
  recoveryEmail: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const registerUser = async (
  body: Record<string, unknown>,
  meta?: { ipAddress?: string; userAgent?: string }
) => {
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password", { min: 6 });
  const fullName = requireString(body.fullName ?? body.name, "fullName");
  // Phone is collected after signup via PhoneRequiredGate (optional here).
  const phone =
    body.phone === undefined || body.phone === null || body.phone === ""
      ? null
      : requirePhone(body.phone, "phone");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) {
    throw new HttpError(409, "Email already registered");
  }

  if (phone) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
    if (phoneTaken) throw new HttpError(409, "Phone already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const healthId = await generateUniqueHealthId();
  const gender = body.gender
    ? (String(body.gender).toUpperCase() as Gender)
    : undefined;
  const dateOfBirth = parseDate(body.dateOfBirth, "dateOfBirth");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone,
      passwordChangedAt: new Date(),
      gender: gender && Object.values(Gender).includes(gender) ? gender : null,
      dateOfBirth: dateOfBirth ?? null,
      role: Role.USER,
      healthId,
      medicalProfile: { create: {} },
    },
    select: PUBLIC_USER_SELECT,
  });

  const tokens = await generateTokens({
    userId: user.userid,
    email: user.email,
    role: user.role,
  });

  await createUserSession({
    userId: user.userid,
    refreshToken: tokens.refreshToken,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  }).catch(() => undefined);

  await recordSecurityActivity({
    userId: user.userid,
    type: "SESSION_CREATED",
    title: "Account created",
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return { user, ...tokens };
};

export const loginUser = async (
  body: Record<string, unknown>,
  meta?: { ipAddress?: string; userAgent?: string }
) => {
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (!user.isActive || user.isSuspended) {
    throw new HttpError(403, "Account is not active");
  }
  if (!user.passwordHash) {
    throw new HttpError(400, "Please sign in with Google or reset your password");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await recordSecurityActivity({
      userId: user.userid,
      type: "FAILED_LOGIN",
      title: "Failed sign-in attempt",
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
    throw new HttpError(401, "Invalid email or password");
  }

  const updated = await prisma.user.update({
    where: { userid: user.userid },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: meta?.ipAddress || null,
      lastActiveAt: new Date(),
    },
    select: PUBLIC_USER_SELECT,
  });

  const tokens = await generateTokens({
    userId: updated.userid,
    email: updated.email,
    role: updated.role,
  });

  await createUserSession({
    userId: updated.userid,
    refreshToken: tokens.refreshToken,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  }).catch(() => undefined);

  await createAuditLog({
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: updated.userid,
    description: "User logged in",
    userId: updated.userid,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  await recordSecurityActivity({
    userId: updated.userid,
    type: "LOGIN",
    title: "New sign-in",
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return { user: updated, ...tokens };
};

export { PUBLIC_USER_SELECT };
