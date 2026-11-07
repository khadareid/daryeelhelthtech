import { AccessRequestType, ConsentStatus, Prisma, Role } from "@prisma/client";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseDate,
  parseEnum,
  requireString,
} from "../utils/validation";

export const listAccessRequests = async (
  actor: { userId: string; role: Role },
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.MedicalAccessRequestWhereInput = {};

  if (isAdminRole(actor.role)) {
    if (query.patientId) where.patientId = String(query.patientId);
    if (query.requesterId) where.requesterId = String(query.requesterId);
  } else if (query.box === "sent") {
    where.requesterId = actor.userId;
  } else if (query.box === "received") {
    where.patientId = actor.userId;
  } else {
    where.OR = [
      { requesterId: actor.userId },
      { patientId: actor.userId },
    ];
  }

  if (query.status) {
    where.status = parseEnum(
      query.status,
      Object.values(ConsentStatus),
      "status",
      true
    );
  }

  const [items, total] = await Promise.all([
    prisma.medicalAccessRequest.findMany({
      where,
      include: {
        requester: {
          select: { userid: true, fullName: true, email: true },
        },
        patient: {
          select: { userid: true, fullName: true, email: true },
        },
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take,
    }),
    prisma.medicalAccessRequest.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const createAccessRequest = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const patientId = requireString(body.patientId, "patientId");
  if (patientId === actor.userId) {
    throw new HttpError(400, "Cannot request access to your own records");
  }

  const patient = await prisma.user.findFirst({
    where: { userid: patientId, deletedAt: null },
  });
  if (!patient) throw new HttpError(404, "Patient not found");

  return prisma.medicalAccessRequest.create({
    data: {
      requesterId: actor.userId,
      patientId,
      requestType: parseEnum(
        body.requestType,
        Object.values(AccessRequestType),
        "requestType",
        true
      )!,
      message: optionalString(body.message) ?? null,
      expiresAt: parseDate(body.expiresAt, "expiresAt") ?? null,
    },
  });
};

export const respondAccessRequest = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await prisma.medicalAccessRequest.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "Access request not found");

  if (!isAdminRole(actor.role) && row.patientId !== actor.userId) {
    throw new HttpError(403, "Only the patient can respond");
  }

  const status = parseEnum(
    body.status,
    [ConsentStatus.APPROVED, ConsentStatus.REJECTED, ConsentStatus.REVOKED],
    "status",
    true
  )!;

  return prisma.medicalAccessRequest.update({
    where: { id },
    data: {
      status,
      respondedAt: new Date(),
    },
  });
};
