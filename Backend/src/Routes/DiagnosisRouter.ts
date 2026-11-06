import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.diagnosis, {
  include: { doctor: true },
  sanitizeCreate: (body) => ({
    doctorId: optionalString(body.doctorId) ?? null,
    appointmentId: optionalString(body.appointmentId) ?? null,
    consultationId: optionalString(body.consultationId) ?? null,
    diagnosis: requireString(body.diagnosis, "diagnosis"),
    icdCode: optionalString(body.icdCode) ?? null,
    description: optionalString(body.description) ?? null,
    diagnosedAt: parseDate(body.diagnosedAt, "diagnosedAt") ?? new Date(),
    isPrimary: parseBool(body.isPrimary, false),
    status: optionalString(body.status) ?? null,
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.diagnosis !== undefined)
      data.diagnosis = requireString(body.diagnosis, "diagnosis");
    if (body.icdCode !== undefined) data.icdCode = optionalString(body.icdCode) ?? null;
    if (body.description !== undefined)
      data.description = optionalString(body.description) ?? null;
    if (body.diagnosedAt !== undefined)
      data.diagnosedAt = parseDate(body.diagnosedAt, "diagnosedAt") ?? undefined;
    if (body.isPrimary !== undefined) data.isPrimary = parseBool(body.isPrimary);
    if (body.status !== undefined) data.status = optionalString(body.status) ?? null;
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    if (body.doctorId !== undefined) data.doctorId = optionalString(body.doctorId) ?? null;
    if (body.appointmentId !== undefined)
      data.appointmentId = optionalString(body.appointmentId) ?? null;
    if (body.consultationId !== undefined)
      data.consultationId = optionalString(body.consultationId) ?? null;
    return data;
  },
});
