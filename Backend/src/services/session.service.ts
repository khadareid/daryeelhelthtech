import crypto from "crypto";
import { prisma } from "../lib/prisma";

const REFRESH_DAYS = 7;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function parseUserAgent(ua?: string | null) {
  const raw = ua || "";
  const lower = raw.toLowerCase();
  let browser = "Browser";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/")) browser = "Chrome";
  else if (lower.includes("safari/") && !lower.includes("chrome"))
    browser = "Safari";
  else if (lower.includes("firefox/")) browser = "Firefox";

  let operatingSystem = "Unknown";
  if (lower.includes("windows")) operatingSystem = "Windows";
  else if (lower.includes("android")) operatingSystem = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad"))
    operatingSystem = "iOS";
  else if (lower.includes("mac os") || lower.includes("macintosh"))
    operatingSystem = "macOS";
  else if (lower.includes("linux")) operatingSystem = "Linux";

  let deviceType = "computer";
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    deviceType = "mobile";
  } else if (lower.includes("tablet") || lower.includes("ipad")) {
    deviceType = "tablet";
  }

  return { browser, operatingSystem, deviceType };
}

export async function createUserSession(input: {
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}) {
  const parsed = parseUserAgent(input.userAgent);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  return prisma.userSession.create({
    data: {
      userId: input.userId,
      refreshToken: hashToken(input.refreshToken),
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      operatingSystem: parsed.operatingSystem,
      location: input.location || null,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });
}

export async function listActiveSessions(userId: string, currentRefreshToken?: string) {
  const currentHash = currentRefreshToken
    ? hashToken(currentRefreshToken)
    : null;
  const rows = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: "desc" },
    take: 40,
  });

  return rows.map((s) => ({
    id: s.id,
    device:
      s.deviceType === "mobile"
        ? `${s.operatingSystem || "Mobile"} device`
        : `${s.operatingSystem || "Computer"} computer`,
    browser: s.browser,
    operatingSystem: s.operatingSystem,
    deviceType: s.deviceType,
    ipAddress: s.ipAddress,
    location: s.location,
    lastActiveAt: s.lastUsedAt,
    createdAt: s.createdAt,
    isCurrent: Boolean(currentHash && s.refreshToken === currentHash),
  }));
}

export async function revokeSession(
  userId: string,
  sessionId: string,
  opts?: { allowCurrent?: boolean; currentRefreshToken?: string }
) {
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId, isRevoked: false },
  });
  if (!session) return { revoked: false };

  if (
    !opts?.allowCurrent &&
    opts?.currentRefreshToken &&
    session.refreshToken === hashToken(opts.currentRefreshToken)
  ) {
    return { revoked: false, reason: "Cannot revoke current session here" };
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { isRevoked: true, revokedAt: new Date(), revokedBy: userId },
  });
  return { revoked: true };
}

export async function revokeOtherSessions(
  userId: string,
  currentRefreshToken?: string
) {
  const currentHash = currentRefreshToken
    ? hashToken(currentRefreshToken)
    : null;

  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      isRevoked: false,
      ...(currentHash ? { NOT: { refreshToken: currentHash } } : {}),
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy: userId,
    },
  });

  return { revokedCount: result.count };
}
