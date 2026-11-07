import { Role } from "@prisma/client";
import { Request } from "express";
import { CustomUserRequest } from "../helpers/middleware/VerifyToken";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const requireUser = (req: Request) => {
  const user = (req as CustomUserRequest).user;
  if (!user) throw new HttpError(401, "Unauthorized");
  return user;
};

export const resolveTargetUserId = (
  req: Request,
  bodyUserId?: string | null
) => {
  const user = requireUser(req);
  if (isAdminRole(user.role) && bodyUserId) return bodyUserId;
  return user.userId;
};

export const assertOwnerOrAdmin = (
  ownerUserId: string | null | undefined,
  actor: { userId: string; role: Role },
  message = "Forbidden"
) => {
  if (isAdminRole(actor.role)) return;
  if (!ownerUserId || ownerUserId !== actor.userId) {
    throw new HttpError(403, message);
  }
};

/** Patient owner OR admin OR the assigned doctor for appointment/consultation-linked data */
export const assertPatientOrDoctorOrAdmin = async (
  patientUserId: string,
  actor: { userId: string; role: Role },
  opts?: { doctorId?: string | null; appointmentId?: string | null }
) => {
  if (isAdminRole(actor.role)) return;
  if (patientUserId === actor.userId) return;

  const doctor = await prisma.doctor.findUnique({
    where: { userId: actor.userId },
    select: { id: true },
  });
  if (!doctor) throw new HttpError(403, "Forbidden");

  if (opts?.doctorId && opts.doctorId === doctor.id) return;

  if (opts?.appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: opts.appointmentId },
      select: { doctorId: true, userId: true },
    });
    if (appt?.doctorId === doctor.id) return;
  }

  throw new HttpError(403, "Forbidden");
};

export const getActorDoctorId = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });
  return doctor?.id ?? null;
};
