import { prisma } from "../lib/prisma";

/**
 * Permanent Daryeel Health / Patient ID.
 * Format: DRL-YYYY-NNNNNN (never reused, never changes with role).
 */
export function formatHealthId(year: number, seq: number): string {
  return `DRL-${year}-${String(seq).padStart(6, "0")}`;
}

export async function generateUniqueHealthId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DRL-${year}-`;

  for (let attempt = 0; attempt < 8; attempt++) {
    const latest = await prisma.userProfile.findFirst({
      where: { healthId: { startsWith: prefix } },
      orderBy: { healthId: "desc" },
      select: { healthId: true },
    });

    let next = 1;
    if (latest?.healthId) {
      const raw = latest.healthId.slice(prefix.length);
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) next = n + 1;
    }

    const candidate = formatHealthId(year, next + attempt);

    const clash = await prisma.userProfile.findUnique({
      where: { healthId: candidate },
      select: { userprofileid: true },
    });
    if (!clash) return candidate;
  }

  // Extremely unlikely fallback
  return `DRL-${year}-${Date.now().toString().slice(-6)}`;
}

/** Ensure a user has a UserProfile with a permanent healthId. */
export async function ensureUserProfileWithHealthId(userId: string): Promise<{
  healthId: string;
  created: boolean;
}> {
  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    select: { healthId: true },
  });

  if (existing?.healthId) {
    return { healthId: existing.healthId, created: false };
  }

  const healthId = await generateUniqueHealthId();

  if (existing) {
    await prisma.userProfile.update({
      where: { userId },
      data: { healthId },
    });
    return { healthId, created: true };
  }

  await prisma.userProfile.create({
    data: { userId, healthId },
  });
  return { healthId, created: true };
}

/** Backfill health IDs for all users missing one. */
export async function backfillMissingHealthIds(): Promise<number> {
  const missing = await prisma.userProfile.findMany({
    where: { OR: [{ healthId: null }, { healthId: "" }] },
    select: { userId: true },
  });

  const usersWithoutProfile = await prisma.user.findMany({
    where: { profile: null, isDeleted: false },
    select: { userid: true },
  });

  let count = 0;
  for (const row of missing) {
    await ensureUserProfileWithHealthId(row.userId);
    count += 1;
  }
  for (const row of usersWithoutProfile) {
    await ensureUserProfileWithHealthId(row.userid);
    count += 1;
  }
  return count;
}

export function slugifyProfessionalName(fullName: string, suffix?: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return suffix ? `${base}-${suffix}` : base || `pro-${Date.now().toString(36)}`;
}
