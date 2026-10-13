import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuditLogInput {
  action: string;
  entity?: string;
  entityId?: string;

  // ✅ Direct metadata object
  metadata?: Record<string, unknown> | null;

  // ✅ Backward-compatible (optional)
  oldValue?: unknown;
  newValue?: unknown;

  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (input: AuditLogInput) => {
  try {
    // Haddii `metadata` la soo diray, isticmaal. Haddii kale, ka dhis oldValue/newValue
    let metadata: Prisma.InputJsonValue | undefined;

    if (input.metadata && Object.keys(input.metadata).length > 0) {
      metadata = input.metadata as Prisma.InputJsonValue;
    } else if (input.oldValue !== undefined || input.newValue !== undefined) {
      const built: Record<string, unknown> = {};
      if (input.oldValue !== undefined) built.oldValue = input.oldValue;
      if (input.newValue !== undefined) built.newValue = input.newValue;
      metadata = built as Prisma.InputJsonValue;
    }

    return await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        metadata: metadata ?? undefined,
        userId: input.userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return null;
  }
};

export const getClientMeta = (req: {
  ip?: string;
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}) => {
  const forwardedFor = req.headers?.["x-forwarded-for"];

  const ipAddress =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : req.ip ?? req.socket?.remoteAddress;

  const userAgent =
    typeof req.headers?.["user-agent"] === "string"
      ? (req.headers["user-agent"] as string)
      : undefined;

  return { ipAddress, userAgent };
};