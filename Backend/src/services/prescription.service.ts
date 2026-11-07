import { Prisma, Role } from "@prisma/client";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { generatePrescriptionNumber } from "../utils/codes";
import {
  assertOwnerOrAdmin,
  getActorDoctorId,
  HttpError,
} from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

type ItemInput = {
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  duration?: string | null;
  quantity?: string | null;
  instructions?: string | null;
  isActive?: boolean;
};

const sanitizeItems = (items: unknown): ItemInput[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "items array is required");
  }
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      medicineName: requireString(item.medicineName, "medicineName"),
      dosage: optionalString(item.dosage) ?? null,
      frequency: optionalString(item.frequency) ?? null,
      route: optionalString(item.route) ?? null,
      duration: optionalString(item.duration) ?? null,
      quantity: optionalString(item.quantity) ?? null,
      instructions: optionalString(item.instructions) ?? null,
      isActive: parseBool(item.isActive, true),
    };
  });
};

export const listPrescriptions = async (
  actor: { userId: string; role: Role },
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.PrescriptionWhereInput = {};

  if (isAdminRole(actor.role)) {
    if (query.userId) where.userId = String(query.userId);
  } else {
    const doctorId = await getActorDoctorId(actor.userId);
    if (doctorId && query.as === "doctor") {
      where.doctorId = doctorId;
    } else if (doctorId) {
      where.OR = [{ userId: actor.userId }, { doctorId }];
    } else {
      where.userId = actor.userId;
    }
  }

  const [items, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: { items: true, doctor: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.prescription.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getPrescription = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await prisma.prescription.findUnique({
    where: { id },
    include: { items: true, doctor: true },
  });
  if (!row) throw new HttpError(404, "Prescription not found");

  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    const doctorId = await getActorDoctorId(actor.userId);
    if (!doctorId || row.doctorId !== doctorId) {
      throw new HttpError(403, "Forbidden");
    }
  }
  return row;
};

export const createPrescription = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const userId =
    isAdminRole(actor.role) && body.userId
      ? requireString(body.userId, "userId")
      : (optionalString(body.userId) ?? actor.userId);

  const doctorId =
    optionalString(body.doctorId) ??
    (await getActorDoctorId(actor.userId));

  const items = sanitizeItems(body.items);

  return prisma.prescription.create({
    data: {
      userId,
      doctorId,
      appointmentId: optionalString(body.appointmentId) ?? null,
      consultationId: optionalString(body.consultationId) ?? null,
      prescriptionNumber:
        optionalString(body.prescriptionNumber) ||
        generatePrescriptionNumber(),
      issuedAt: parseDate(body.issuedAt, "issuedAt") ?? new Date(),
      startDate: parseDate(body.startDate, "startDate") ?? null,
      endDate: parseDate(body.endDate, "endDate") ?? null,
      status: optionalString(body.status) || "ACTIVE",
      notes: optionalString(body.notes) ?? null,
      items: { create: items },
    },
    include: { items: true, doctor: true },
  });
};

export const updatePrescription = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await getPrescription(id, actor);
  const doctorId = await getActorDoctorId(actor.userId);
  const canEdit =
    isAdminRole(actor.role) ||
    (doctorId && row.doctorId === doctorId) ||
    row.userId === actor.userId;

  if (!canEdit) throw new HttpError(403, "Forbidden");

  const data: Prisma.PrescriptionUpdateInput = {};
  if (body.status !== undefined) data.status = requireString(body.status, "status");
  if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
  if (body.startDate !== undefined)
    data.startDate = parseDate(body.startDate, "startDate") ?? null;
  if (body.endDate !== undefined)
    data.endDate = parseDate(body.endDate, "endDate") ?? null;

  if (Array.isArray(body.items)) {
    const items = sanitizeItems(body.items);
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
    data.items = { create: items };
  }

  return prisma.prescription.update({
    where: { id },
    data,
    include: { items: true, doctor: true },
  });
};

export const deletePrescription = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await getPrescription(id, actor);
  if (!isAdminRole(actor.role)) {
    assertOwnerOrAdmin(row.userId, actor);
  }
  return prisma.prescription.delete({ where: { id } });
};
