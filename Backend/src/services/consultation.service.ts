import {
  ConsultationStatus,
  ConsultationType,
  Prisma,
  Role,
} from "@prisma/client";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { generateConsultationCode } from "../utils/codes";
import {
  assertOwnerOrAdmin,
  getActorDoctorId,
  HttpError,
} from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseDate,
  parseEnum,
  requireString,
} from "../utils/validation";

export const listConsultations = async (
  actor: { userId: string; role: Role },
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.ConsultationWhereInput = {};

  if (isAdminRole(actor.role)) {
    if (query.userId) where.userId = String(query.userId);
    if (query.doctorId) where.doctorId = String(query.doctorId);
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

  if (query.status) {
    where.status = parseEnum(
      query.status,
      Object.values(ConsultationStatus),
      "status",
      true
    );
  }

  const [items, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: { doctor: true, appointment: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.consultation.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getConsultation = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await prisma.consultation.findUnique({
    where: { id },
    include: {
      doctor: true,
      appointment: true,
      diagnoses: true,
      prescriptions: { include: { items: true } },
    },
  });
  if (!row) throw new HttpError(404, "Consultation not found");

  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    const doctorId = await getActorDoctorId(actor.userId);
    if (!doctorId || row.doctorId !== doctorId) {
      throw new HttpError(403, "Forbidden");
    }
  }
  return row;
};

export const createConsultation = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const userId =
    isAdminRole(actor.role) && body.userId
      ? requireString(body.userId, "userId")
      : actor.userId;

  const type = parseEnum(
    body.type,
    Object.values(ConsultationType),
    "type",
    true
  )!;

  return prisma.consultation.create({
    data: {
      userId,
      doctorId: optionalString(body.doctorId) ?? null,
      appointmentId: optionalString(body.appointmentId) ?? null,
      consultationCode:
        optionalString(body.consultationCode) || generateConsultationCode(),
      type,
      status:
        parseEnum(body.status, Object.values(ConsultationStatus), "status") ||
        ConsultationStatus.SCHEDULED,
      scheduledAt: parseDate(body.scheduledAt, "scheduledAt") ?? null,
      meetingLink: optionalString(body.meetingLink) ?? null,
      patientNotes: optionalString(body.patientNotes) ?? null,
      doctorNotes: optionalString(body.doctorNotes) ?? null,
    },
    include: { doctor: true },
  });
};

export const updateConsultation = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await getConsultation(id, actor);
  const doctorId = await getActorDoctorId(actor.userId);
  const isDoctor = Boolean(doctorId && row.doctorId === doctorId);

  const data: Prisma.ConsultationUpdateInput = {};

  if (body.status !== undefined) {
    data.status = parseEnum(
      body.status,
      Object.values(ConsultationStatus),
      "status",
      true
    );
    if (data.status === ConsultationStatus.ACTIVE) data.startedAt = new Date();
    if (data.status === ConsultationStatus.COMPLETED) data.endedAt = new Date();
  }
  if (body.meetingLink !== undefined) {
    data.meetingLink = optionalString(body.meetingLink) ?? null;
  }
  if (body.summary !== undefined && (isDoctor || isAdminRole(actor.role))) {
    data.summary = optionalString(body.summary) ?? null;
  }
  if (
    body.diagnosisSummary !== undefined &&
    (isDoctor || isAdminRole(actor.role))
  ) {
    data.diagnosisSummary = optionalString(body.diagnosisSummary) ?? null;
  }
  if (
    body.treatmentPlan !== undefined &&
    (isDoctor || isAdminRole(actor.role))
  ) {
    data.treatmentPlan = optionalString(body.treatmentPlan) ?? null;
  }
  if (body.patientNotes !== undefined) {
    data.patientNotes = optionalString(body.patientNotes) ?? null;
  }
  if (body.doctorNotes !== undefined && (isDoctor || isAdminRole(actor.role))) {
    data.doctorNotes = optionalString(body.doctorNotes) ?? null;
  }
  if (body.followUpAt !== undefined) {
    data.followUpAt = parseDate(body.followUpAt, "followUpAt") ?? null;
  }
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = parseDate(body.scheduledAt, "scheduledAt") ?? null;
  }

  if (!isAdminRole(actor.role) && row.userId !== actor.userId && !isDoctor) {
    assertOwnerOrAdmin(row.userId, actor);
  }

  return prisma.consultation.update({
    where: { id },
    data,
    include: { doctor: true, appointment: true },
  });
};
