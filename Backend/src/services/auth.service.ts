import bcrypt from "bcryptjs";
import { AuditAction, Gender, Role } from "@prisma/client";
import { generateTokens } from "../helpers/GenerateToken";
import { prisma } from "../lib/prisma";
import { generateUniqueHealthId } from "../utils/codes";
import { HttpError } from "../utils/ownership";
import { parseDate, requireEmail, requireString } from "../utils/validation";
import { createAuditLog } from "./audit.service";

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
  createdAt: true,
  updatedAt: true,
} as const;

export const registerUser = async (body: Record<string, unknown>) => {
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password", { min: 6 });
  const fullName = requireString(
    body.fullName ?? body.name,
    "fullName"
  );
  const phone =
    body.phone === undefined || body.phone === null || body.phone === ""
      ? null
      : requireString(body.phone, "phone");

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
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const updated = await prisma.user.update({
    where: { userid: user.userid },
    data: { lastLoginAt: new Date() },
    select: PUBLIC_USER_SELECT,
  });

  const tokens = await generateTokens({
    userId: updated.userid,
    email: updated.email,
    role: updated.role,
  });

  await createAuditLog({
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: updated.userid,
    description: "User logged in",
    userId: updated.userid,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return { user: updated, ...tokens };
};

export { PUBLIC_USER_SELECT };
