import { Request, Response } from "express";
import {
  ConnectionRequestedBy,
  ConnectionStatus,
  NotificationChannel,
  NotificationType,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";

const CLINICAL: Role[] = [
  Role.DOCTOR,
  Role.NURSE,
  Role.MIDWIFE,
  Role.LAB_TECH,
  Role.PHARMACIST,
];

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

async function assertProfessional(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userid: userId },
    select: {
      role: true,
      professionalProfiles: {
        where: { isActive: true, deletedAt: null },
        take: 1,
        select: { isVerified: true, professionalType: true },
      },
    },
  });
  if (!user) return null;
  const profile = user.professionalProfiles[0];
  if (profile?.isVerified && CLINICAL.includes(profile.professionalType)) {
    return { role: profile.professionalType, verified: true };
  }
  if (CLINICAL.includes(user.role)) {
    return { role: user.role, verified: Boolean(profile?.isVerified) };
  }
  return null;
}

/** POST /connections — patient requests connection with a professional */
export const requestConnection = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const professionalUserId = String(req.body?.professionalUserId || "").trim();
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    if (!professionalUserId) {
      res.status(400).json({
        isSuccess: false,
        message: "professionalUserId is required",
      });
      return;
    }

    if (professionalUserId === userId) {
      res.status(400).json({
        isSuccess: false,
        message: "You cannot connect with yourself",
      });
      return;
    }

    const pro = await assertProfessional(professionalUserId);
    if (!pro) {
      res.status(400).json({
        isSuccess: false,
        message: "Target user is not an approved professional",
      });
      return;
    }

    const existing = await prisma.patientProfessionalConnection.findUnique({
      where: {
        patientUserId_professionalUserId: {
          patientUserId: userId,
          professionalUserId,
        },
      },
    });

    if (existing) {
      if (
        existing.status === ConnectionStatus.PENDING ||
        existing.status === ConnectionStatus.ACCEPTED
      ) {
        res.status(409).json({
          isSuccess: false,
          message: `Connection already ${existing.status.toLowerCase()}`,
          result: existing,
        });
        return;
      }
      // Re-open rejected/ended/blocked as new pending request
      const updated = await prisma.patientProfessionalConnection.update({
        where: { id: existing.id },
        data: {
          status: ConnectionStatus.PENDING,
          requestedBy: ConnectionRequestedBy.PATIENT,
          reason,
          requestedAt: new Date(),
          acceptedAt: null,
          rejectedAt: null,
          endedAt: null,
        },
      });
      await notifyConnection(professionalUserId, userId, "requested");
      res.status(200).json({
        isSuccess: true,
        message: "Connection request sent",
        result: updated,
      });
      return;
    }

    const created = await prisma.patientProfessionalConnection.create({
      data: {
        patientUserId: userId,
        professionalUserId,
        status: ConnectionStatus.PENDING,
        requestedBy: ConnectionRequestedBy.PATIENT,
        reason,
      },
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId,
      action: "CONNECTION_REQUESTED",
      entity: "PatientProfessionalConnection",
      entityId: created.id,
      metadata: { professionalUserId, reason },
      ...meta,
    });

    await notifyConnection(professionalUserId, userId, "requested");

    res.status(201).json({
      isSuccess: true,
      message: "Connection request sent",
      result: created,
    });
  } catch (error) {
    console.error("requestConnection error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to request connection",
    });
  }
};

async function notifyConnection(
  toUserId: string,
  fromUserId: string,
  kind: "requested" | "accepted" | "rejected" | "ended"
) {
  const from = await prisma.user.findUnique({
    where: { userid: fromUserId },
    select: { fullName: true },
  });
  const titles: Record<typeof kind, string> = {
    requested: "New connection request",
    accepted: "Connection accepted",
    rejected: "Connection rejected",
    ended: "Connection ended",
  };
  const bodies: Record<typeof kind, string> = {
    requested: `${from?.fullName || "A patient"} requested to connect with you.`,
    accepted: `${from?.fullName || "A professional"} accepted your connection.`,
    rejected: `${from?.fullName || "A professional"} declined your connection.`,
    ended: `${from?.fullName || "Someone"} ended the healthcare connection.`,
  };
  await prisma.notification
    .create({
      data: {
        userId: toUserId,
        type: NotificationType.CONNECTION,
        channel: NotificationChannel.IN_APP,
        title: titles[kind],
        body: bodies[kind],
        metadata: { fromUserId, kind },
      },
    })
    .catch(() => undefined);
}

/** GET /connections */
export const listConnections = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const status =
      typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";

    const whereStatus =
      status && Object.values(ConnectionStatus).includes(status as ConnectionStatus)
        ? (status as ConnectionStatus)
        : undefined;

    const rows = await prisma.patientProfessionalConnection.findMany({
      where: {
        OR: [{ patientUserId: userId }, { professionalUserId: userId }],
        ...(whereStatus ? { status: whereStatus } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        patient: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
            profile: { select: { healthId: true, city: true } },
          },
        },
        professional: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
            role: true,
            professionalProfiles: {
              take: 1,
              select: {
                professionalType: true,
                specialization: true,
                isVerified: true,
                publicPhotoUrl: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ isSuccess: true, result: rows });
  } catch (error) {
    console.error("listConnections error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to list connections",
    });
  }
};

/** GET /connections/requests — pending for professional */
export const listConnectionRequests = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const rows = await prisma.patientProfessionalConnection.findMany({
      where: {
        professionalUserId: userId,
        status: ConnectionStatus.PENDING,
      },
      orderBy: { requestedAt: "desc" },
      include: {
        patient: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
            profile: { select: { healthId: true, city: true } },
          },
        },
      },
    });

    res.status(200).json({ isSuccess: true, result: rows });
  } catch (error) {
    console.error("listConnectionRequests error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to list requests",
    });
  }
};

async function mutateConnectionStatus(
  req: Request,
  res: Response,
  nextStatus: ConnectionStatus
) {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const row = await prisma.patientProfessionalConnection.findUnique({
      where: { id },
    });
    if (!row) {
      res.status(404).json({ isSuccess: false, message: "Connection not found" });
      return;
    }

    const isPatient = row.patientUserId === userId;
    const isPro = row.professionalUserId === userId;
    if (!isPatient && !isPro) {
      res.status(403).json({ isSuccess: false, message: "Not allowed" });
      return;
    }

    if (nextStatus === ConnectionStatus.ACCEPTED || nextStatus === ConnectionStatus.REJECTED) {
      if (!isPro) {
        res.status(403).json({
          isSuccess: false,
          message: "Only the professional can accept or reject",
        });
        return;
      }
      if (row.status !== ConnectionStatus.PENDING) {
        res.status(400).json({
          isSuccess: false,
          message: "Only pending requests can be accepted or rejected",
        });
        return;
      }
    }

    if (nextStatus === ConnectionStatus.ENDED || nextStatus === ConnectionStatus.BLOCKED) {
      if (row.status !== ConnectionStatus.ACCEPTED && row.status !== ConnectionStatus.PENDING) {
        res.status(400).json({
          isSuccess: false,
          message: "Connection cannot be ended from this status",
        });
        return;
      }
    }

    const updated = await prisma.patientProfessionalConnection.update({
      where: { id },
      data: {
        status: nextStatus,
        acceptedAt: nextStatus === ConnectionStatus.ACCEPTED ? new Date() : row.acceptedAt,
        rejectedAt: nextStatus === ConnectionStatus.REJECTED ? new Date() : row.rejectedAt,
        endedAt:
          nextStatus === ConnectionStatus.ENDED || nextStatus === ConnectionStatus.BLOCKED
            ? new Date()
            : row.endedAt,
      },
    });

    const actionMap: Record<string, string> = {
      ACCEPTED: "CONNECTION_ACCEPTED",
      REJECTED: "CONNECTION_REJECTED",
      ENDED: "CONNECTION_ENDED",
      BLOCKED: "CONNECTION_ENDED",
    };

    await createAuditLog({
      userId,
      action: actionMap[nextStatus] || "CONNECTION_UPDATED",
      entity: "PatientProfessionalConnection",
      entityId: id,
      metadata: { status: nextStatus },
      ...getClientMeta(req),
    });

    const notifyTarget = isPro ? row.patientUserId : row.professionalUserId;
    const kind =
      nextStatus === ConnectionStatus.ACCEPTED
        ? "accepted"
        : nextStatus === ConnectionStatus.REJECTED
          ? "rejected"
          : "ended";
    await notifyConnection(notifyTarget, userId, kind);

    res.status(200).json({
      isSuccess: true,
      message: `Connection ${nextStatus.toLowerCase()}`,
      result: updated,
    });
  } catch (error) {
    console.error("mutateConnectionStatus error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to update connection",
    });
  }
}

export const acceptConnection = (req: Request, res: Response) =>
  mutateConnectionStatus(req, res, ConnectionStatus.ACCEPTED);

export const rejectConnection = (req: Request, res: Response) =>
  mutateConnectionStatus(req, res, ConnectionStatus.REJECTED);

export const endConnection = (req: Request, res: Response) =>
  mutateConnectionStatus(req, res, ConnectionStatus.ENDED);
