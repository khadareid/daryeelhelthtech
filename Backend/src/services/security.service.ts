import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { requireEmail, requirePhone } from "../utils/validation";
import { createNotification } from "./notification.service";
import {
  listActiveSessions,
  parseUserAgent,
  revokeOtherSessions,
  revokeSession,
} from "./session.service";

const NOTIFY_TYPES = new Set([
  "LOGIN",
  "FAILED_LOGIN",
  "PASSWORD_CHANGED",
  "PHONE_ADDED",
  "PHONE_CHANGED",
  "EMAIL_CHANGED",
  "SESSION_REVOKED",
  "SESSIONS_REVOKED_OTHERS",
  "RECOVERY_EMAIL_UPDATED",
  "SESSION_CREATED",
]);

export async function recordSecurityActivity(input: {
  userId: string;
  type: string;
  title?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  metadata?: Record<string, unknown>;
  notify?: boolean;
}) {
  const parsed = parseUserAgent(input.userAgent);
  const title = input.title || humanizeSecurityType(input.type);
  try {
    await prisma.securityActivity.create({
      data: {
        userId: input.userId,
        type: input.type,
        title,
        device: parsed.deviceType,
        browser: parsed.browser,
        operatingSystem: parsed.operatingSystem,
        ipAddress: input.ipAddress || null,
        location: input.location || null,
        metadata: (input.metadata as Prisma.InputJsonValue) || undefined,
      },
    });
  } catch {
    // Non-fatal if table not migrated yet
  }

  const shouldNotify = input.notify !== false && NOTIFY_TYPES.has(input.type);
  if (!shouldNotify) return;

  const deviceHint = [parsed.operatingSystem, parsed.browser]
    .filter(Boolean)
    .join(" · ");
  const bodyParts = [
    securityNotifyBody(input.type, title),
    deviceHint || null,
    input.location || null,
  ].filter(Boolean);

  try {
    await createNotification({
      userId: input.userId,
      title: `Security · ${title}`,
      body: bodyParts.join(" · "),
      type: NotificationType.SYSTEM,
      data: {
        kind: "security",
        securityType: input.type,
      },
    });
  } catch {
    // Activity still recorded if notification write fails
  }
}

function humanizeSecurityType(type: string) {
  const map: Record<string, string> = {
    LOGIN: "New sign-in",
    LOGOUT: "Signed out",
    PASSWORD_CHANGED: "Password changed",
    PHONE_ADDED: "Phone number added",
    PHONE_CHANGED: "Phone number changed",
    EMAIL_CHANGED: "Email changed",
    PROFILE_UPDATED: "Profile updated",
    SESSION_CREATED: "New device session",
    SESSION_REVOKED: "Device signed out",
    SESSIONS_REVOKED_OTHERS: "Signed out other devices",
    FAILED_LOGIN: "Failed sign-in attempt",
    RECOVERY_EMAIL_UPDATED: "Recovery email updated",
  };
  return map[type] || type.replace(/_/g, " ").toLowerCase();
}

function securityNotifyBody(type: string, title: string) {
  const map: Record<string, string> = {
    LOGIN: "Someone signed in to your Daryeel account.",
    FAILED_LOGIN: "A failed sign-in attempt was detected.",
    PASSWORD_CHANGED: "Your password was changed successfully.",
    PHONE_ADDED: "A phone number was added to your account.",
    PHONE_CHANGED: "Your phone number was updated.",
    EMAIL_CHANGED: "Your email address was updated.",
    SESSION_REVOKED: "A device was signed out of your account.",
    SESSIONS_REVOKED_OTHERS: "All other devices were signed out.",
    RECOVERY_EMAIL_UPDATED: "Your recovery email was updated.",
    SESSION_CREATED: "A new device session was created.",
  };
  return map[type] || `${title} on your Daryeel account.`;
}

export async function getSecurityStatus(userId: string) {
  const user = await prisma.user.findFirst({
    where: { userid: userId, deletedAt: null },
    select: {
      email: true,
      phone: true,
      passwordHash: true,
      passwordChangedAt: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
      recoveryEmail: true,
      lastLoginAt: true,
      lastLoginIp: true,
    },
  });
  if (!user) throw new HttpError(404, "User not found");

  const activeSessions = await prisma.userSession.count({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  const phoneAdded = Boolean(user.phone);
  const emailAdded = Boolean(user.email);
  const passwordSet = Boolean(user.passwordHash);
  const twoFactorEnabled = Boolean(user.twoFactorEnabled);

  let score = 0;
  if (emailAdded) score += 20;
  if (passwordSet) score += 25;
  if (phoneAdded) score += 25;
  if (user.emailVerified) score += 10;
  if (user.phoneVerified) score += 10;
  if (twoFactorEnabled) score += 10;
  score = Math.min(100, score);

  const recommendations: string[] = [];
  if (!phoneAdded) recommendations.push("Add a phone number");
  if (!passwordSet) recommendations.push("Set a password");
  if (!twoFactorEnabled)
    recommendations.push("Enable 2-Step Verification (coming soon)");
  if (!user.recoveryEmail)
    recommendations.push("Add a recovery email");

  return {
    securityScore: score,
    protected: score >= 70 && phoneAdded && passwordSet,
    phoneAdded,
    emailAdded,
    passwordSet,
    passwordChangedAt: user.passwordChangedAt,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod,
    passkeysCount: 0,
    authenticatorConfigured: false,
    recoveryEmail: user.recoveryEmail,
    recoveryPhone: user.phone,
    activeSessions,
    lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp,
    recommendations,
    comingSoon: {
      twoFactor: true,
      passkeys: true,
      authenticatorApp: true,
      whatsappVerification: true,
    },
  };
}

export async function listSecurityActivity(userId: string, limit = 30) {
  const items = await prisma.securityActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });

  return items.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title || humanizeSecurityType(a.type),
    device: a.device,
    browser: a.browser,
    operatingSystem: a.operatingSystem,
    ipAddress: a.ipAddress,
    location: a.location,
    createdAt: a.createdAt,
  }));
}

export async function getSessions(userId: string, refreshToken?: string) {
  return listActiveSessions(userId, refreshToken);
}

export async function revokeOneSession(
  userId: string,
  sessionId: string,
  currentRefreshToken?: string,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const result = await revokeSession(userId, sessionId, {
    currentRefreshToken,
    allowCurrent: false,
  });
  if (result.revoked) {
    await recordSecurityActivity({
      userId,
      type: "SESSION_REVOKED",
      title: "Device signed out",
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
  return result;
}

export async function revokeOthers(
  userId: string,
  currentRefreshToken?: string,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const result = await revokeOtherSessions(userId, currentRefreshToken);
  await recordSecurityActivity({
    userId,
    type: "SESSIONS_REVOKED_OTHERS",
    title: "Signed out of all other devices",
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
    metadata: { revokedCount: result.revokedCount },
  });
  return result;
}

export async function updateRecoveryEmail(
  userId: string,
  body: Record<string, unknown>
) {
  const recoveryEmail =
    body.recoveryEmail === null || body.recoveryEmail === ""
      ? null
      : requireEmail(body.recoveryEmail);

  const user = await prisma.user.update({
    where: { userid: userId },
    data: { recoveryEmail },
    select: {
      userid: true,
      email: true,
      recoveryEmail: true,
    },
  });

  await recordSecurityActivity({
    userId,
    type: "RECOVERY_EMAIL_UPDATED",
    title: recoveryEmail ? "Recovery email added" : "Recovery email removed",
  });

  return user;
}

export async function updateSecurityPhone(
  userId: string,
  body: Record<string, unknown>,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const phone = requirePhone(body.phone, "phone");
  const existing = await prisma.user.findFirst({
    where: { userid: userId, deletedAt: null },
    select: { phone: true },
  });
  if (!existing) throw new HttpError(404, "User not found");

  const taken = await prisma.user.findFirst({
    where: { phone, deletedAt: null, NOT: { userid: userId } },
  });
  if (taken) throw new HttpError(409, "Phone already registered");

  const user = await prisma.user.update({
    where: { userid: userId },
    data: { phone },
    select: {
      userid: true,
      phone: true,
      email: true,
      fullName: true,
    },
  });

  await recordSecurityActivity({
    userId,
    type: existing.phone ? "PHONE_CHANGED" : "PHONE_ADDED",
    title: existing.phone ? "Phone number changed" : "Phone number added",
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return user;
}

export async function updatePrimaryEmail(
  userId: string,
  body: Record<string, unknown>,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const email = requireEmail(body.email);
  const taken = await prisma.user.findFirst({
    where: { email, deletedAt: null, NOT: { userid: userId } },
  });
  if (taken) throw new HttpError(409, "Email already registered");

  const user = await prisma.user.update({
    where: { userid: userId },
    data: { email, emailVerified: false },
    select: {
      userid: true,
      email: true,
      phone: true,
      fullName: true,
      emailVerified: true,
    },
  });

  await recordSecurityActivity({
    userId,
    type: "EMAIL_CHANGED",
    title: "Email address changed",
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return user;
}
