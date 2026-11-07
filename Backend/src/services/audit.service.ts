import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface AuditLogInput {
  action: AuditAction | string;
  entity?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  oldValue?: unknown;
  newValue?: unknown;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const toAuditAction = (action: string): AuditAction => {
  const upper = action.toUpperCase();
  if ((Object.values(AuditAction) as string[]).includes(upper)) {
    return upper as AuditAction;
  }
  return AuditAction.UPDATE;
};

export const createAuditLog = async (input: AuditLogInput) => {
  try {
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
        action: toAuditAction(String(input.action)),
        entity: input.entity ?? "UNKNOWN",
        entityId: input.entityId ?? null,
        description: input.description ?? null,
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
